import type { LedgerMem } from "@ledgermem/memory";
import {
  isFolder,
  TEXT_EXPORTS,
  type DriveClientLike,
  type DriveFile,
} from "./drive-client.js";
import { loadState, saveState } from "./state.js";

export interface MemoryClient {
  add: LedgerMem["add"];
}

export interface SyncOptions {
  drive: DriveClientLike;
  memory: MemoryClient;
  folderId: string;
  statePath: string;
}

export interface SyncResult {
  ingested: number;
  skipped: number;
  visitedFolders: number;
}

function isIngestable(mimeType: string): boolean {
  return Object.keys(TEXT_EXPORTS).includes(mimeType);
}

export async function syncFolder(opts: SyncOptions): Promise<SyncResult> {
  const state = loadState(opts.statePath);
  const queue: string[] = [opts.folderId];
  let ingested = 0;
  let skipped = 0;
  let visitedFolders = 0;

  while (queue.length > 0) {
    const folderId = queue.shift() as string;
    visitedFolders += 1;
    const children = await opts.drive.listFolderChildren(folderId);
    for (const file of children) {
      if (isFolder(file.mimeType)) {
        queue.push(file.id);
        continue;
      }
      if (!isIngestable(file.mimeType)) {
        skipped += 1;
        continue;
      }
      const known = state.files[file.id];
      if (known && known.modifiedTime === file.modifiedTime) {
        skipped += 1;
        continue;
      }
      const text = await opts.drive.exportAsText(file.id, file.mimeType);
      await opts.memory.add(text, {
        metadata: {
          source: "gdrive",
          fileId: file.id,
          name: file.name,
          mimeType: file.mimeType,
          modifiedTime: file.modifiedTime,
          url: file.webViewLink ?? "",
        },
      });
      state.files[file.id] = {
        modifiedTime: file.modifiedTime,
        ingestedAt: new Date().toISOString(),
      };
      ingested += 1;
    }
  }

  state.lastRunAt = new Date().toISOString();
  saveState(opts.statePath, state);
  return { ingested, skipped, visitedFolders };
}

export type { DriveFile };

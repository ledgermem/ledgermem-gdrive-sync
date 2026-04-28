import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "node:fs";
import { dirname } from "node:path";

export interface FileState {
  modifiedTime: string;
  ingestedAt: string;
}

export interface SyncState {
  files: Record<string, FileState>;
  lastRunAt: string;
}

export function loadState(path: string): SyncState {
  if (!existsSync(path)) return { files: {}, lastRunAt: "" };
  const raw = JSON.parse(readFileSync(path, "utf8")) as unknown;
  if (typeof raw === "object" && raw !== null && "files" in raw) {
    return raw as SyncState;
  }
  return { files: {}, lastRunAt: "" };
}

export function saveState(path: string, state: SyncState): void {
  mkdirSync(dirname(path), { recursive: true });
  // Atomic write: write to a sibling tmp file then rename. Prevents corruption
  // if the process is killed mid-write or two runs race.
  const tmp = `${path}.${process.pid}.tmp`;
  writeFileSync(tmp, JSON.stringify(state, null, 2), "utf8");
  renameSync(tmp, path);
}

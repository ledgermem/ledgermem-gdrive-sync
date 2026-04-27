import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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
  writeFileSync(path, JSON.stringify(state, null, 2), "utf8");
}

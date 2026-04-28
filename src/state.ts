import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
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

let tmpCounter = 0;

export function saveState(path: string, state: SyncState): void {
  mkdirSync(dirname(path), { recursive: true });
  // Atomic write: tmp file lives in the same directory as the target so the
  // rename can never cross a filesystem boundary (renameSync would fail with
  // EXDEV if the tmp landed on a different mount, e.g. an NFS-mounted state
  // dir vs /tmp). Including pid + a monotonic counter keeps two concurrent
  // saves in the same process from clobbering each other's tmp file.
  const tmp = `${path}.${process.pid}.${tmpCounter++}.tmp`;
  writeFileSync(tmp, JSON.stringify(state, null, 2), "utf8");
  try {
    renameSync(tmp, path);
  } catch (err) {
    // Best-effort cleanup so we don't leave stray tmp files behind.
    try {
      unlinkSync(tmp);
    } catch {
      // ignore
    }
    throw err;
  }
}

/**
 * Acquire an exclusive lock alongside the state file so a cron-triggered
 * sync and a manual run cannot trample each other's writes. Lockfile is
 * created with O_EXCL ('wx'); if it already exists we throw and the caller
 * should bail. Returns a release function that removes the lockfile.
 */
export function acquireLock(statePath: string): () => void {
  mkdirSync(dirname(statePath), { recursive: true });
  const lockPath = `${statePath}.lock`;
  let fd: number;
  try {
    fd = openSync(lockPath, "wx");
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code === "EEXIST") {
      throw new Error(
        `gdrive-sync state is locked by another run: ${lockPath}. ` +
          `Delete the lockfile if you are sure no other process is running.`,
      );
    }
    throw err;
  }
  closeSync(fd);
  return () => {
    try {
      unlinkSync(lockPath);
    } catch {
      // ignore — lock was already released or filesystem hiccup.
    }
  };
}

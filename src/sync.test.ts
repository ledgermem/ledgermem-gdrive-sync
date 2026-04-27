import { describe, it, expect, vi, beforeEach } from "vitest";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { syncFolder } from "./sync.js";
import type { DriveClientLike, DriveFile } from "./drive-client.js";

describe("syncFolder", () => {
  let tmpStatePath: string;

  beforeEach(() => {
    const dir = mkdtempSync(join(tmpdir(), "gdrive-test-"));
    tmpStatePath = join(dir, "gdrive.json");
  });

  it("walks subfolders and ingests Google Docs", async () => {
    const tree: Record<string, DriveFile[]> = {
      root: [
        {
          id: "doc1",
          name: "Notes.gdoc",
          mimeType: "application/vnd.google-apps.document",
          modifiedTime: "2025-01-01T00:00:00Z",
        },
        {
          id: "sub1",
          name: "Subfolder",
          mimeType: "application/vnd.google-apps.folder",
          modifiedTime: "2025-01-01T00:00:00Z",
        },
        {
          id: "img1",
          name: "photo.png",
          mimeType: "image/png",
          modifiedTime: "2025-01-01T00:00:00Z",
        },
      ],
      sub1: [
        {
          id: "doc2",
          name: "Inner.gdoc",
          mimeType: "application/vnd.google-apps.document",
          modifiedTime: "2025-01-02T00:00:00Z",
        },
      ],
    };

    const drive: DriveClientLike = {
      listFolderChildren: vi.fn(async (id: string) => tree[id] ?? []),
      exportAsText: vi.fn(async (id: string) => `text-of-${id}`),
    };
    const memoryAdd = vi.fn(async () => undefined);
    const memory = { add: memoryAdd } as unknown as Parameters<typeof syncFolder>[0]["memory"];

    const result = await syncFolder({
      drive,
      memory,
      folderId: "root",
      statePath: tmpStatePath,
    });

    expect(result.ingested).toBe(2);
    expect(result.skipped).toBe(1);
    expect(result.visitedFolders).toBe(2);
    expect(memoryAdd).toHaveBeenCalledTimes(2);
  });

  it("skips files whose modifiedTime hasn't changed", async () => {
    const drive: DriveClientLike = {
      listFolderChildren: vi.fn(async () => [
        {
          id: "doc1",
          name: "Notes.gdoc",
          mimeType: "application/vnd.google-apps.document",
          modifiedTime: "2025-01-01T00:00:00Z",
        },
      ]),
      exportAsText: vi.fn(async () => "hello"),
    };
    const memoryAdd = vi.fn(async () => undefined);
    const memory = { add: memoryAdd } as unknown as Parameters<typeof syncFolder>[0]["memory"];

    await syncFolder({ drive, memory, folderId: "root", statePath: tmpStatePath });
    const second = await syncFolder({
      drive,
      memory,
      folderId: "root",
      statePath: tmpStatePath,
    });
    expect(second.ingested).toBe(0);
    expect(second.skipped).toBe(1);
    expect(memoryAdd).toHaveBeenCalledTimes(1);
  });
});

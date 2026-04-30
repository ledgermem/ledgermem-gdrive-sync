#!/usr/bin/env node
import "dotenv/config";
import { Mnemo } from "@mnemo/memory";
import { loadConfig } from "./config.js";
import { GoogleDriveClient } from "./drive-client.js";
import { syncFolder } from "./sync.js";

function parseArgs(argv: string[]): { folder?: string; cmd: string } {
  const cmd = argv[0] ?? "sync";
  let folder: string | undefined;
  for (let i = 1; i < argv.length; i += 1) {
    if (argv[i] === "--folder" && argv[i + 1]) {
      folder = argv[i + 1];
      i += 1;
    }
  }
  return { cmd, folder };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  if (args.cmd !== "sync") {
    process.stderr.write(`Unknown command: ${args.cmd}\nUsage: gdrive-sync sync [--folder <id>]\n`);
    process.exit(2);
  }
  const cfg = loadConfig();
  const folderId = args.folder ?? cfg.folderId;
  const memory = new Mnemo({
    apiKey: cfg.getmnemoApiKey,
    workspaceId: cfg.getmnemoWorkspaceId,
  });
  const drive = new GoogleDriveClient(cfg.credentialsPath);
  const result = await syncFolder({
    drive,
    memory,
    folderId,
    statePath: cfg.statePath,
  });
  process.stdout.write(
    `gdrive-sync done: ingested=${result.ingested} skipped=${result.skipped} folders=${result.visitedFolders}\n`,
  );
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`gdrive-sync failed: ${message}\n`);
  process.exit(1);
});

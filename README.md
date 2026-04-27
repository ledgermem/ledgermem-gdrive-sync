# @ledgermem/gdrive-sync

LedgerMem connector for Google Drive. Recursively walks a Drive folder, exports Google Docs / Sheets / Slides / PDFs as text, and ingests them into your LedgerMem workspace.

## Install

```bash
npm install -g @ledgermem/gdrive-sync
```

## Setup

1. Create a service account in Google Cloud Console with **Drive API** enabled.
2. Download the JSON key and set `GOOGLE_APPLICATION_CREDENTIALS=/path/to/key.json`.
3. Share the target Drive folder with the service-account email (Viewer is enough).
4. Get your LedgerMem API key + workspace ID.
5. Copy `.env.example` to `.env` and fill in.

## Run

```bash
gdrive-sync sync                    # uses GDRIVE_FOLDER_ID
gdrive-sync sync --folder <id>      # override
```

State (per-file `modifiedTime`) is stored at `~/.ledgermem/gdrive.json`. Subsequent runs only re-ingest files whose `modifiedTime` has changed.

## Env vars

| Variable | Required | Description |
| --- | --- | --- |
| `GDRIVE_FOLDER_ID` | yes | Root folder ID to walk |
| `GOOGLE_APPLICATION_CREDENTIALS` | yes | Path to service-account JSON |
| `LEDGERMEM_API_KEY` | yes | LedgerMem API key |
| `LEDGERMEM_WORKSPACE_ID` | yes | LedgerMem workspace ID |
| `GDRIVE_STATE_PATH` | no | State file (default `~/.ledgermem/gdrive.json`) |

## Memory metadata

- `source: "gdrive"`
- `fileId`
- `name`
- `mimeType`
- `modifiedTime`
- `url` (web view link)

## License

MIT

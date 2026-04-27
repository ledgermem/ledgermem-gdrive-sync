export interface GDriveConfig {
  folderId: string;
  credentialsPath: string;
  ledgermemApiKey: string;
  ledgermemWorkspaceId: string;
  statePath: string;
}

const REQUIRED = [
  "GDRIVE_FOLDER_ID",
  "GOOGLE_APPLICATION_CREDENTIALS",
  "LEDGERMEM_API_KEY",
  "LEDGERMEM_WORKSPACE_ID",
] as const;

export function loadConfig(): GDriveConfig {
  const missing = REQUIRED.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
  const home = process.env.HOME ?? process.env.USERPROFILE ?? ".";
  return {
    folderId: process.env.GDRIVE_FOLDER_ID as string,
    credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS as string,
    ledgermemApiKey: process.env.LEDGERMEM_API_KEY as string,
    ledgermemWorkspaceId: process.env.LEDGERMEM_WORKSPACE_ID as string,
    statePath:
      process.env.GDRIVE_STATE_PATH ?? `${home}/.ledgermem/gdrive.json`,
  };
}

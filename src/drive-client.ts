import { google, type drive_v3 } from "googleapis";

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  parents?: string[];
  webViewLink?: string;
}

export interface DriveClientLike {
  listFolderChildren(folderId: string): Promise<DriveFile[]>;
  exportAsText(fileId: string, mimeType: string): Promise<string>;
}

const FOLDER_MIME = "application/vnd.google-apps.folder";

export const TEXT_EXPORTS: Record<string, string> = {
  "application/vnd.google-apps.document": "text/plain",
  "application/vnd.google-apps.spreadsheet": "text/csv",
  "application/vnd.google-apps.presentation": "text/plain",
  "application/pdf": "text/plain",
};

export class GoogleDriveClient implements DriveClientLike {
  private readonly drive: drive_v3.Drive;

  constructor(credentialsPath: string) {
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    this.drive = google.drive({ version: "v3", auth });
  }

  async listFolderChildren(folderId: string): Promise<DriveFile[]> {
    const out: DriveFile[] = [];
    let pageToken: string | undefined = undefined;
    do {
      const res = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields:
          "nextPageToken, files(id, name, mimeType, modifiedTime, parents, webViewLink)",
        pageSize: 100,
        pageToken,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });
      const files = res.data.files ?? [];
      for (const f of files) {
        if (!f.id || !f.name || !f.mimeType || !f.modifiedTime) continue;
        out.push({
          id: f.id,
          name: f.name,
          mimeType: f.mimeType,
          modifiedTime: f.modifiedTime,
          parents: f.parents ?? undefined,
          webViewLink: f.webViewLink ?? undefined,
        });
      }
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken);
    return out;
  }

  async exportAsText(fileId: string, mimeType: string): Promise<string> {
    if (mimeType.startsWith("application/vnd.google-apps.")) {
      const exportType = TEXT_EXPORTS[mimeType] ?? "text/plain";
      const res = await this.drive.files.export(
        { fileId, mimeType: exportType },
        { responseType: "text" },
      );
      return typeof res.data === "string" ? res.data : String(res.data);
    }
    const res = await this.drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true },
      { responseType: "text" },
    );
    return typeof res.data === "string" ? res.data : String(res.data);
  }
}

export function isFolder(mimeType: string): boolean {
  return mimeType === FOLDER_MIME;
}

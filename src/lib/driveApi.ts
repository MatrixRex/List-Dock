import type { Item } from '../types';

export interface SyncData {
  items: Item[];
  deletedItems: Record<string, number>;
  version: number;
  lastSynced: number;
}

const DRIVE_FILE_NAME = 'list-dock-sync.json';

/**
 * Custom error class to represent unauthorized / expired session issues specifically.
 */
export class AuthError extends Error {
  constructor(message = 'UNAUTHORIZED') {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Checks the HTTP response and throws appropriate errors.
 */
async function handleResponse(response: Response) {
  if (response.status === 401) {
    throw new AuthError();
  }
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Drive API error (${response.status}): ${text || response.statusText}`);
  }
  return response;
}

/**
 * Searches for list-dock-sync.json in the user's Google Drive.
 * Returns the file ID if found, or null if not.
 */
export async function findSyncFile(token: string): Promise<string | null> {
  const query = `name = '${DRIVE_FILE_NAME}' and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await handleResponse(response);
  const data = await response.json();

  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
}

/**
 * Reads the content of the list-dock-sync.json file by its ID.
 */
export async function readSyncFile(token: string, fileId: string): Promise<SyncData> {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  await handleResponse(response);
  return response.json();
}

/**
 * Creates list-dock-sync.json on Google Drive and writes the initial data.
 * Returns the created file's ID.
 */
export async function createSyncFile(token: string, data: SyncData): Promise<string> {
  // Step 1: Create metadata
  const metadataUrl = 'https://www.googleapis.com/drive/v3/files';
  const metadataResponse = await fetch(metadataUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: DRIVE_FILE_NAME,
      mimeType: 'application/json',
    }),
  });

  await handleResponse(metadataResponse);
  const metadata = await metadataResponse.json();
  const fileId = metadata.id;

  // Step 2: Upload content
  await updateSyncFile(token, fileId, data);

  return fileId;
}

/**
 * Updates the content of the list-dock-sync.json file.
 */
export async function updateSyncFile(token: string, fileId: string, data: SyncData): Promise<void> {
  const uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`;

  const response = await fetch(uploadUrl, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  await handleResponse(response);
}

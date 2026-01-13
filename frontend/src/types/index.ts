// File types
export interface FileItem {
  id: number;
  fileName: string;
  fileSize: number;
  contentType: string;
  uploadedAt: string;
  lastAccessedAt: string | null;
  isStarred: boolean;
  folderId?: number | null;
}

// Folder types
export interface Folder {
  id: number;
  name: string;
  parentFolderId: number | null;
  color: string;
  createdAt: string;
  updatedAt: string | null;
  fileCount?: number;
  subFolderCount?: number;
}

export interface FolderDetail extends Folder {
  files: FileItem[];
  subFolders: {
    id: number;
    name: string;
    color: string;
    createdAt: string;
    fileCount: number;
  }[];
}

export interface CreateFolderRequest {
  name: string;
  parentFolderId?: number | null;
  color?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  color?: string;
  parentFolderId?: number | null;
}

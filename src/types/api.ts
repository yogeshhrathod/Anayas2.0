/**
 * API-related type definitions
 * Request/response types for Electron API communication
 */

import { Request, Environment, Collection, Folder, RequestHistory, ResponseData } from './entities';

// Generic API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Collection API types
export interface CollectionCreateRequest {
  name: string;
  description: string;
  variables: Record<string, string>;
  isFavorite: boolean;
}

export interface CollectionUpdateRequest extends CollectionCreateRequest {
  id: number;
}

export interface CollectionListResponse extends ApiResponse<Collection[]> {}

export interface CollectionSaveResponse extends ApiResponse<{ id: number }> {}

// Environment API types
export interface EnvironmentCreateRequest {
  name: string;
  displayName: string;
  variables: Record<string, string>;
  isDefault: boolean;
}

export interface EnvironmentUpdateRequest extends EnvironmentCreateRequest {
  id: number;
}

export interface EnvironmentListResponse extends ApiResponse<Environment[]> {}

export interface EnvironmentSaveResponse extends ApiResponse<{ id: number }> {}

export interface EnvironmentTestRequest {
  name: string;
  displayName: string;
  variables: Record<string, string>;
}

export interface EnvironmentTestResponse extends ApiResponse<{ success: boolean }> {}

// Request API types
export interface RequestCreateRequest {
  name: string;
  method: Request['method'];
  url: string;
  headers: Record<string, string>;
  body: string;
  queryParams: Array<{ key: string; value: string; enabled: boolean }>;
  auth: Request['auth'];
  collectionId: number;
  folderId?: number;
  isFavorite: boolean;
}

export interface RequestUpdateRequest extends RequestCreateRequest {
  id: number;
}

export interface RequestSendRequest {
  method: Request['method'];
  url: string;
  headers: Record<string, string>;
  body: string;
  auth: Request['auth'];
}

export interface RequestSendResponse extends ApiResponse<ResponseData> {}

export interface RequestListResponse extends ApiResponse<Request[]> {}

export interface RequestHistoryResponse extends ApiResponse<RequestHistory[]> {}

export interface RequestSaveResponse extends ApiResponse<{ id: number }> {}

// Folder API types
export interface FolderCreateRequest {
  name: string;
  description: string;
  collectionId: number;
}

export interface FolderUpdateRequest extends FolderCreateRequest {
  id: number;
}

export interface FolderListResponse extends ApiResponse<Folder[]> {}

export interface FolderSaveResponse extends ApiResponse<{ id: number }> {}

// Settings API types
export interface SettingsGetAllResponse extends ApiResponse<Record<string, any>> {}

export interface SettingsSetRequest {
  key: string;
  value: any;
}

export interface SettingsSetResponse extends ApiResponse<void> {}

// File API types
export interface FileSelectRequest {
  filters: Array<{ name: string; extensions: string[] }>;
}

export interface FileSelectResponse extends ApiResponse<string> {}

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

// Electron API interface (matches preload.ts)
export interface ElectronAPI {
  collection: {
    list: () => Promise<Collection[]>;
    save: (data: CollectionCreateRequest | CollectionUpdateRequest) => Promise<CollectionSaveResponse>;
    delete: (id: number) => Promise<ApiResponse<void>>;
    toggleFavorite: (id: number) => Promise<ApiResponse<void>>;
  };
  env: {
    list: () => Promise<Environment[]>;
    getCurrent: () => Promise<Environment | null>;
    save: (data: EnvironmentCreateRequest | EnvironmentUpdateRequest) => Promise<EnvironmentSaveResponse>;
    delete: (id: number) => Promise<ApiResponse<void>>;
    test: (data: EnvironmentTestRequest) => Promise<EnvironmentTestResponse>;
    import: (filePath: string) => Promise<ApiResponse<EnvironmentCreateRequest>>;
  };
  request: {
    list: (collectionId?: number) => Promise<Request[]>;
    save: (data: RequestCreateRequest | RequestUpdateRequest) => Promise<RequestSaveResponse>;
    saveAfter: (data: RequestCreateRequest, afterRequestId: number) => Promise<RequestSaveResponse>;
    reorder: (requestId: number, newOrder: number) => Promise<ApiResponse<void>>;
    delete: (id: number) => Promise<ApiResponse<void>>;
    send: (data: RequestSendRequest) => Promise<RequestSendResponse>;
    history: (limit?: number) => Promise<RequestHistory[]>;
    deleteHistory: (id: number) => Promise<ApiResponse<void>>;
  };
  folder: {
    list: (collectionId?: number) => Promise<Folder[]>;
    save: (data: FolderCreateRequest | FolderUpdateRequest) => Promise<FolderSaveResponse>;
    saveAfter: (data: FolderCreateRequest, afterFolderId: number) => Promise<FolderSaveResponse>;
    reorder: (folderId: number, newOrder: number) => Promise<ApiResponse<void>>;
    delete: (id: number) => Promise<ApiResponse<void>>;
  };
  settings: {
    getAll: () => Promise<Record<string, any>>;
    set: (key: string, value: any) => Promise<void>;
    reset: () => Promise<void>;
  };
  file: {
    selectFile: (filters: Array<{ name: string; extensions: string[] }>) => Promise<string>;
  };
}

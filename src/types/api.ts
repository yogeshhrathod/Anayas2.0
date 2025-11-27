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

export type CollectionListResponse = ApiResponse<Collection[]>;

export type CollectionSaveResponse = ApiResponse<{ id: number }>;

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

export type EnvironmentListResponse = ApiResponse<Environment[]>;

export type EnvironmentSaveResponse = ApiResponse<{ id: number }>;

export interface EnvironmentTestRequest {
  name: string;
  displayName: string;
  variables: Record<string, string>;
}

export type EnvironmentTestResponse = ApiResponse<{ success: boolean }>;

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

export type RequestSendResponse = ApiResponse<ResponseData>;

export type RequestListResponse = ApiResponse<Request[]>;

export type RequestHistoryResponse = ApiResponse<RequestHistory[]>;

export type RequestSaveResponse = ApiResponse<{ id: number }>;

// Folder API types
export interface FolderCreateRequest {
  name: string;
  description: string;
  collectionId: number;
}

export interface FolderUpdateRequest extends FolderCreateRequest {
  id: number;
}

export type FolderListResponse = ApiResponse<Folder[]>;

export type FolderSaveResponse = ApiResponse<{ id: number }>;

// Settings API types
export type SettingsGetAllResponse = ApiResponse<Record<string, unknown>>;

export interface SettingsSetRequest {
  key: string;
  value: unknown;
}

export type SettingsSetResponse = ApiResponse<void>;

// File API types
export interface FileSelectRequest {
  filters: Array<{ name: string; extensions: string[] }>;
}

export type FileSelectResponse = ApiResponse<string>;

// Error types
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
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
    getAll: () => Promise<Record<string, unknown>>;
    set: (key: string, value: unknown) => Promise<void>;
    reset: () => Promise<void>;
  };
  file: {
    selectFile: (filters: Array<{ name: string; extensions: string[] }>) => Promise<string>;
  };
}

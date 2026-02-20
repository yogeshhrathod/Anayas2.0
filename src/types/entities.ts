/**
 * Core entity types for the Luna application
 * Centralized type definitions for all data models
 */

export interface Request {
  id?: EntityId;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  url: string;
  headers: Record<string, string>;
  body: string;
  queryParams: Array<{ key: string; value: string; enabled: boolean }>;
  auth: {
    type: 'none' | 'bearer' | 'basic' | 'apikey';
    token?: string;
    username?: string;
    password?: string;
    apiKey?: string;
    apiKeyHeader?: string;
  };
  collectionId?: number;
  folderId?: number;
  isFavorite: number;
  order?: number;
  lastResponse?: ResponseData; // Saved response from last request execution
  createdAt?: string;
}

export interface Environment {
  id?: number;
  name: string;
  displayName: string;
  variables: Record<string, string>;
  isDefault?: number;
  lastUsed?: string;
  createdAt?: string;
}

export interface CollectionEnvironment {
  id?: number;
  name: string;
  variables: Record<string, string>;
}

export interface Collection {
  id?: number;
  name: string;
  description?: string;
  documentation?: string; // Markdown documentation for the collection
  environments?: CollectionEnvironment[]; // Collection-specific environments
  activeEnvironmentId?: number; // Currently selected environment for this collection
  isFavorite: number;
  createdAt?: string;
  lastUsed?: string;
}

export interface Folder {
  id?: number;
  name: string;
  description?: string;
  collectionId: number;
  order?: number;
  createdAt?: string;
}

export interface RequestHistory {
  id?: number;
  method: string;
  url: string;
  status: number;
  responseTime: number;
  response_body?: string;
  headers?: string;
  createdAt?: string;
  requestId?: EntityId; // Link to original saved request
  collectionId?: number; // Link to collection if request was saved
  requestBody?: string; // Store request body for reconstruction
  queryParams?: Array<{ key: string; value: string; enabled: boolean }>; // Store query params
  auth?: any; // Store auth info
  requestName?: string; // Name of the request (for saved requests)
}

export interface RequestPreset {
  id: string;
  name: string;
  description?: string;
  requestId?: EntityId; // The request this preset belongs to
  requestData: {
    method: Request['method'];
    url: string;
    headers: Record<string, string>;
    body: string;
    queryParams: Array<{ key: string; value: string; enabled: boolean }>;
    auth: Request['auth'];
  };
}

export interface RequestProgress {
  step: string;
  message: string;
  progress: number;
  status?: string;
  responseTime?: number;
  size?: number;
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data: any;
  time: number;
}

// Utility types for API operations
export type EntityId = number | string;
export type EntityType = 'collection' | 'environment' | 'request' | 'folder' | 'history';

export interface EntityOperation<T> {
  type: 'create' | 'update' | 'delete' | 'read';
  entity: T;
  id?: EntityId;
}

export interface EntityListResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}

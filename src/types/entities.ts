/**
 * Core entity types for the Anayas application
 * Centralized type definitions for all data models
 */

export interface Request {
  id?: number;
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
  collection_id?: number;
  folder_id?: number;
  is_favorite: number;
  created_at?: string;
}

export interface Environment {
  id?: number;
  name: string;
  display_name: string;
  variables: Record<string, string>;
  is_default?: number;
  last_used?: string;
  created_at?: string;
}

export interface Collection {
  id?: number;
  name: string;
  description: string;
  variables: Record<string, string>;
  is_favorite: boolean;
  created_at?: string;
  last_used?: string;
}

export interface Folder {
  id?: number;
  name: string;
  description: string;
  collection_id: number;
  created_at?: string;
}

export interface RequestHistory {
  id?: number;
  method: string;
  url: string;
  status: number;
  responseTime: number;
  response_body?: string;
  headers?: string;
  created_at?: string;
}

export interface RequestPreset {
  id: string;
  name: string;
  description?: string;
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
export type EntityId = number;
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

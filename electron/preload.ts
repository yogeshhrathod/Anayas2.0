import { contextBridge, ipcRenderer, type IpcRendererEvent } from 'electron';

export interface Environment {
  id?: number;
  name: string;
  displayName: string;
  variables: Record<string, string>;
  isDefault?: boolean;
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
  variables: Record<string, string>;
  environments?: CollectionEnvironment[];
  activeEnvironmentId?: number;
  isFavorite?: boolean;
  lastUsed?: string;
  createdAt?: string;
}

export interface Folder {
  id?: number;
  name: string;
  description?: string;
  collectionId: number;
  createdAt?: string;
}

export interface Request {
  id?: number;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  url: string;
  headers: Record<string, string>;
  body?: string | null;
  queryParams?: Array<{ key: string; value: string; enabled: boolean }>;
  auth?: any;
  collectionId?: number;
  folderId?: number;
  isFavorite?: boolean;
  order?: number;
  lastUsed?: string;
  createdAt?: string;
}

export interface RequestHistory {
  id?: number;
  method: string;
  url: string;
  status: number;
  responseTime: number;
  responseBody?: string;
  headers?: string;
  createdAt?: string;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
  url: string;
  headers?: Record<string, string>;
  body?: string;
  auth?: any;
  collectionId?: number;
  queryParams?: Array<{ key: string; value: string; enabled: boolean }>;
}

export interface SidebarState {
  expandedSections: string[];
  sectionOrder?: string[];
}

export interface RequestPreset {
  id?: string;
  name: string;
  description?: string;
  requestId?: number; // The request this preset belongs to
  requestData: {
    method: Request['method'];
    url: string;
    headers: Record<string, string>;
    body: string;
    queryParams: Array<{ key: string; value: string; enabled: boolean }>;
    auth: Request['auth'];
  };
}

const createIpcSubscription = (channel: string) => {
  return (callback: (data?: any) => void) => {
    const subscription = (_event: IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  };
};

const onCollectionsUpdated = createIpcSubscription('collections:updated');
const onRequestsUpdated = createIpcSubscription('requests:updated');
const onFoldersUpdated = createIpcSubscription('folders:updated');

const api = {
  // Environment operations
  env: {
    list: () => ipcRenderer.invoke('env:list'),
    save: (env: Environment) => ipcRenderer.invoke('env:save', env),
    delete: (id: number) => ipcRenderer.invoke('env:delete', id),
    test: (env: Environment) => ipcRenderer.invoke('env:test', env),
    import: (filePath: string) => ipcRenderer.invoke('env:import', filePath),
    getCurrent: () => ipcRenderer.invoke('env:getCurrent'),
    setCurrent: (id: number) => ipcRenderer.invoke('env:setCurrent', id),
  },

  // Collection operations
  collection: {
    list: () => ipcRenderer.invoke('collection:list'),
    save: (collection: Collection) => ipcRenderer.invoke('collection:save', collection),
    delete: (id: number) => ipcRenderer.invoke('collection:delete', id),
    toggleFavorite: (id: number) => ipcRenderer.invoke('collection:toggleFavorite', id),
    addEnvironment: (collectionId: number, environment: { name: string; variables: Record<string, string> }) => 
      ipcRenderer.invoke('collection:addEnvironment', collectionId, environment),
    updateEnvironment: (collectionId: number, environmentId: number, updates: Partial<CollectionEnvironment>) => 
      ipcRenderer.invoke('collection:updateEnvironment', collectionId, environmentId, updates),
    deleteEnvironment: (collectionId: number, environmentId: number) => 
      ipcRenderer.invoke('collection:deleteEnvironment', collectionId, environmentId),
    setActiveEnvironment: (collectionId: number, environmentId: number | null) => 
      ipcRenderer.invoke('collection:setActiveEnvironment', collectionId, environmentId),
    run: (collectionId: number) => ipcRenderer.invoke('collection:run', collectionId),
    onUpdated: onCollectionsUpdated,
  },

  // Folder operations
  folder: {
    list: (collectionId?: number) => ipcRenderer.invoke('folder:list', collectionId),
    save: (folder: Folder) => ipcRenderer.invoke('folder:save', folder),
    saveAfter: (folder: Folder, afterFolderId: number) => ipcRenderer.invoke('folder:saveAfter', folder, afterFolderId),
    reorder: (folderId: number, newOrder: number) => ipcRenderer.invoke('folder:reorder', folderId, newOrder),
    delete: (id: number) => ipcRenderer.invoke('folder:delete', id),
    onUpdated: onFoldersUpdated,
  },

  // Request operations
  request: {
    list: (collectionId?: number, folderId?: number) => ipcRenderer.invoke('request:list', collectionId, folderId),
    save: (request: Request) => ipcRenderer.invoke('request:save', request),
    saveAfter: (request: Request, afterRequestId: number) => ipcRenderer.invoke('request:saveAfter', request, afterRequestId),
    reorder: (requestId: number, newOrder: number) => ipcRenderer.invoke('request:reorder', requestId, newOrder),
    delete: (id: number) => ipcRenderer.invoke('request:delete', id),
    send: (options: RequestOptions) => ipcRenderer.invoke('request:send', options),
    history: (limit?: number) => ipcRenderer.invoke('request:history', limit),
    deleteHistory: (id: number) => ipcRenderer.invoke('request:deleteHistory', id),
    onUpdated: onRequestsUpdated,
  },

  // Unsaved Request operations
  unsavedRequest: {
    save: (request: any) => ipcRenderer.invoke('unsaved-request:save', request),
    getAll: () => ipcRenderer.invoke('unsaved-request:get-all'),
    delete: (id: string) => ipcRenderer.invoke('unsaved-request:delete', id),
    clear: () => ipcRenderer.invoke('unsaved-request:clear'),
    promote: (id: string, data: any) => ipcRenderer.invoke('unsaved-request:promote', id, data),
  },

  // Preset operations
  preset: {
    list: (requestId?: number) => ipcRenderer.invoke('preset:list', requestId),
    save: (preset: RequestPreset) => ipcRenderer.invoke('preset:save', preset),
    delete: (id: string) => ipcRenderer.invoke('preset:delete', id),
  },

  // cURL operations
  curl: {
    parse: (command: string) => ipcRenderer.invoke('curl:parse', command),
    generate: (request: Request) => ipcRenderer.invoke('curl:generate', request),
    importBulk: (commands: string[]) => ipcRenderer.invoke('curl:import-bulk', commands),
  },

  // Settings operations
  settings: {
    get: (key: string) => ipcRenderer.invoke('settings:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('settings:set', key, value),
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    reset: () => ipcRenderer.invoke('settings:reset'),
  },

  // Sidebar state operations
  sidebar: {
    getState: () => ipcRenderer.invoke('settings:getSidebarState'),
    setState: (state: SidebarState) => ipcRenderer.invoke('settings:setSidebarState', state),
  },

  // File operations
  file: {
    selectFile: (filters?: any) => ipcRenderer.invoke('file:select', filters),
    selectDirectory: () => ipcRenderer.invoke('file:selectDirectory'),
    saveFile: (defaultPath: string, content: string) => ipcRenderer.invoke('file:save', defaultPath, content),
    readFile: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
    writeFile: (filePath: string, content: string) => ipcRenderer.invoke('file:write', filePath, content),
  },

  // App operations
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
  },

  // Window controls
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },

  // Notification operations
  notification: {
    show: (options: { title: string; body: string; filePath?: string }) => 
      ipcRenderer.invoke('notification:show', options),
  },
};

contextBridge.exposeInMainWorld('electronAPI', api);

export type ElectronAPI = typeof api;

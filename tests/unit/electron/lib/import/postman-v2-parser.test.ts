import { describe, expect, it } from 'vitest';
import { PostmanV2Parser } from '../../../../../electron/lib/import/postman-v2-parser';
import { ImportFactory } from '../../../../../electron/lib/import/import-factory';

describe('PostmanV2Parser', () => {
  const parser = new PostmanV2Parser();

  const v2Sample = {
    info: {
      name: 'Sample V2',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    item: [
      {
        name: 'Folder 1',
        item: [
          {
            name: 'Get Request',
            request: {
              method: 'GET',
              url: { raw: 'https://api.com/get' },
              description: 'Desc'
            }
          }
        ]
      },
      {
        name: 'Post Request',
        request: {
          method: 'POST',
          url: 'https://api.com/post',
          header: [{ key: 'Content-Type', value: 'application/json' }],
          body: {
            mode: 'raw',
            raw: '{"k":"v"}',
            options: { raw: { language: 'json' } }
          }
        }
      }
    ],
    variable: [{ key: 'baseUrl', value: 'http://api.com' }]
  };

  describe('detect', () => {
    it('should detect valid Postman v2 format via schema', () => {
      expect(parser.detect(JSON.stringify(v2Sample))).toBe(true);
    });

    it('should not detect other formats', () => {
      expect(parser.detect(JSON.stringify({ id: 'v1', name: 'v1' }))).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse collection metadata', async () => {
      const result = await parser.parse(JSON.stringify(v2Sample));
      expect(result.collection.name).toBe('Sample V2');
      expect(result.source.version).toBe('2.1.0');
    });

    it('should parse nested items recursively', async () => {
      const result = await parser.parse(JSON.stringify(v2Sample));
      expect(result.folders).toHaveLength(1);
      expect(result.folders[0].name).toBe('Folder 1');
      expect(result.requests).toHaveLength(2);
      
      const nestedReq = result.requests.find(r => r.name === 'Get Request');
      expect(nestedReq?.folderTempId).toBe(result.folders[0].tempId);
    });

    it('should parse complex body types', async () => {
       const result = await parser.parse(JSON.stringify(v2Sample));
       const postReq = result.requests.find(r => r.method === 'POST');
       expect(postReq?.bodyType).toBe('json');
       expect(postReq?.body).toBe('{"k":"v"}');
    });

    it('should detect XML and Text bodies', async () => {
       const xmlSample = {
         info: { name: 'XML', schema: 'v2.1.0' },
         item: [{
           request: {
             method: 'POST',
             url: 'http://u.com',
             body: { mode: 'raw', raw: '<xml></xml>' }
           }
         }, {
           request: {
             method: 'POST',
             url: 'http://u.com',
             body: { mode: 'raw', raw: 'just text' }
           }
         }]
       };
       const result = await parser.parse(JSON.stringify(xmlSample));
       expect(result.requests[0].bodyType).toBe('xml');
       expect(result.requests[1].bodyType).toBe('text');
    });

    it('should parse auth types', async () => {
       const authSample = {
         info: { name: 'Auth', schema: 'v2.1.0' },
         item: [{
           name: 'auth-test',
           request: {
             method: 'GET',
             url: 'http://u.com',
             auth: {
               type: 'bearer',
               bearer: [{ key: 'token', value: 'secret-token' }]
             }
           }
         }]
       };
       const result = await parser.parse(JSON.stringify(authSample));
       expect(result.requests[0].auth.type).toBe('bearer');
       expect(result.requests[0].auth.token).toBe('secret-token');
    });

    it('should parse apiKey auth', async () => {
       const authSample = {
         info: { name: 'Auth', schema: 'v2.1.0' },
         item: [{
           request: {
             method: 'GET',
             url: 'http://u.com',
             auth: {
               type: 'apikey',
               apikey: [
                 { key: 'key', value: 'X-My-Key' },
                 { key: 'value', value: 'secret' },
                 { key: 'in', value: 'header' }
               ]
             }
           }
         }]
       };
       const result = await parser.parse(JSON.stringify(authSample));
       expect(result.requests[0].auth.type).toBe('apikey');
       expect(result.requests[0].auth.apiKey).toBe('secret');
       expect(result.requests[0].auth.apiKeyHeader).toBe('X-My-Key');
    });

    it('should parse oauth2 auth', async () => {
       const authSample = {
         info: { name: 'Auth', schema: 'v2.1.0' },
         item: [{
           request: {
             method: 'GET',
             url: 'http://u.com',
             auth: {
               type: 'oauth2',
               oauth2: [{ key: 'accessToken', value: 'token123' }]
             }
           }
         }]
       };
       const result = await parser.parse(JSON.stringify(authSample));
       expect(result.requests[0].auth.type).toBe('oauth2');
       expect(result.requests[0].auth.token).toBe('token123');
    });

    it('should parse collection variables as environment', async () => {
       const result = await parser.parse(JSON.stringify(v2Sample));
       expect(result.environments).toHaveLength(1);
       expect(result.environments?.[0]?.variables.baseUrl).toBe('http://api.com');
    });

    it('should handle complex URL object building', async () => {
       const urlSample = {
         info: { name: 'URL', schema: 'v2.1.0' },
         item: [{
           request: {
             url: {
               protocol: 'https',
               host: ['api', 'example', 'com'],
               path: ['v1', 'users']
             }
           }
         }]
       };
       const result = await parser.parse(JSON.stringify(urlSample));
       expect(result.requests[0].url).toBe('https://api.example.com/v1/users');
    });

    it('should handle invalid URLs with query params (manual parsing)', async () => {
       const urlSample = {
         info: { name: 'URL', schema: 'v2.1.0' },
         item: [{
           request: {
             url: '{{baseUrl}}/users?active=true&role=admin'
           }
         }]
       };
       const result = await parser.parse(JSON.stringify(urlSample));
       expect(result.requests[0].url).toBe('{{baseUrl}}/users');
       expect(result.requests[0].queryParams).toHaveLength(2);
       expect(result.requests[0].queryParams[0].key).toBe('active');
    });

    it('should handle validation warnings (deep nesting and empty body)', async () => {
       const largeSample = {
         info: { name: 'Large', schema: 'v2.1.0' },
         item: [{
           name: 'Folder 1',
           item: [{
             name: 'Folder 2',
             item: [{
               name: 'Folder 3',
               item: [{
                 name: 'Folder 4',
                 item: [{
                   name: 'Folder 5',
                   item: [{
                     name: 'Folder 6',
                     item: [{
                       name: 'Folder 7',
                       item: [{
                         name: 'Folder 8',
                         item: [{
                           name: 'Folder 9',
                           item: [{
                             name: 'Folder 10',
                             item: [{
                               name: 'Folder 11',
                               item: [{
                                 name: 'Empty POST',
                                 request: { method: 'POST', url: 'http://u.com', body: { mode: 'raw', raw: '' } }
                               }]
                             }]
                           }]
                         }]
                       }]
                     }]
                   }]
                 }]
               }]
             }]
           }]
         }]
       };
       const importResult = await parser.parse(JSON.stringify(largeSample));
       // The ImportFactory calls validation
       const factory = ImportFactory.getInstance();
       const result = await factory.parse(JSON.stringify(largeSample), parser.formatName);
       expect(result.success).toBe(true);
       if (result.success && result.result) {
         expect(result.result.warnings.some((w: any) => w.code === 'DEEP_NESTING')).toBe(true);
         expect(result.result.warnings.some((w: any) => w.code === 'EMPTY_BODY')).toBe(true);
       }
    });

    it('should handle validation errors (missing URL)', async () => {
       const badSample = {
         info: { name: 'Bad', schema: 'v2.1.0' },
         item: [{
           name: 'No URL',
           request: { method: 'GET' }
         }]
       };
       const factory = ImportFactory.getInstance();
       const result = await factory.parse(JSON.stringify(badSample), parser.formatName);
       expect(result.success).toBe(true); // Parse is successful, but has errors in result
       if (result.success && result.result) {
          expect(result.result.errors.some((e: any) => e.code === 'MISSING_URL')).toBe(true);
       }
    });

    it('should handle unknown auth type', async () => {
       const authSample = {
         info: { name: 'Auth', schema: 'v2.1.0' },
         item: [{
           request: {
             auth: { type: 'unknown' },
             url: 'http://u.com'
           }
         }]
       };
       const result = await parser.parse(JSON.stringify(authSample));
       expect(result.requests[0].auth.type).toBe('none');
    });

    it('should parse basic auth', async () => {
       const authSample = {
         info: { name: 'Auth', schema: 'v2.1.0' },
         item: [{
           request: {
             method: 'GET',
             url: 'http://u.com',
             auth: {
               type: 'basic',
               basic: [{ key: 'username', value: 'user' }, { key: 'password', value: 'pass' }]
             }
           }
         }]
       };
       const result = await parser.parse(JSON.stringify(authSample));
       expect(result.requests[0].auth.type).toBe('basic');
       expect(result.requests[0].auth.username).toBe('user');
    });

    it('should handle empty content in detect', () => {
       expect(parser.detect('')).toBe(false);
    });

    it('should handle validation of invalid results', () => {
       const invalidResult = { 
         collection: { name: '' }, 
         folders: [], 
         requests: [], 
         environments: [],
         warnings: [], 
         errors: [],
         stats: { totalFolders: 0, totalRequests: 0, totalEnvironments: 0, skippedItems: 0 }
       } as any;
       const validation = (parser as any).validate(invalidResult);
       expect(validation.errors.some((e: any) => e.code === 'MISSING_NAME')).toBe(true);
    });

    it('should handle invalid JSON in safeParseJson', async () => {
       const result = (parser as any).safeParseJson('invalid');
       expect(result).toBeNull();
    });
  });
});

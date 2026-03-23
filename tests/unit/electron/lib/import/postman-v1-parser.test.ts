import { describe, expect, it } from 'vitest';
import { PostmanV1Parser } from '../../../../../electron/lib/import/postman-v1-parser';

describe('PostmanV1Parser', () => {
  const parser = new PostmanV1Parser();

  const v1Sample = {
    id: 'c1',
    name: 'Sample V1',
    folders: [
      { id: 'f1', name: 'Folder 1', description: 'Desc' }
    ],
    requests: [
      {
        id: 'r1',
        name: 'Get User',
        url: 'https://api.com/users',
        method: 'GET',
        folder: 'f1'
      },
      {
        id: 'r2',
        name: 'Create User',
        url: 'https://api.com/users',
        method: 'POST',
        headers: 'Content-Type: application/json\nX-Custom: value',
        data: '{"name": "test"}',
        dataMode: 'raw'
      }
    ]
  };

  describe('detect', () => {
    it('should detect valid Postman v1 format', () => {
      expect(parser.detect(JSON.stringify(v1Sample))).toBe(true);
    });

    it('should not detect Postman v2 (it has info object)', () => {
      const v2Sample = { info: { name: 'v2' }, item: [] };
      expect(parser.detect(JSON.stringify(v2Sample))).toBe(false);
    });
  });

  describe('parse', () => {
    it('should parse collection metadata correctly', async () => {
      const result = await parser.parse(JSON.stringify(v1Sample));
      expect(result.collection.name).toBe('Sample V1');
      expect(result.source.format).toBe('postman-v1');
    });

    it('should parse folders correctly', async () => {
       const result = await parser.parse(JSON.stringify(v1Sample));
       expect(result.folders).toHaveLength(1);
       expect(result.folders[0].name).toBe('Folder 1');
    });

    it('should parse requests with all details', async () => {
        const result = await parser.parse(JSON.stringify(v1Sample));
        expect(result.requests).toHaveLength(2);
        
        const postReq = result.requests.find(r => r.method === 'POST');
        expect(postReq?.headers['Content-Type']).toBe('application/json');
        expect(postReq?.body).toBe('{"name": "test"}');
        expect(postReq?.bodyType).toBe('json');
    });

    it('should detect XML, Text, URL-Encoded string, and Params bodies', async () => {
       const bodySample = {
         id: 'c2b',
         name: 'Body',
         requests: [
           { name: 'xml', url: 'http://u.com', method: 'POST', dataMode: 'raw', data: '<xml></xml>' },
           { name: 'text', url: 'http://u.com', method: 'POST', dataMode: 'raw', data: 'text' },
           { name: 'urlencoded', url: 'http://u.com', method: 'POST', dataMode: 'urlencoded', data: 'a=1&b=2' },
           { name: 'params', url: 'http://u.com', method: 'POST', dataMode: 'params', data: 'k=v' }
         ]
       };
       const result = await parser.parse(JSON.stringify(bodySample));
       expect(result.requests[0].bodyType).toBe('xml');
       expect(result.requests[1].bodyType).toBe('text');
       expect(result.requests[2].bodyType).toBe('x-www-form-urlencoded');
       expect(result.requests[3].bodyType).toBe('form-data');
    });

    it('should handle form-data and urlencoded bodies', async () => {
       const formSample = {
         id: 'c2',
         name: 'Form',
         requests: [
           {
             name: 'form',
             url: 'http://u.com',
             method: 'POST',
             dataMode: 'formdata',
             data: [{ key: 'k', value: 'v', enabled: true }]
           },
           {
             name: 'url',
             url: 'http://u.com',
             method: 'POST',
             dataMode: 'urlencoded',
             data: [{ key: 'k2', value: 'v2', enabled: true }]
           }
         ]
       };
       const result = await parser.parse(JSON.stringify(formSample));
       expect(result.requests[0].bodyType).toBe('form-data');
       expect(JSON.parse(result.requests[0].body)).toEqual({ k: 'v' });
       expect(result.requests[1].body).toBe('k2=v2');
    });

    it('should handle auth helpers', async () => {
       const authSample = {
         id: 'c3',
         name: 'Auth',
         requests: [
           {
             name: 'basic',
             url: 'http://u.com',
             method: 'GET',
             currentHelper: 'basicAuth',
             helperAttributes: { username: 'u', password: 'p' }
           }
         ]
       };
       const result = await parser.parse(JSON.stringify(authSample));
       expect(result.requests[0].auth.type).toBe('basic');
       expect(result.requests[0].auth.username).toBe('u');
    });

    it('should handle bearer and apiKey auth', async () => {
       const authSample = {
         id: 'c3b',
         name: 'Auth2',
         requests: [
           {
             name: 'bearer',
             url: 'http://u.com',
             method: 'GET',
             currentHelper: 'bearerAuth',
             helperAttributes: { token: 'secret' }
           },
           {
             name: 'apikey',
             url: 'http://u.com',
             method: 'GET',
             currentHelper: 'apiKeyAuth',
             helperAttributes: { apiKey: 'key123', headerName: 'X-Key' }
           }
         ]
       };
       const result = await parser.parse(JSON.stringify(authSample));
       expect(result.requests[0].auth.type).toBe('bearer');
       expect(result.requests[0].auth.token).toBe('secret');
       expect(result.requests[1].auth.type).toBe('apikey');
       expect(result.requests[1].auth.apiKey).toBe('key123');
       expect(result.requests[1].auth.apiKeyHeader).toBe('X-Key');
    });

    it('should handle URL query parameters', async () => {
       const urlSample = {
         id: 'c4',
         name: 'URL',
         requests: [{ name: 'q', url: 'http://u.com?a=1&b=2', method: 'GET' }]
       };
       const result = await parser.parse(JSON.stringify(urlSample));
       expect(result.requests[0].queryParams).toHaveLength(2);
       expect(result.requests[0].queryParams).toContainEqual({ key: 'a', value: '1', enabled: true });
    });

    it('should handle manual query parsing for invalid URLs', async () => {
      const urlSample = {
        id: 'c4b',
        name: 'URL2',
        requests: [{ name: 'q', url: '{{host}}/path?k=v', method: 'GET' }]
      };
      const result = await parser.parse(JSON.stringify(urlSample));
      expect(result.requests[0].url).toBe('{{host}}/path');
      expect(result.requests[0].queryParams[0]).toEqual({ key: 'k', value: 'v', enabled: true });
    });
  });
});

/**
 * Drag and Drop Reordering Integration Tests
 *
 * Tests comprehensive drag-and-drop functionality:
 * - Reordering requests within collections and folders
 * - Moving requests between collections and folders
 * - Reordering folders within collections
 * - Moving folders between collections
 * - Visual drop indicators
 * - Order persistence
 */

import { test, expect } from '@playwright/test';
import { electronFixture } from '../../helpers/electron-fixtures';

test.describe('Drag and Drop Reordering', () => {
  test('should reorder request within collection', async ({
    electronPage,
    testDbPath,
  }) => {
    // Given: A collection with multiple requests
    const collection = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Test Collection',
      });
    });

    const request1 = await electronPage.evaluate(async collectionId => {
      return await window.electronAPI.request.save({
        name: 'Request 1',
        method: 'GET',
        url: 'https://api.example.com/1',
        headers: {},
        body: '',
        queryParams: [],
        auth: { type: 'none' },
        collectionId: collectionId,
        isFavorite: false,
      });
    }, collection.id);

    const request2 = await electronPage.evaluate(async collectionId => {
      return await window.electronAPI.request.save({
        name: 'Request 2',
        method: 'GET',
        url: 'https://api.example.com/2',
        headers: {},
        body: '',
        queryParams: [],
        auth: { type: 'none' },
        collectionId: collectionId,
        isFavorite: false,
      });
    }, collection.id);

    // When: Drag request2 above request1
    const request1Element = electronPage
      .locator(`[data-testid="collection-hierarchy"]`)
      .locator('text=Request 1');
    const request2Element = electronPage
      .locator(`[data-testid="collection-hierarchy"]`)
      .locator('text=Request 2');

    await request2Element.dragTo(request1Element, {
      targetPosition: { x: 0, y: 0 }, // Drag to top of request1
    });

    // Then: Request2 should appear before Request1
    await electronPage.waitForTimeout(500); // Wait for reorder to complete

    const requests = await electronPage.evaluate(async collectionId => {
      return await window.electronAPI.request.list(collectionId);
    }, collection.id);

    expect(requests.length).toBe(2);
    // Verify order - request2 should have lower order value
    const req1 = requests.find((r: any) => r.id === request1.id);
    const req2 = requests.find((r: any) => r.id === request2.id);
    expect(req2.order).toBeLessThan(req1.order);
  });

  test('should move request between collections', async ({
    electronPage,
    testDbPath,
  }) => {
    // Given: Two collections and a request in collection1
    const collection1 = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Collection 1',
      });
    });

    const collection2 = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Collection 2',
      });
    });

    const request = await electronPage.evaluate(async collectionId => {
      return await window.electronAPI.request.save({
        name: 'Test Request',
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: {},
        body: '',
        queryParams: [],
        auth: { type: 'none' },
        collectionId: collectionId,
        isFavorite: false,
      });
    }, collection1.id);

    // When: Drag request to collection2
    const requestElement = electronPage
      .locator(`[data-testid="collection-hierarchy"]`)
      .locator('text=Test Request');
    const collection2Element = electronPage
      .locator(`[data-testid="collection-hierarchy"]`)
      .locator('text=Collection 2');

    await requestElement.dragTo(collection2Element);

    // Then: Request should be in collection2
    await electronPage.waitForTimeout(500);

    const requestsInCollection2 = await electronPage.evaluate(
      async collectionId => {
        return await window.electronAPI.request.list(collectionId);
      },
      collection2.id
    );

    expect(requestsInCollection2.length).toBe(1);
    expect(requestsInCollection2[0].id).toBe(request.id);
    expect(requestsInCollection2[0].collectionId).toBe(collection2.id);
  });

  test('should move request from collection to folder', async ({
    electronPage,
    testDbPath,
  }) => {
    // Given: A collection with a folder and a request in collection root
    const collection = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Test Collection',
      });
    });

    const folder = await electronPage.evaluate(async collectionId => {
      return await window.electronAPI.folder.save({
        name: 'Test Folder',
        description: '',
        collectionId: collectionId,
      });
    }, collection.id);

    const request = await electronPage.evaluate(async collectionId => {
      return await window.electronAPI.request.save({
        name: 'Test Request',
        method: 'GET',
        url: 'https://api.example.com/test',
        headers: {},
        body: '',
        queryParams: [],
        auth: { type: 'none' },
        collectionId: collectionId,
        isFavorite: false,
      });
    }, collection.id);

    // When: Drag request to folder
    const requestElement = electronPage
      .locator(`[data-testid="collection-hierarchy"]`)
      .locator('text=Test Request');
    const folderElement = electronPage
      .locator(`[data-testid="collection-hierarchy"]`)
      .locator('text=Test Folder');

    await requestElement.dragTo(folderElement);

    // Then: Request should be in folder
    await electronPage.waitForTimeout(500);

    const requestsInFolder = await electronPage.evaluate(async folderId => {
      return await window.electronAPI.request.list(undefined, folderId);
    }, folder.id);

    expect(requestsInFolder.length).toBe(1);
    expect(requestsInFolder[0].id).toBe(request.id);
    expect(requestsInFolder[0].folderId).toBe(folder.id);
  });

  test('should reorder folder within collection', async ({
    electronPage,
    testDbPath,
  }) => {
    // Given: A collection with multiple folders
    const collection = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Test Collection',
      });
    });

    const folder1 = await electronPage.evaluate(async collectionId => {
      return await window.electronAPI.folder.save({
        name: 'Folder 1',
        description: '',
        collectionId: collectionId,
      });
    }, collection.id);

    const folder2 = await electronPage.evaluate(async collectionId => {
      return await window.electronAPI.folder.save({
        name: 'Folder 2',
        description: '',
        collectionId: collectionId,
      });
    }, collection.id);

    // When: Drag folder2 above folder1
    const folder1Element = electronPage
      .locator(`[data-testid="collection-hierarchy"]`)
      .locator('text=Folder 1');
    const folder2Element = electronPage
      .locator(`[data-testid="collection-hierarchy"]`)
      .locator('text=Folder 2');

    await folder2Element.dragTo(folder1Element, {
      targetPosition: { x: 0, y: 0 },
    });

    // Then: Folder2 should appear before Folder1
    await electronPage.waitForTimeout(500);

    const folders = await electronPage.evaluate(async collectionId => {
      return await window.electronAPI.folder.list(collectionId);
    }, collection.id);

    expect(folders.length).toBe(2);
    const f1 = folders.find((f: any) => f.id === folder1.id);
    const f2 = folders.find((f: any) => f.id === folder2.id);
    expect(f2.order).toBeLessThan(f1.order);
  });

  test('should move folder between collections', async ({
    electronPage,
    testDbPath,
  }) => {
    // Given: Two collections and a folder in collection1
    const collection1 = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Collection 1',
      });
    });

    const collection2 = await electronPage.evaluate(async () => {
      return await window.electronAPI.collection.save({
        name: 'Collection 2',
      });
    });

    const folder = await electronPage.evaluate(async collectionId => {
      return await window.electronAPI.folder.save({
        name: 'Test Folder',
        description: '',
        collectionId: collectionId,
      });
    }, collection1.id);

    // When: Drag folder to collection2
    const folderElement = electronPage
      .locator(`[data-testid="collection-hierarchy"]`)
      .locator('text=Test Folder');
    const collection2Element = electronPage
      .locator(`[data-testid="collection-hierarchy"]`)
      .locator('text=Collection 2');

    await folderElement.dragTo(collection2Element);

    // Then: Folder should be in collection2
    await electronPage.waitForTimeout(500);

    const foldersInCollection2 = await electronPage.evaluate(
      async collectionId => {
        return await window.electronAPI.folder.list(collectionId);
      },
      collection2.id
    );

    expect(foldersInCollection2.length).toBe(1);
    expect(foldersInCollection2[0].id).toBe(folder.id);
    expect(foldersInCollection2[0].collectionId).toBe(collection2.id);
  });
});

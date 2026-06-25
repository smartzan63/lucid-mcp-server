import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createDiagramHandler } from '../../../src/tools/createDiagram.js';
import { setupTestEnvironment, resetTestEnvironment } from '../../utils.js';
import { lucidService } from '../../../src/services/lucidService.js';

const validJson = JSON.stringify({
  version: 1,
  pages: [{ id: 'page1', shapes: [{ id: 's1', type: 'process', boundingBox: { x: 0, y: 0, w: 100, h: 60 }, text: 'Hi' }] }]
});

describe('createDiagramHandler', () => {
  beforeEach(() => {
    setupTestEnvironment();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetTestEnvironment();
  });

  it('should create a document and return the edit URL', async () => {
    vi.spyOn(lucidService.instance, 'createDocumentFromStandardImport').mockResolvedValue({
      documentId: 'doc-123',
      title: 'My Diagram',
      editUrl: 'https://lucid.app/lucidchart/doc-123/edit',
      viewUrl: 'https://lucid.app/lucidchart/doc-123/view',
      pageCount: 1
    });

    const result = await createDiagramHandler({ title: 'My Diagram', standardImportJson: validJson });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Created Lucid document "My Diagram"');
    expect(result.content[0].text).toContain('ID: doc-123');
    expect(result.content[0].text).toContain('Edit URL: https://lucid.app/lucidchart/doc-123/edit');
    expect(result.content[0].text).toContain('Pages: 1');
  });

  it('should pass product and parent through to the service', async () => {
    const spy = vi
      .spyOn(lucidService.instance, 'createDocumentFromStandardImport')
      .mockResolvedValue({
        documentId: 'doc-9',
        title: 'Board',
        editUrl: 'e',
        viewUrl: 'v'
      });

    await createDiagramHandler({
      title: 'Board',
      standardImportJson: validJson,
      product: 'lucidspark',
      parent: 42
    });

    expect(spy).toHaveBeenCalledWith(validJson, 'Board', 'lucidspark', 42);
  });

  it('should default product to lucidchart', async () => {
    const spy = vi
      .spyOn(lucidService.instance, 'createDocumentFromStandardImport')
      .mockResolvedValue({ documentId: 'd', title: 't', editUrl: 'e', viewUrl: 'v' });

    await createDiagramHandler({ title: 't', standardImportJson: validJson });

    expect(spy).toHaveBeenCalledWith(validJson, 't', 'lucidchart', undefined);
  });

  it('should return an error message when the service throws', async () => {
    vi.spyOn(lucidService.instance, 'createDocumentFromStandardImport').mockRejectedValue(
      new Error('Failed to create document: HTTP 415 Unsupported Media Type')
    );

    const result = await createDiagramHandler({ title: 't', standardImportJson: validJson });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Error: Failed to create document: HTTP 415');
  });
});

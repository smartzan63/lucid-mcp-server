import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDocumentHandler } from '../../../src/tools/getDocument.js';
import { setupTestEnvironment, resetTestEnvironment, createHttpMockResponse } from '../../utils.js';
import { mockLucidDocument } from '../../fixtures/data.js';
import { lucidService } from '../../../src/services/lucidService.js';

describe('getDocumentHandler', () => {
  beforeEach(() => {
    setupTestEnvironment();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetTestEnvironment();
  });

  it('should return comprehensive document metadata when no options provided', async () => {
    vi.spyOn(lucidService.instance, 'getDocument').mockResolvedValue(mockLucidDocument);
    const mockResponse = createHttpMockResponse(mockLucidDocument);
    global.fetch = vi.fn().mockResolvedValue(mockResponse);

    const result = await getDocumentHandler({ documentId: 'test-doc-123' });
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('**Document Information**');
    expect(result.content[0].text).toContain('Title: Test Document');
    expect(result.content[0].text).toContain('ID: test-doc-123');
    expect(result.content[0].text).toContain('Product:');
    expect(result.content[0].text).toContain('Version:');
    expect(result.content[0].text).toContain('Page Count: 1');
    expect(result.content[0].text).toContain('Status: Active');
    expect(result.content[0].text).toContain('Classification:');
    expect(result.content[0].text).toContain('Can Edit:');
    expect(result.content[0].text).toContain('Created:');
    expect(result.content[0].text).toContain('Last Modified:');
  });

  it('should export image when analyzeImage is true', async () => {
    vi.spyOn(lucidService.instance, 'getDocument').mockResolvedValue(mockLucidDocument);
    vi.spyOn(lucidService.instance, 'exportDocumentAsPng').mockResolvedValue({
      base64: 'fake-png-data',
      contentType: 'image/png',
      size: 10
    });

    const result = await getDocumentHandler({
      documentId: 'test-doc-123',
      analyzeImage: true
    });

    const imageItem = result.content.find((c: any) => c.type === 'image');
    expect(imageItem).toBeDefined();
    expect((imageItem as any).data).toBe('fake-png-data');

    const textItem = result.content.find((c: any) => c.type === 'text');
    expect(textItem).toBeDefined();
    expect((textItem as any).text).toContain('Test Document');
  });

  it('should handle documents not found', async () => {
    vi.spyOn(lucidService.instance, 'getDocument').mockRejectedValue(new Error('Document not found'));

    const result = await getDocumentHandler({ documentId: 'nonexistent-doc' });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Error: Document not found');
  });

  it('should handle network errors', async () => {
    vi.spyOn(lucidService.instance, 'getDocument').mockRejectedValue(new Error('Network error'));

    const result = await getDocumentHandler({ documentId: 'test-doc-123' });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Error: Network error');
  });

  it('should include custom tags and attributes in metadata when analyzeImage is false', async () => {
    vi.spyOn(lucidService.instance, 'getDocument').mockResolvedValue(mockLucidDocument);
    const result = await getDocumentHandler({ documentId: 'test-doc-123', analyzeImage: false });
    expect(result.content[0].text).toMatch(/\*\*Custom Tags:\*\* (diagram, flowchart|flowchart, diagram)/);
    expect(result.content[0].text).toMatch(/\*\*Custom Attributes:\*\* 1 attributes defined/);
  });

  it('should include trashed status in metadata when analyzeImage is false', async () => {
    vi.spyOn(lucidService.instance, 'getDocument').mockResolvedValue(mockLucidDocument);
    const result = await getDocumentHandler({ documentId: 'test-doc-123', analyzeImage: false });
    expect(result.content[0].text).toMatch(/\*\*Status:\*\* Trashed on \d{1,2}\/\d{1,2}\/\d{4}/);
  });

  it('should include all optional metadata fields when present', async () => {
    vi.spyOn(lucidService.instance, 'getDocument').mockResolvedValue({
      ...mockLucidDocument,
      owner: {
        id: 12345,
        type: 'user',
        name: 'Test User'
      },
      creatorId: 12345,
      lastModifiedUserId: 12345,
      customTags: [{ name: 'diagram' }, { name: 'flowchart' }],
      customAttributes: [{ name: 'project', value: 'lucid-mcp' }],
      editUrl: 'https://lucid.app/lucidchart/test-doc-123/edit',
      viewUrl: 'https://lucid.app/lucidchart/test-doc-123/view',
      trashed: '2024-06-27T00:00:00Z',
    });

    const result = await getDocumentHandler({ documentId: 'test-doc-123', analyzeImage: false });
    expect(result.content[0].text).toContain('**Owner Information**');
    expect(result.content[0].text).toContain('Name: Test User');
    expect(result.content[0].text).toContain('ID: 12345');
    expect(result.content[0].text).toContain('Type: user');
    expect(result.content[0].text).toContain('**Creator ID:** 12345');
    expect(result.content[0].text).toContain('**Last Modified by User ID:** 12345');
    expect(result.content[0].text).toMatch(/\*\*Custom Tags:\*\* (diagram, flowchart|flowchart, diagram)/);
    expect(result.content[0].text).toMatch(/\*\*Custom Attributes:\*\* 1 attributes defined/);
    expect(result.content[0].text).toContain('**Edit URL:** https://lucid.app/lucidchart/test-doc-123/edit');
    expect(result.content[0].text).toContain('**View URL:** https://lucid.app/lucidchart/test-doc-123/view');
    expect(result.content[0].text).toMatch(/\*\*Status:\*\* Trashed on \d{1,2}\/\d{1,2}\/\d{4}/);
  });

  it('should not include optional metadata fields when absent', async () => {
    vi.spyOn(lucidService.instance, 'getDocument').mockResolvedValue({
      ...mockLucidDocument,
      owner: undefined,
      creatorId: undefined,
      lastModifiedUserId: undefined,
      customTags: [],
      customAttributes: [],
      editUrl: undefined,
      viewUrl: undefined,
      trashed: undefined,
    });

    const result = await getDocumentHandler({ documentId: 'test-doc-123', analyzeImage: false });
    expect(result.content[0].text).not.toContain('**Owner Information**');
    expect(result.content[0].text).not.toContain('**Creator ID:**');
    expect(result.content[0].text).not.toContain('**Last Modified by User ID:**');
    expect(result.content[0].text).not.toContain('**Custom Tags:**');
    expect(result.content[0].text).not.toContain('**Custom Attributes:**');
    expect(result.content[0].text).not.toContain('**Edit URL:**');
    expect(result.content[0].text).not.toContain('**View URL:**');
    expect(result.content[0].text).not.toContain('**Status:** Trashed');
  });

  it('should display N/A for created and last modified dates when absent', async () => {
    vi.spyOn(lucidService.instance, 'getDocument').mockResolvedValue({
      ...mockLucidDocument,
      created: undefined,
      lastModified: undefined,
    });

    const result = await getDocumentHandler({ documentId: 'test-doc-123', analyzeImage: false });
    expect(result.content[0].text).toContain('Created: N/A');
    expect(result.content[0].text).toContain('Last Modified: N/A');
  });
});

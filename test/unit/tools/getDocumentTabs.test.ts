import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getDocumentTabsHandler } from '../../../src/tools/getDocumentTabs.js';
import { lucidService } from '../../../src/services/lucidService.js';

// Mock the lucidService
vi.mock('../../../src/services/lucidService.js', () => ({
  lucidService: {
    instance: {
      getDocumentContent: vi.fn()
    }
  }
}));

const mockGetDocumentContent = vi.mocked(lucidService.instance.getDocumentContent);

describe('getDocumentTabsHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return document tab metadata successfully', async () => {
    const mockDocumentContent = {
      id: 'example-doc-id',
      title: 'Example Document',
      product: 'lucidchart',
      pages: [
        {
          id: '0_0',
          title: 'Page 1',
          index: 0,
          items: {
            shapes: [{ id: 'shape1', type: 'rectangle' }],
            lines: [],
            groups: [],
            layers: []
          }
        },
        {
          id: 'abc123',
          title: 'Page 2',
          index: 1,
          items: {
            shapes: [{ id: 'shape2', type: 'circle' }],
            lines: [],
            groups: [],
            layers: []
          }
        }
      ]
    };

    mockGetDocumentContent.mockResolvedValue(mockDocumentContent);

    const result = await getDocumentTabsHandler({
      documentId: 'example-doc-id'
    });

    expect(mockGetDocumentContent).toHaveBeenCalledWith('example-doc-id');
    
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    
    const parsedResult = JSON.parse(result.content[0].text);
    expect(parsedResult).toEqual({
      documentId: 'example-doc-id',
      title: 'Example Document',
      product: 'lucidchart',
      pages: [
        {
          id: '0_0',
          title: 'Page 1',
          index: 0
        },
        {
          id: 'abc123',
          title: 'Page 2',
          index: 1
        }
      ]
    });

    // Ensure that shapes, lines, groups, etc. are not included
    parsedResult.pages.forEach(page => {
      expect(page).not.toHaveProperty('items');
      expect(page).not.toHaveProperty('shapes');
      expect(page).not.toHaveProperty('lines');
      expect(page).not.toHaveProperty('groups');
      expect(page).not.toHaveProperty('layers');
    });
  });

  it('should handle API errors gracefully', async () => {
    const errorMessage = 'Failed to get document content 123: Document not found';
    mockGetDocumentContent.mockRejectedValue(new Error(errorMessage));

    const result = await getDocumentTabsHandler({
      documentId: '123'
    });

    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toBe(`Error: ${errorMessage}`);
  });

  it('should handle empty pages array', async () => {
    const mockDocumentContent = {
      id: 'empty-doc',
      title: 'Empty Document',
      product: 'lucidchart',
      pages: []
    };

    mockGetDocumentContent.mockResolvedValue(mockDocumentContent);

    const result = await getDocumentTabsHandler({
      documentId: 'empty-doc'
    });

    const parsedResult = JSON.parse(result.content[0].text);
    expect(parsedResult.pages).toEqual([]);
  });

  it('should preserve page ordering by index', async () => {
    const mockDocumentContent = {
      id: 'test-doc',
      title: 'Test Document',
      product: 'lucidspark',
      pages: [
        { id: 'page-2', title: 'Second Page', index: 1 },
        { id: 'page-1', title: 'First Page', index: 0 },
        { id: 'page-3', title: 'Third Page', index: 2 }
      ]
    };

    mockGetDocumentContent.mockResolvedValue(mockDocumentContent);

    const result = await getDocumentTabsHandler({
      documentId: 'test-doc'
    });

    const parsedResult = JSON.parse(result.content[0].text);
    
    // Verify pages are returned in their original order (not sorted)
    expect(parsedResult.pages).toEqual([
      { id: 'page-2', title: 'Second Page', index: 1 },
      { id: 'page-1', title: 'First Page', index: 0 },
      { id: 'page-3', title: 'Third Page', index: 2 }
    ]);
  });

  it('should handle different Lucid products', async () => {
    const products = ['lucidchart', 'lucidspark', 'lucidscale'];
    
    for (const product of products) {
      const mockDocumentContent = {
        id: `${product}-doc`,
        title: `${product} Document`,
        product: product,
        pages: [{ id: '0_0', title: 'Page 1', index: 0 }]
      };

      mockGetDocumentContent.mockResolvedValue(mockDocumentContent);

      const result = await getDocumentTabsHandler({
        documentId: `${product}-doc`
      });

      const parsedResult = JSON.parse(result.content[0].text);
      expect(parsedResult.product).toBe(product);
    }
  });
});
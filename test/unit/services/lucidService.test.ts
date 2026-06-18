// test/unit/services/lucidService.test.ts
// Unit tests for LucidService

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { LucidService, lucidService } from '../../../src/services/lucidService.js';

describe('LucidService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    lucidService.resetInstance(); // Reset singleton between tests
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('should throw error when no API key is provided', () => {
      delete process.env.LUCID_API_KEY;
      
      expect(() => new LucidService()).toThrow(
        'Lucid API key is required. Set LUCID_API_KEY environment variable or pass apiKey parameter.'
      );
    });

    it('should use provided API key', () => {
      const service = new LucidService('test-key');
      expect(service).toBeInstanceOf(LucidService);
    });

    it('should use environment variable API key', () => {
      process.env.LUCID_API_KEY = 'env-key';
      const service = new LucidService();
      expect(service).toBeInstanceOf(LucidService);
    });
  });

  describe('searchDocuments', () => {
    it('should handle search without keywords', async () => {
      process.env.LUCID_API_KEY = 'test-key';
      const service = new LucidService();
      
      // Mock the SDK call
      const mockSearchDocuments = vi.fn().mockResolvedValue({
        data: [
          {
            documentId: 'doc1',
            title: 'Test Document',
            product: 'lucidchart'
          }
        ]
      });
      
      (service as any).sdk = {
        searchDocuments: mockSearchDocuments
      };
      
      const result = await service.searchDocuments();
      
      expect(mockSearchDocuments).toHaveBeenCalledWith(
        { product: ['lucidchart', 'lucidscale', 'lucidspark'] },
        { 'Lucid-Api-Version': '1' }
      );
      expect(result).toEqual([{
        documentId: 'doc1',
        title: 'Test Document',
        product: 'lucidchart'
      }]);
    });

    it('should handle search with keywords', async () => {
      process.env.LUCID_API_KEY = 'test-key';
      const service = new LucidService();
      
      const mockSearchDocuments = vi.fn().mockResolvedValue({
        data: []
      });
      
      (service as any).sdk = {
        searchDocuments: mockSearchDocuments
      };
      
      await service.searchDocuments('test query');
      
      expect(mockSearchDocuments).toHaveBeenCalledWith(
        { 
          product: ['lucidchart', 'lucidscale', 'lucidspark'],
          keywords: 'test query'
        },
        { 'Lucid-Api-Version': '1' }
      );
    });
  });

  describe('getDocument', () => {
    it('should throw error when document ID is missing', async () => {
      process.env.LUCID_API_KEY = 'test-key';
      const service = new LucidService();
      
      await expect(service.getDocument('')).rejects.toThrow('Document ID is required');
    });

    it('should get document by ID', async () => {
      process.env.LUCID_API_KEY = 'test-key';
      const service = new LucidService();
      
      const mockDocument = {
        documentId: 'doc1',
        title: 'Test Document'
      };
      
      const mockGetOrExportDocument = vi.fn().mockResolvedValue({
        data: mockDocument
      });
      
      (service as any).sdk = {
        getOrExportDocument: mockGetOrExportDocument
      };
      
      const result = await service.getDocument('doc1');
      
      expect(mockGetOrExportDocument).toHaveBeenCalledWith({
        id: 'doc1',
        'Lucid-Api-Version': '1'
      });
      expect(result).toEqual(mockDocument);
    });
  });
  describe('exportDocumentAsPng', () => {
    it('should export document as PNG', async () => {
      process.env.LUCID_API_KEY = 'test-key';
      const service = new LucidService();
      
      const mockDataString = 'fake-png-data';
      const mockArrayBuffer = new ArrayBuffer(mockDataString.length);
      const view = new Uint8Array(mockArrayBuffer);
      for (let i = 0; i < mockDataString.length; i++) {
        view[i] = mockDataString.charCodeAt(i);
      }
      
      const mockResponse = {
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('image/png')
        },
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer)
      };
      
      global.fetch = vi.fn().mockResolvedValue(mockResponse);
      
      const result = await service.exportDocumentAsPng('doc1');
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.lucid.co/documents/doc1?pageId=0_0',
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-key',
            'Accept': 'image/png'
          })
        })
      );
      
      expect(result.contentType).toBe('image/png');
      expect(result.base64).toBeDefined();
      expect(result.size).toBe(mockArrayBuffer.byteLength);
    });

    it('should throw error when export fails', async () => {
      process.env.LUCID_API_KEY = 'test-key';
      const service = new LucidService();

      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500, statusText: 'Internal Server Error' });

      await expect(service.exportDocumentAsPng('doc1')).rejects.toThrow('Failed to export document doc1 as PNG: Failed to export document as PNG: 500 Internal Server Error');
    });

    it('should throw error when content type is not an image', async () => {
      process.env.LUCID_API_KEY = 'test-key';
      const service = new LucidService();

      const mockResponse = {
        ok: true,
        headers: { get: vi.fn().mockReturnValue('application/json') },
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      await expect(service.exportDocumentAsPng('doc1')).rejects.toThrow('Failed to export document doc1 as PNG: Expected image, got: application/json');
    });

    it('should throw error when document ID is missing for export', async () => {
      process.env.LUCID_API_KEY = 'test-key';
      const service = new LucidService();

      await expect(service.exportDocumentAsPng('')).rejects.toThrow('Document ID is required');
    });

    it('should use default content type when header is missing', async () => {
      process.env.LUCID_API_KEY = 'test-key';
      const service = new LucidService();

      const mockDataString = 'fake-png-data';
      const mockArrayBuffer = new ArrayBuffer(mockDataString.length);
      const view = new Uint8Array(mockArrayBuffer);
      for (let i = 0; i < mockDataString.length; i++) {
        view[i] = mockDataString.charCodeAt(i);
      }

      const mockResponse = {
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue(null)
        },
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer)
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse);

      const result = await service.exportDocumentAsPng('doc1');

      expect(result.contentType).toBe('image/png');
      expect(result.base64).toBeDefined();
    });
  });

  describe('getDocumentContent', () => {
    it('should successfully get document content', async () => {
      process.env.LUCID_API_KEY = 'test-key';
      const service = new LucidService();
      
      const mockDocumentContent = {
        id: 'example-doc-id',
        title: 'Test Document',
        product: 'lucidchart',
        pages: [
          { id: '0_0', title: 'Page 1', index: 0 },
          { id: 'abc123', title: 'Page 2', index: 1 }
        ]
      };

      const mockGetDocumentContent = vi.fn().mockResolvedValue({ data: mockDocumentContent });
      (service as any).sdk = { getDocumentContent: mockGetDocumentContent };

      const result = await service.getDocumentContent('example-doc-id');

      expect(result).toEqual(mockDocumentContent);
      expect(mockGetDocumentContent).toHaveBeenCalledWith({
        id: 'example-doc-id',
        'Lucid-Api-Version': '1'
      });
    });

    it('should throw error when document ID is missing for content', async () => {
      process.env.LUCID_API_KEY = 'test-key';
      const service = new LucidService();

      await expect(service.getDocumentContent('')).rejects.toThrow('Document ID is required');
    });

    it('should handle API errors for document content', async () => {
      process.env.LUCID_API_KEY = 'test-key';
      const service = new LucidService();

      const mockGetDocumentContent = vi.fn().mockRejectedValue(new Error('API Error'));
      (service as any).sdk = { getDocumentContent: mockGetDocumentContent };

      await expect(service.getDocumentContent('test-doc-123')).rejects.toThrow(
        'Failed to get document content test-doc-123: API Error'
      );
      expect(mockGetDocumentContent).toHaveBeenCalledWith({
        id: 'test-doc-123',
        'Lucid-Api-Version': '1'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle search API errors', async () => {
      process.env.LUCID_API_KEY = 'test-key';
      const service = new LucidService();

      const mockSearchDocuments = vi.fn().mockRejectedValue(new Error('API Error'));
      (service as any).sdk = { searchDocuments: mockSearchDocuments };

      await expect(service.searchDocuments('test')).rejects.toThrow('Failed to search documents: API Error');
    });

    it('should handle get document API errors', async () => {
      process.env.LUCID_API_KEY = 'test-key';
      const service = new LucidService();

      const mockGetOrExportDocument = vi.fn().mockRejectedValue(new Error('API Error'));
      (service as any).sdk = { getOrExportDocument: mockGetOrExportDocument };

      await expect(service.getDocument('doc1')).rejects.toThrow('Failed to get document doc1: API Error');
    });
  });
});

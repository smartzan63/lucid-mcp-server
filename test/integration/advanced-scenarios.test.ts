import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDocumentHandler } from '../../src/tools/index.js';
import { mockLucidDocument } from '../fixtures/data.js';

// Mock the LucidService
vi.mock('../../src/services/lucidService.js', () => ({
  lucidService: {
    instance: {
      searchDocuments: vi.fn(),
      getDocument: vi.fn(),
      exportDocumentAsPng: vi.fn(),
    },
    resetInstance: vi.fn()
  }
}));

describe('Integration: Advanced Scenarios', () => {
  beforeEach(() => {
    vi.stubEnv('LUCID_API_KEY', 'test-lucid-key');
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('Timeout Handling', () => {
    it('should handle API timeout gracefully', async () => {
      const { lucidService } = await import('../../src/services/lucidService.js');
      
      // Mock a timeout error
      (lucidService.instance.getDocument as any).mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        });
      });

      const result = await getDocumentHandler({ documentId: 'test-doc-123' });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Request timeout');
    });    it('should handle image export timeout', async () => {
      const { lucidService } = await import('../../src/services/lucidService.js');
      
      (lucidService.instance.getDocument as any).mockResolvedValue(mockLucidDocument);
      (lucidService.instance.exportDocumentAsPng as any).mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Export timeout')), 100);
        });
      });

      const result = await getDocumentHandler({
        documentId: 'test-doc-123',
        analyzeImage: true
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Error:');
      expect(result.content[0].text).toContain('Export timeout');
    });
  });

  describe('Large Image Handling', () => {
    it('should handle large images gracefully', async () => {
      const { lucidService } = await import('../../src/services/lucidService.js');
      
      (lucidService.instance.getDocument as any).mockResolvedValue(mockLucidDocument);
      
      // Mock a large image (5MB)
      const largeImageData = 'x'.repeat(5 * 1024 * 1024);
      (lucidService.instance.exportDocumentAsPng as any).mockResolvedValue({
        base64: `data:image/png;base64,${largeImageData}`,
        contentType: 'image/png',
        size: 5 * 1024 * 1024
      });

      const result = await getDocumentHandler({
        documentId: 'test-doc-123',
        analyzeImage: true
      });

      expect(result.content).toBeDefined();
      expect(result.content[0].type).toBe('text');
      // Should either succeed or fail gracefully
    });
  });
});

// src/services/lucidService.ts
// Lucid API service using official SDK

import { zipSync, strToU8 } from 'fflate';
import lucidDeveloperDocs from '../../.api/apis/lucid-developer-docs/index.js';
import { log } from '../utils/logger.js';

export interface LucidImageExport {
  base64: string;
  contentType: string;
  size: number;
}

export interface LucidDocumentCreated {
  documentId: string;
  title: string;
  editUrl: string;
  viewUrl: string;
  version?: number;
  pageCount?: number;
}

export class LucidService {
  private apiKey: string;
  private sdk: any; // Use any to bypass TypeScript issues

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.LUCID_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('Lucid API key is required. Set LUCID_API_KEY environment variable or pass apiKey parameter.');
    }
    
    // Set up authentication - lucidDeveloperDocs is already an instance
    this.sdk = lucidDeveloperDocs;
    this.sdk.auth(this.apiKey);
  }
  /**
   * Search for documents using keywords
   */
  async searchDocuments(keywords?: string, product: string[] = ['lucidchart', 'lucidscale', 'lucidspark']) {
    const searchBody: any = { product };
    
    if (keywords && keywords.trim()) {
      searchBody.keywords = keywords.trim();
      log.info(`Searching for documents with keywords: "${keywords.trim()}"`);
    } else {
      log.info('Searching for all documents (no keywords)');
    }
    
    log.debug('Lucid SDK search request:', { body: searchBody });
    
    try {
      const { data } = await this.sdk.searchDocuments(searchBody, {
        'Lucid-Api-Version': '1'
      });
      
      log.debug('Lucid SDK search response:', { 
        dataType: typeof data,
        dataLength: Array.isArray(data) ? data.length : 'not array'
      });
      
      const documents = Array.isArray(data) ? data : [];
      log.info(`Search returned ${documents.length} documents`);
      
      if (documents.length > 0) {
        log.debug('Found documents:', documents.map((doc: any) => ({ 
          id: doc.documentId, 
          title: doc.title,
          product: doc.product 
        })));
      }
      
      return data;
    } catch (error: any) {
      log.error('Lucid SDK search failed:', error);
      throw new Error(`Failed to search documents: ${error.message}`);
    }
  }
  /**
   * Get document metadata by ID
   */
  async getDocument(documentId: string) {
    if (!documentId) {
      throw new Error('Document ID is required');
    }
    
    log.debug('Lucid SDK get document request:', { documentId });
    
    try {
      const { data } = await this.sdk.getOrExportDocument({
        id: documentId,
        'Lucid-Api-Version': '1'
      });
      
      log.debug('Lucid SDK get document response:', { 
        documentId: data.documentId 
      });
      
      return data;
    } catch (error: any) {
      log.error('Lucid SDK get document failed:', error);
      throw new Error(`Failed to get document ${documentId}: ${error.message}`);
    }
  }

  /**
   * Get document contents (includes page metadata)
   */
  async getDocumentContent(documentId: string) {
    if (!documentId) {
      throw new Error('Document ID is required');
    }
    
    log.debug('Lucid SDK get document content request:', { documentId });
    
    try {
      const { data } = await this.sdk.getDocumentContent({
        id: documentId,
        'Lucid-Api-Version': '1'
      });
      
      log.debug('Lucid SDK get document content response:', { 
        documentId: data.id,
        pageCount: data.pages?.length || 0
      });
      
      return data;
    } catch (error: any) {
      log.error('Lucid SDK get document content failed:', error);
      throw new Error(`Failed to get document content ${documentId}: ${error.message}`);
    }
  }

  /**
   * Export document as PNG image
   */
  async exportDocumentAsPng(documentId: string, pageId: string = '0_0'): Promise<LucidImageExport> {
    if (!documentId) {
      throw new Error('Document ID is required');
    }
    
    log.debug('Exporting document as PNG:', { documentId, pageId });
    
    try {
      // Use direct fetch for image export as SDK might not support this properly
      const url = `https://api.lucid.co/documents/${documentId}?pageId=${pageId}`;
      const response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${this.apiKey}`,
          "Lucid-Api-Version": "1",
          "Accept": "image/png",
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to export document as PNG: ${response.status} ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type') || 'image/png';
      if (!contentType.includes('image/')) {
        throw new Error(`Expected image, got: ${contentType}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      log.debug('PNG export successful:', { 
        contentType, 
        size: buffer.length,
        documentId 
      });
      
      return {
        base64: buffer.toString('base64'),
        contentType,
        size: buffer.length
      };
    } catch (error: any) {
      log.error('PNG export failed:', error);
      throw new Error(`Failed to export document ${documentId} as PNG: ${error.message}`);
    }
  }

  /**
   * Create a new document from a Lucid Standard Import JSON specification.
   *
   * The Standard Import endpoint expects a `.lucid` file: a zip archive containing
   * a `document.json` at its root. Lucid reads the import type from the uploaded
   * file part's Content-Type header (`x-application/vnd.lucid.standardImport`), NOT
   * from a form field, so the multipart file part must carry that content type.
   */
  async createDocumentFromStandardImport(
    standardImportJson: string,
    title: string,
    product: string = 'lucidchart',
    parent?: number
  ): Promise<LucidDocumentCreated> {
    if (!standardImportJson || !standardImportJson.trim()) {
      throw new Error('standardImportJson is required');
    }
    if (!title || !title.trim()) {
      throw new Error('title is required');
    }
    // Fail fast with a clear message instead of a 400 from Lucid on malformed JSON
    try {
      JSON.parse(standardImportJson);
    } catch (e: any) {
      throw new Error(`standardImportJson is not valid JSON: ${e.message}`);
    }

    log.debug('Creating document via Standard Import:', { title, product });

    try {
      // A .lucid file is a zip archive with document.json at the root
      const archive = zipSync({ 'document.json': strToU8(standardImportJson) });
      const blob = new Blob([archive], { type: 'x-application/vnd.lucid.standardImport' });

      const form = new FormData();
      // The file part's content type is what Lucid uses to pick the import type
      form.append('file', blob, 'diagram.lucid');
      form.append('product', product);
      form.append('title', title);
      if (parent !== undefined) {
        form.append('parent', String(parent));
      }

      // Let fetch set the multipart boundary; do NOT set Content-Type manually
      const response = await fetch('https://api.lucid.co/documents', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Lucid-Api-Version': '1',
        },
        body: form,
      });

      if (!response.ok) {
        let detail = `HTTP ${response.status} ${response.statusText}`;
        try {
          const body = await response.text();
          if (body) detail += ` - ${body}`;
        } catch {
          // ignore body read failures
        }
        throw new Error(detail);
      }

      const data = await response.json();
      log.debug('Standard Import create response:', { documentId: data.documentId });
      return data;
    } catch (error: any) {
      log.error('Standard Import create failed:', error);
      throw new Error(`Failed to create document: ${error.message}`);
    }
  }

  /**
   * Move a document to the trash.
   *
   * Note: this trashes the ENTIRE document, not individual shapes. The REST API
   * has no shape-level delete and no in-place content edit. Returns 204 on success.
   */
  async trashDocument(documentId: string): Promise<void> {
    if (!documentId) {
      throw new Error('Document ID is required');
    }

    log.debug('Trashing document:', { documentId });

    try {
      const response = await fetch(`https://api.lucid.co/documents/${documentId}/trash`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Lucid-Api-Version': '1',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }
    } catch (error: any) {
      log.error('Trash document failed:', error);
      throw new Error(`Failed to trash document ${documentId}: ${error.message}`);
    }
  }
}

// Export singleton instance for convenience - lazy initialization
let _lucidServiceInstance: LucidService | null = null;

export const lucidService = {
  get instance(): LucidService {
    if (!_lucidServiceInstance) {
      _lucidServiceInstance = new LucidService();
    }
    return _lucidServiceInstance;
  },
  
  // For testing - allow resetting the singleton
  resetInstance(): void {
    _lucidServiceInstance = null;
  }
};

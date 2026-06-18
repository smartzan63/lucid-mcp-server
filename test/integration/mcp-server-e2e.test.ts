import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { 
  getDocumentSchema, 
  getDocumentHandler,
  searchDocumentsSchema,
  searchDocumentsHandler
} from "../../src/tools/index.js";
import { mockLucidDocument, mockDocumentList } from '../fixtures/data.js';

// Mock the LucidService for E2E tests
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

describe('Integration: MCP Server End-to-End', () => {
  let server: McpServer;

  beforeEach(() => {
    vi.stubEnv('LUCID_API_KEY', 'test-lucid-key');
    vi.clearAllMocks();

    // Create MCP Server instance similar to src/index.ts
    server = new McpServer({
      name: "lucid-mcp-server",
      version: "test-version",
      capabilities: {
        resources: {},
        tools: {},
      },
    });

    // Register tools
    server.tool(
      "get-document",
      "Get a specific Lucid document by its ID. Extract document ID from Lucid URL or use known document ID. Supports image export.",
      getDocumentSchema,
      getDocumentHandler
    );

    server.tool(
      "search-documents",
      "Search Lucid documents in your account returns document list with namesname and their IDs. Supports filtering by keywords",
      searchDocumentsSchema,
      searchDocumentsHandler
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should register tools correctly', () => {
    // This test verifies that the server can be instantiated and tools registered
    // without throwing errors
    expect(server).toBeDefined();
    // Note: We can't easily test the internal tool registry without accessing private members
    // But the fact that beforeEach doesn't throw means tools are registered correctly
  });

  it('should handle tool execution through MCP interface', async () => {
    const { lucidService } = await import('../../src/services/lucidService.js');
    (lucidService.instance.searchDocuments as any).mockResolvedValue(mockDocumentList);

    // Test that tools can be executed (simulating MCP call)
    const result = await searchDocumentsHandler({});

    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Found 2 documents');
  });

  it('should handle MCP server initialization with environment validation', () => {
    // Test server can be created with proper environment
    expect(() => {
      new McpServer({
        name: "test-server",
        version: "1.0.0",
        capabilities: { resources: {}, tools: {} }
      });
    }).not.toThrow();
  });
  it('should handle tool schema validation', () => {
    // Verify tool schemas are properly structured (Zod schemas)
    expect(getDocumentSchema).toBeDefined();
    expect(getDocumentSchema.documentId).toBeDefined();
    expect(getDocumentSchema.analyzeImage).toBeDefined();
    expect(getDocumentSchema.pageId).toBeDefined();

    expect(searchDocumentsSchema).toBeDefined();
    expect(searchDocumentsSchema.keywords).toBeDefined();
  });

  it('should handle concurrent tool executions', async () => {
    const { lucidService } = await import('../../src/services/lucidService.js');
    (lucidService.instance.searchDocuments as any).mockResolvedValue(mockDocumentList);
    (lucidService.instance.getDocument as any).mockResolvedValue(mockLucidDocument);

    // Execute multiple tools concurrently
    const [searchResult, getResult] = await Promise.all([
      searchDocumentsHandler({}),
      getDocumentHandler({ documentId: 'test-doc-123' })
    ]);

    expect(searchResult.content[0].text).toContain('Found 2 documents');
    expect(getResult.content[0].text).toContain('Test Document');
  });

  it('should handle error propagation through MCP interface', async () => {
    const { lucidService } = await import('../../src/services/lucidService.js');
    (lucidService.instance.searchDocuments as any).mockRejectedValue(new Error('Network timeout'));

    const result = await searchDocumentsHandler({});

    expect(result.content[0].text).toContain('Error searching documents');
    expect(result.content[0].text).toContain('Network timeout');
  });
});

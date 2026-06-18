/**
 * @file Unit tests for MCP server setup module
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock all dependencies before importing the module
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: vi.fn().mockImplementation(() => ({
    tool: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined)
  }))
}));

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn().mockReturnValue({})
}));

vi.mock('../../../src/tools/index.js', () => ({
  getDocumentSchema: { documentId: { type: 'string' } },
  getDocumentHandler: vi.fn(),
  searchDocumentsSchema: { keywords: { type: 'string' } },
  searchDocumentsHandler: vi.fn(),
  getDocumentTabsSchema: { documentId: { type: 'string' } },
  getDocumentTabsHandler: vi.fn()
}));

vi.mock('../../../src/utils/logger.js', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn()
  }
}));

// Import modules after mocking
import { createMcpServer, startMcpServer } from '../../../src/server/mcp-setup.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  getDocumentSchema,
  getDocumentHandler,
  searchDocumentsSchema,
  searchDocumentsHandler,
  getDocumentTabsSchema,
  getDocumentTabsHandler
} from '../../../src/tools/index.js';
import { log } from '../../../src/utils/logger.js';

describe('MCP Server Setup', () => {
  let mockServer: any;
  let mockTransport: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create fresh mock instances
    mockServer = {
      tool: vi.fn(),
      connect: vi.fn().mockResolvedValue(undefined)
    };
    mockTransport = {};
    
    // Configure mocks
    vi.mocked(McpServer).mockReturnValue(mockServer);
    vi.mocked(StdioServerTransport).mockReturnValue(mockTransport);
  });

  describe('createMcpServer', () => {
    it('should create MCP server with correct configuration', () => {
      const server = createMcpServer('1.2.3');

      expect(McpServer).toHaveBeenCalledWith(
        {
          name: "lucid-mcp-server",
          version: "1.2.3",
        },
        {
          capabilities: {
            resources: {},
            tools: {},
          },
        }
      );

      expect(server).toBe(mockServer);
    });

    it('should register get-document tool', () => {
      createMcpServer('1.2.3');

      expect(mockServer.tool).toHaveBeenCalledWith(
        "get-document",
        expect.stringContaining("Get a specific Lucid document"),
        getDocumentSchema,
        getDocumentHandler
      );
    });

    it('should register search-documents tool', () => {
      createMcpServer('1.2.3');

      expect(mockServer.tool).toHaveBeenCalledWith(
        "search-documents",
        expect.stringContaining("Search Lucid documents"),
        searchDocumentsSchema,
        searchDocumentsHandler
      );
    });

    it('should register get-document-tabs tool', () => {
      createMcpServer('1.2.3');

      expect(mockServer.tool).toHaveBeenCalledWith(
        "get-document-tabs",
        expect.stringContaining("Get metadata about all tabs"),
        getDocumentTabsSchema,
        getDocumentTabsHandler
      );
    });

    it('should register exactly 3 tools', () => {
      createMcpServer('1.2.3');

      expect(mockServer.tool).toHaveBeenCalledTimes(3);
    });

    it('should handle different version formats', () => {
      createMcpServer('0.1.0-beta.1+build.123');

      expect(McpServer).toHaveBeenCalledWith(
        {
          name: "lucid-mcp-server",
          version: "0.1.0-beta.1+build.123",
        },
        {
          capabilities: {
            resources: {},
            tools: {},
          },
        }
      );
    });

    it('should handle empty version', () => {
      createMcpServer('');

      expect(McpServer).toHaveBeenCalledWith(
        {
          name: "lucid-mcp-server",
          version: "",
        },
        {
          capabilities: {
            resources: {},
            tools: {},
          },
        }
      );
    });
  });

  describe('startMcpServer', () => {
    it('should create transport and connect server', async () => {
      await startMcpServer(mockServer);

      expect(StdioServerTransport).toHaveBeenCalled();
      expect(mockServer.connect).toHaveBeenCalledWith(mockTransport);
    });

    it('should log success message', async () => {
      await startMcpServer(mockServer);

      expect(log.info).toHaveBeenCalledWith("Lucid MCP Server running on stdio");
    });

    it('should handle server connection errors', async () => {
      const connectionError = new Error('Connection failed');
      mockServer.connect.mockRejectedValueOnce(connectionError);

      await expect(startMcpServer(mockServer)).rejects.toThrow('Connection failed');
    });

    it('should handle transport creation errors', async () => {
      vi.mocked(StdioServerTransport).mockImplementationOnce(() => {
        throw new Error('Transport creation failed');
      });

      await expect(startMcpServer(mockServer)).rejects.toThrow('Transport creation failed');
    });

    it('should call connect with the created transport', async () => {
      await startMcpServer(mockServer);

      expect(StdioServerTransport).toHaveBeenCalledTimes(1);
      expect(mockServer.connect).toHaveBeenCalledWith(mockTransport);
    });
  });
});

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  getDocumentSchema, 
  getDocumentHandler,
  searchDocumentsSchema,
  searchDocumentsHandler,
  getDocumentTabsSchema,
  getDocumentTabsHandler
} from "../tools/index.js";
import { log } from "../utils/logger.js";

/**
 * Create and configure MCP server
 * @param {string} version - Application version
 * @returns {McpServer} Configured MCP server
 */
export function createMcpServer(version: string): McpServer {
  const server = new McpServer(
    {
      name: "lucid-mcp-server",
      version: version,
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  // Register all tools with proper description
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

  server.tool(
    "get-document-tabs",
    "Get metadata about all tabs (pages) in a Lucid document. Returns compact JSON with document info and page metadata (id, title, index) only - excludes shapes, lines, and other content.",
    getDocumentTabsSchema,
    getDocumentTabsHandler
  );

  return server;
}

/**
 * Start MCP server with stdio transport
 * @param {McpServer} server - Configured MCP server
 */
export async function startMcpServer(server: McpServer): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log.info("Lucid MCP Server running on stdio");
}

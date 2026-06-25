import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { 
  getDocumentSchema, 
  getDocumentHandler,
  searchDocumentsSchema,
  searchDocumentsHandler,
  getDocumentTabsSchema,
  getDocumentTabsHandler,
  createDiagramSchema,
  createDiagramHandler,
  deleteDiagramSchema,
  deleteDiagramHandler
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

  server.tool(
    "create-diagram",
    "Create a new Lucid diagram from Standard Import JSON. Author JSON describing pages, shapes, and lines (no Mermaid); the document is created in your Lucid account and the edit URL is returned. Use for flowcharts, org charts, UML, BPMN, and cloud architecture diagrams.",
    createDiagramSchema,
    createDiagramHandler
  );

  server.tool(
    "delete-diagram",
    "Delete a Lucid document by moving it to the trash. This removes the ENTIRE document (there is no shape-level delete or in-place edit in the API). Useful for cleanup or the create-new-then-trash-old pattern.",
    deleteDiagramSchema,
    deleteDiagramHandler
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

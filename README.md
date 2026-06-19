[![MseeP.ai Security Assessment Badge](https://mseep.net/pr/smartzan63-lucid-mcp-server-badge.png)](https://mseep.ai/app/smartzan63-lucid-mcp-server)

# Lucid MCP Server

[![npm version](https://img.shields.io/npm/v/lucid-mcp-server.svg)](https://www.npmjs.com/package/lucid-mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/lucid-mcp-server.svg)](https://www.npmjs.com/package/lucid-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Model Context Protocol (MCP) server for Lucid App integration. Exports Lucid diagrams as images so a vision-capable client can interpret them.

## Table of Contents
- [Features](#features)
- [How It Works](#how-it-works)
- [Client and Model Compatibility](#client-and-model-compatibility)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [References](#references)
- [License](#license)

## Features

- 🔍 **Document discovery** and metadata retrieval from LucidChart, LucidSpark, and LucidScale
- 📑 **Lightweight tab metadata** for quick document structure overview
- 🖼️ **PNG image export** from Lucid diagrams, returned as an image content block for a vision-capable client to interpret
- 📝 **TypeScript implementation** with full test coverage
- 🔧 **MCP Inspector integration** for easy testing

## How It Works

The server is a thin bridge to the Lucid REST API. It does **not** run any LLM of its own:

- `search-documents` and `get-document-tabs` return JSON metadata from the Lucid API.
- `get-document` with `analyzeImage: true` exports the requested page as a PNG and returns it as an MCP `image` content block.

Diagram interpretation is delegated entirely to the model already driving your MCP client. This keeps the server free of any AI-provider dependency and reuses the (typically more capable) model running your session instead of a second, separately configured one.

> Earlier versions (≤ 0.1.x) shipped a built-in image-analysis backend (Azure OpenAI / OpenAI) that returned a text description. Modern MCP clients forward image content directly to vision-capable models, making that second model redundant, so it was removed. The `analyzeImage` parameter name is kept for compatibility; it now simply toggles PNG export.

## Client and Model Compatibility

Because the server returns a raw image, the **active session model must be vision-capable**. Behaviour by client:

| Client | MCP image support | Notes |
|--------|-------------------|-------|
| Claude Code | Yes | Claude is multimodal; works out of the box. |
| Codex CLI | Yes (current versions) | Image results from MCP tools reach the model since the Rust MCP client became the default. Older builds displayed `<image content>` the model could not see. |
| OpenCode | Yes, with a vision model | Forwards MCP image blocks to the model. Pick a vision-capable model (e.g. GPT-5.x, GPT-4o). A non-vision model, or a model router that selects one, will report it cannot see the image. |

Verified by exporting a real architecture diagram and confirming the model described its boxes and connections from the image alone:

- Claude Code (multimodal Claude model)
- OpenCode running GPT-5.5

If `get-document` returns an image but the model replies that it cannot see it, switch your session to a vision-capable model.

## Prerequisites

Before you begin, ensure you have the following:

- **Node.js**: Version 18 or higher.
- **Lucid API Key**: A key from the [Lucid Developer Portal](https://developer.lucid.co/docs/api-keys) is **required** for all features.
- **Vision-capable client**: To interpret exported diagram images, use an MCP client backed by a vision-capable model. The server does not analyze images itself; it returns the raw PNG.

## Installation

`lucid-mcp-server` is a stdio MCP server and works with any MCP-capable client (Claude Code, Claude Desktop, Cursor, Codex, OpenCode, and others). Every client has its own config file and format, so there is no single set of steps. The fastest path is to ask your coding agent to "add the lucid-mcp-server MCP server, following its README" and let it write the config for your specific client.

Whatever the client, you only need two things:

- A way to run the server: `npx -y lucid-mcp-server` (no install), or install it once with `npm install -g lucid-mcp-server` and run `lucid-mcp-server`.
- The `LUCID_API_KEY` environment variable: the only required setting. Get a key from the [Lucid Developer Portal](https://developer.lucid.co/docs/api-keys).

### Example: Claude Code

Add this to your `.mcp.json`:

```json
{
  "mcpServers": {
    "lucid": {
      "command": "npx",
      "args": ["-y", "lucid-mcp-server"],
      "env": {
        "LUCID_API_KEY": "your-lucid-api-key"
      }
    }
  }
}
```

> Windows: npm's `.cmd` shim may not spawn directly. Wrap it as `"command": "cmd", "args": ["/c", "npx", "-y", "lucid-mcp-server"]`.

Other clients use the same three pieces, the launch command, its arguments, and the `LUCID_API_KEY` env var, expressed in their own config format. Point your agent at the example above and it will adapt it.

### Verify (optional)

Run the server under the MCP Inspector to confirm it starts and lists its tools (set `LUCID_API_KEY` in your environment first):

```bash
npx @modelcontextprotocol/inspector npx -y lucid-mcp-server
```

## Usage

Once the server is running, you can interact with it using natural language or by calling its tools directly.

### Example Prompts

- **Document commands**:
  - *"Show me all my Lucid documents"*
  - *"Get information about the document with ID: [document-id]"*

- **Diagram interpretation** (the client's vision-capable model reads the exported image):
  - *"Analyze this diagram: [document-id]"*
  - *"What does this Lucid diagram show: [document-id]"*

### Available Tools

#### 🔍 `search-documents`  
Lists documents in your Lucid account.

- **Parameters:**
  - `keywords` (string, optional): Search keywords to filter documents.
- **Example:**
  ```json
  {
    "keywords": "architecture diagram"
  }
  ```

#### 📋 `get-document`
Gets document metadata and can optionally export the diagram as a PNG image for a vision-capable client to interpret.

- **Parameters:**
  - `documentId` (string): The ID of the document from the Lucid URL.
  - `analyzeImage` (boolean, optional): Set to `true` to export the diagram as a PNG image (default: `false`, returns metadata only).
  - `pageId` (string, optional): The specific page to export (default: "0_0").
- **Example:**
  ```json
  {
    "documentId": "demo-document-id-here-12345678/edit",
    "analyzeImage": true
  }
  ```

#### 📑 `get-document-tabs`
Gets lightweight metadata about all tabs (pages) in a Lucid document without retrieving full content.

- **Parameters:**
  - `documentId` (string): The ID of the document from the Lucid URL.
- **Returns:** Document info with page metadata (id, title, index) for quick navigation and overview.
- **Example:**
  ```json
  {
    "documentId": "demo-document-id-here-12345678/edit"
  }
  ```

## 🤝 Contributing

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Add amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

## 📚 References

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Lucid Developer API](https://developer.lucid.co/)
- [MCP Typescript SDK Documentation](https://github.com/modelcontextprotocol/typescript-sdk)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

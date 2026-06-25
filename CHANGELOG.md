# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.0] - 2026-06-25

### Added
- `create-diagram` tool: creates a new Lucid document from Lucid Standard Import JSON. Packages the JSON into a `.lucid` archive and posts it to the Lucid API, returning the edit URL. The `standardImportJson` parameter description embeds a compact authoring guide (shape types, line endpoints, assisted layout). Requires an API key with document edit (write) scope.
- `delete-diagram` tool: moves a Lucid document to the trash by ID. Requires write scope.
- `fflate` dependency for in-memory `.lucid` (zip) packaging.

### Changed
- The MCP server now registers 5 tools (was 3).
- README documents the new write capabilities, the write-scope requirement, and the absence of in-place content editing in the Lucid REST API: editing means create-new-then-delete-old, and exported JSON and Standard Import JSON are not interchangeable (no download-edit-reupload round trip).
- Prerequisites now state Node.js >= 22 (matching `engines`).

## [0.2.0] - 2026-06-18

### Removed
- Built-in image-analysis backend (Azure OpenAI / OpenAI). The server no longer calls an LLM; it returns the exported diagram as an MCP `image` content block for the client's own vision-capable model to interpret.
- `openai` dependency and all related environment variables (`AZURE_OPENAI_*`, `OPENAI_API_KEY`, `OPENAI_MODEL`).
- Smithery deployment config (`smithery.yaml`, `Dockerfile`). The package is distributed via npm; Smithery deployment is no longer maintained.

### Changed
- `get-document` with `analyzeImage: true` now returns the page title and the PNG image block only (no server-generated text analysis). The `analyzeImage` parameter name is retained for compatibility but now only toggles PNG export.
- Interpreting diagrams now requires a vision-capable model in the MCP client. See "Client and Model Compatibility" in the README for verified clients (Claude Code, Codex CLI, OpenCode with a vision model).

### Fixed
- Build against `@modelcontextprotocol/sdk` 1.16+ : `capabilities` moved to the `McpServer` options (second constructor argument), matching the current SDK signature. Previously the build broke when a fresh install resolved a newer SDK than the one pinned locally.

### Internal
- Commit `package-lock.json` and switch CI to `npm ci` for reproducible builds, preventing silent dependency drift between local and CI.
- Require Node.js >= 22 (`engines`); CI now tests on Node 22 and 24 and uses the current major versions of the GitHub Actions.
- Publish to npm via trusted publishing (OIDC), no long-lived token, with automatic provenance.

## [0.1.5] - 2025-08-01

### Added
- **Tab Metadata Tool**: New `get-document-tabs` tool for retrieving lightweight page metadata from Lucidchart documents
- Returns compact JSON with document info and page metadata (id, title, index) without heavy content like shapes and lines
- Optimized for LLM usage scenarios and automation workflows

### Changed
- Enhanced MCP server tool registration to include 3 tools (was 2)
- Updated test suite to support new tool functionality

## [0.1.4] - 2025-07-01

### Added
- **OpenAI Provider**: Added support for OpenAI as an alternative to Azure OpenAI
- Automatic fallback between Azure OpenAI and OpenAI providers based on configuration

### Changed
- Refactored LLM provider architecture to support multiple providers
- Updated tests to reflect new provider behavior

## [0.1.3] - 2025-06-23

### Added
- Utility functions in lucidModels.ts (validation, filtering, sorting)
- Comprehensive unit and integration tests (81%+ coverage)

### Fixed
- **Critical**: "Cannot find module 'oas'" error in npm package
- isValidLucidDocument type guard returning null instead of false

### Changed
- **Major refactoring**: Extracted logic from index.ts into separate modules (cli, config, server)
- Streamlined README.md for easier installation
- Improved error handling and environment validation

## [0.1.0] - [0.1.2] - 2025-06-19

### Added
- Initial release of Lucid MCP Server
- Document search and retrieval functionality
- PNG/JPEG image export from Lucid diagrams
- AI-powered diagram analysis with multimodal LLMs
- TypeScript implementation with comprehensive test coverage
- Support for LucidChart, LucidSpark, and LucidScale
- Environment-based configuration
- MCP Inspector integration for testing

### Features
- `get-document` tool for document metadata and AI analysis
- `search-documents` tool for document discovery
- Built-in image analysis using Azure OpenAI GPT-4o
- Configurable AI analysis with custom prompts
- Comprehensive error handling and logging

### Dependencies
- Model Context Protocol SDK v1.13.0
- Official Lucid Developer API SDK
- Azure OpenAI integration
- Zod for schema validation

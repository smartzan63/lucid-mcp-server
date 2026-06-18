/**
 * CLI arguments handler
 */
export interface CliArgs {
  help: boolean;
  version: boolean;
}

/**
 * Parse CLI arguments
 * @param {string[]} args - Command line arguments
 * @returns {CliArgs} Parsed arguments
 */
export function parseCliArgs(args: string[]): CliArgs {
  return {
    help: args.includes('--help') || args.includes('-h'),
    version: args.includes('--version') || args.includes('-v')
  };
}

/**
 * Show help message
 * @param {string} version - Application version
 */
export function showHelp(version: string): void {
  console.log(`
Lucid MCP Server v${version}

DESCRIPTION:
  Model Context Protocol (MCP) server for Lucid App integration.
  Exports Lucid diagrams as images for a vision-capable client to interpret.

USAGE:
  lucid-mcp-server [options]

OPTIONS:
  --help, -h     Show this help message
  --version, -v  Show version information

ENVIRONMENT VARIABLES:
  LUCID_API_KEY              Required: Your Lucid API key

TOOLS:
  get-document       Get document metadata and export images
  search-documents   Search for documents in your Lucid account

For more information, visit: https://github.com/smartzan63/lucid-mcp-server
`);
}

/**
 * Show version information
 * @param {string} version - Application version
 */
export function showVersion(version: string): void {
  console.log(version);
}

/**
 * Handle CLI arguments and exit if needed
 * @param {string[]} args - Command line arguments
 * @param {string} version - Application version
 * @returns {boolean} True if should continue, false if should exit
 */
export function handleCliArgs(args: string[], version: string): boolean {
  const parsed = parseCliArgs(args);

  if (parsed.help) {
    showHelp(version);
    process.exit(0);
  }

  if (parsed.version) {
    showVersion(version);
    process.exit(0);
  }

  return true;
}

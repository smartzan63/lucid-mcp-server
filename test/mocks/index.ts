import { vi } from 'vitest';

export const createMockLucidApi = () => ({
  getDocument: vi.fn(),
  searchDocuments: vi.fn(),
  exportDocument: vi.fn(),
});

export const createMockMCPServer = () => ({
  connect: vi.fn(),
  request: vi.fn(),
  notification: vi.fn(),
  close: vi.fn(),
});

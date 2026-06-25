import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { deleteDiagramHandler } from '../../../src/tools/deleteDiagram.js';
import { setupTestEnvironment, resetTestEnvironment } from '../../utils.js';
import { lucidService } from '../../../src/services/lucidService.js';

describe('deleteDiagramHandler', () => {
  beforeEach(() => {
    setupTestEnvironment();
    vi.clearAllMocks();
  });

  afterEach(() => {
    resetTestEnvironment();
  });

  it('should trash the document and confirm', async () => {
    const spy = vi.spyOn(lucidService.instance, 'trashDocument').mockResolvedValue(undefined);

    const result = await deleteDiagramHandler({ documentId: 'doc-123' });

    expect(spy).toHaveBeenCalledWith('doc-123');
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Moved document doc-123 to trash');
  });

  it('should return an error message when the service throws', async () => {
    vi.spyOn(lucidService.instance, 'trashDocument').mockRejectedValue(
      new Error('Failed to trash document doc-123: HTTP 403 Forbidden')
    );

    const result = await deleteDiagramHandler({ documentId: 'doc-123' });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Error: Failed to trash document doc-123: HTTP 403');
  });
});

export const mockLucidDocument = {
  documentId: 'test-doc-123',
  title: 'Test Document',
  created: '2024-01-01T00:00:00Z',
  lastModified: '2024-01-02T00:00:00Z',
  editUrl: 'https://lucid.app/lucidchart/test-doc-123/edit',
  viewUrl: 'https://lucid.app/lucidchart/test-doc-123/view',
  pageCount: 1,
  status: 'Active',
  product: 'Lucidchart',
  version: 2,
  canEdit: true,
  creatorId: 12345,
  lastModifiedUserId: 12345,
  classification: 'Public',
  customAttributes: [{ name: 'project', value: 'lucid-mcp' }],
  customTags: [{ name: 'diagram' }, { name: 'flowchart' }],
  trashed: '2024-06-27T00:00:00Z',
  owner: {
    id: 12345,
    type: 'user',
    name: 'Test User'
  },
  // Legacy compatibility
  id: 'test-doc-123',
  url: 'https://lucid.app/lucidchart/test-doc-123/edit',
};

export const mockDocumentList = [
  mockLucidDocument,
  {
    documentId: 'test-doc-456',
    title: 'Another Test Document',
    created: '2024-01-03T00:00:00Z',
    lastModified: '2024-01-04T00:00:00Z',
    editUrl: 'https://lucid.app/lucidchart/test-doc-456/edit',
    viewUrl: 'https://lucid.app/lucidchart/test-doc-456/view',
    pageCount: 2,
    status: 'Active',
    product: 'Lucidchart',
    version: 1,
    canEdit: false,
    creatorId: 67890,
    lastModifiedUserId: 67890,
    classification: 'Internal',
    customAttributes: [{ name: 'department', value: 'engineering' }],
    customTags: [{ name: 'architecture' }, { name: 'system-design' }],
    trashed: null,
    owner: {
      id: 67890,
      type: 'user',
      name: 'Engineering Team'
    },
    // Legacy compatibility
    id: 'test-doc-456',
    url: 'https://lucid.app/lucidchart/test-doc-456/edit',
  },
];

export const mockDocumentContent = {
  id: 'test-doc-123',
  pages: [
    {
      id: 'page-1',
      shapes: [
        {
          id: 'shape-1',
          type: 'rectangle',
          text: 'Start',
          position: { x: 100, y: 100 },
          size: { width: 100, height: 50 },
        },
        {
          id: 'shape-2',
          type: 'diamond',
          text: 'Decision?',
          position: { x: 200, y: 200 },
          size: { width: 120, height: 80 },
        },
      ],
      lines: [
        {
          id: 'line-1',
          from: 'shape-1',
          to: 'shape-2',
          style: 'arrow',
        },
      ],
    },
  ],
};

export const mockEnvironmentVariables = {
  LUCID_API_KEY: 'test-lucid-api-key',
  LUCID_CLIENT_ID: 'test-lucid-client-id',
  LUCID_CLIENT_SECRET: 'test-lucid-client-secret',
  LUCID_REFRESH_TOKEN: 'test-lucid-refresh-token',
};

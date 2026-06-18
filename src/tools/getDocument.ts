import { z } from "zod";
import { lucidService } from "../services/lucidService.js";

export const getDocumentSchema = {
  documentId: z.string().describe("The ID of the Lucid document to retrieve. Can be extracted from URLs like https://lucid.app/lucidchart/{id}/edit"),
  analyzeImage: z.boolean().optional().describe("If true, export the diagram as a PNG image (default: false, returns metadata only)"),
  pageId: z.string().optional().describe("Page ID to export (default: '0_0')")
};

export const getDocumentHandler = async ({
  documentId,
  analyzeImage = false,
  pageId = "0_0"
}: {
  documentId: string,
  analyzeImage?: boolean,
  pageId?: string
}) => {  try {
    // Get document metadata
    const doc = await lucidService.instance.getDocument(documentId);
      // If no analysis needed, return comprehensive metadata
    if (!analyzeImage) {
      const createdDate = doc.created ? new Date(doc.created).toLocaleDateString() : 'N/A';
      const modifiedDate = doc.lastModified ? new Date(doc.lastModified).toLocaleDateString() : 'N/A';
      
      // Build comprehensive document info
      let documentInfo = `**Document Information**\n`;
      documentInfo += `Title: ${doc.title || 'Untitled'}\n`;
      documentInfo += `ID: ${documentId}\n`;
      documentInfo += `Product: ${doc.product || 'N/A'}\n`;
      documentInfo += `Version: ${doc.version || 'N/A'}\n`;
      documentInfo += `Page Count: ${doc.pageCount || 'Unknown'}\n`;
      documentInfo += `Status: ${doc.status || 'N/A'}\n`;
      documentInfo += `Classification: ${doc.classification || 'None'}\n`;
      documentInfo += `Can Edit: ${doc.canEdit ? 'Yes' : 'No'}\n`;
      documentInfo += `Created: ${createdDate}\n`;
      documentInfo += `Last Modified: ${modifiedDate}\n`;
        if (doc.owner) {
        documentInfo += `\n**Owner Information**\n`;
        documentInfo += `Name: ${doc.owner.name}\n`;
        documentInfo += `ID: ${doc.owner.id}\n`;
        documentInfo += `Type: ${doc.owner.type}\n`;
      }
      
      if (doc.creatorId) {
        documentInfo += `\n**Creator ID:** ${doc.creatorId}\n`;
      }
      
      if (doc.lastModifiedUserId) {
        documentInfo += `**Last Modified by User ID:** ${doc.lastModifiedUserId}\n`;
      }
      
      if (doc.customTags && doc.customTags.length > 0) {
        documentInfo += `\n**Custom Tags:** ${doc.customTags.map((tag: any) => typeof tag === 'string' ? tag : tag.name || tag).join(', ')}\n`;
      }
      
      if (doc.customAttributes && doc.customAttributes.length > 0) {
        documentInfo += `\n**Custom Attributes:** ${doc.customAttributes.length} attributes defined\n`;
      }
      
      if (doc.editUrl) {
        documentInfo += `\n**Edit URL:** ${doc.editUrl}\n`;
      }
      
      if (doc.viewUrl) {
        documentInfo += `**View URL:** ${doc.viewUrl}\n`;
      }
      
      if (doc.trashed) {
        documentInfo += `\n**Status:** Trashed on ${new Date(doc.trashed).toLocaleDateString()}\n`;
      }
      
      return {
        content: [
          {
            type: "text" as const,
            text: documentInfo
          }
        ]
      };
    }    // Export the diagram as PNG
    const imageData = await lucidService.instance.exportDocumentAsPng(documentId, pageId);

    // Return the raw image so a vision-capable caller can interpret it directly.
    const content: any[] = [
      {
        type: "text" as const,
        text: `**${doc.title || 'Lucid Diagram'}** (page ${pageId})`
      },
      {
        type: "image" as const,
        data: imageData.base64,
        mimeType: imageData.contentType || "image/png"
      }
    ];

    return { content };
  } catch (err: any) {
    return {
      content: [
        {
          type: "text" as const,
          text: `Error: ${err.message}`
        }
      ]
    };
  }
};
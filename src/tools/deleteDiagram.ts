import { z } from "zod";
import { lucidService } from "../services/lucidService.js";

export const deleteDiagramSchema = {
  documentId: z
    .string()
    .describe(
      "The ID of the Lucid document to delete (move to trash). Can be extracted from URLs like https://lucid.app/lucidchart/{id}/edit. This trashes the WHOLE document, not individual shapes."
    )
};

export const deleteDiagramHandler = async ({ documentId }: { documentId: string }) => {
  try {
    await lucidService.instance.trashDocument(documentId);
    return {
      content: [
        {
          type: "text" as const,
          text: `Moved document ${documentId} to trash.`
        }
      ]
    };
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

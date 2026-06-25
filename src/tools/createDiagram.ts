import { z } from "zod";
import { lucidService } from "../services/lucidService.js";

const STANDARD_IMPORT_GUIDE = `Lucid Standard Import JSON (the contents of document.json). Author it yourself; no Mermaid.

Top-level shape:
{
  "version": 1,
  "pages": [
    {
      "id": "page1",
      "title": "Page 1",
      "shapes": [
        { "id": "s1", "type": "terminator", "boundingBox": {"x":0,"y":0,"w":160,"h":60}, "text": "Start" },
        { "id": "s2", "type": "process",    "boundingBox": {"x":0,"y":120,"w":160,"h":60}, "text": "Do work" },
        { "id": "s3", "type": "decision",   "boundingBox": {"x":0,"y":240,"w":160,"h":80}, "text": "OK?" }
      ],
      "lines": [
        {
          "id": "l1", "lineType": "elbow",
          "endpoint1": {"type":"shapeEndpoint","style":"none","shapeId":"s1"},
          "endpoint2": {"type":"shapeEndpoint","style":"arrow","shapeId":"s2"}
        }
      ]
    }
  ]
}

Rules:
- Every shape/line/page needs a unique id. Shapes need a boundingBox {x,y,w,h}. Numbers must be numeric, colors hex (e.g. "#FF0000"), no emoji in text.
- Connect shapes with lines via shapeEndpoint (shapeId). For a directional arrow A->B set endpoint1.style "none" and endpoint2.style "arrow". lineType: "straight" | "elbow" | "curved".
- Common shape types: rectangle, text, process, decision, terminator, document, database, delay, data, predefinedProcess; circle, diamond, hexagon; umlClass; bpmn* ; namedShape (AWS/Azure/GCP icons via className). Containers: rectangleContainer, roundedRectangleContainer, swimLanes, bpmnPool.
- Layout: coordinates are a starting point. For flowcharts you do not need perfect positions; just give a rough top-to-bottom or left-to-right spread and Lucid's assisted layout (on containers via "assistedLayout": true) neatens it. Connections, not coordinates, define logical order.
- Size limit: document.json max 2MB. Keep JSON concise.`;

export const createDiagramSchema = {
  title: z.string().describe("Title for the new Lucid document"),
  standardImportJson: z.string().describe(STANDARD_IMPORT_GUIDE),
  product: z
    .enum(["lucidchart", "lucidspark"])
    .optional()
    .describe('Lucid product to create the document in (default "lucidchart")'),
  parent: z
    .number()
    .optional()
    .describe("Optional Lucid folder ID to create the document inside")
};

export const createDiagramHandler = async ({
  title,
  standardImportJson,
  product = "lucidchart",
  parent
}: {
  title: string;
  standardImportJson: string;
  product?: "lucidchart" | "lucidspark";
  parent?: number;
}) => {
  try {
    const doc = await lucidService.instance.createDocumentFromStandardImport(
      standardImportJson,
      title,
      product,
      parent
    );

    let text = `Created Lucid document "${doc.title || title}"\n`;
    text += `ID: ${doc.documentId}\n`;
    if (doc.editUrl) text += `Edit URL: ${doc.editUrl}\n`;
    if (doc.viewUrl) text += `View URL: ${doc.viewUrl}\n`;
    if (doc.pageCount) text += `Pages: ${doc.pageCount}\n`;

    return {
      content: [
        {
          type: "text" as const,
          text
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

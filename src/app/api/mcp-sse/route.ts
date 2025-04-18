import type { NextRequest } from "next/server";

// Tool definitions
const tools = [
  {
    name: "getColorInfo",
    description: "Get information about a specific color",
    parameters: {
      type: "object",
      properties: {
        color: {
          type: "string",
          description: "The hex code of the color (e.g., #FF5733)",
        },
      },
      required: ["color"],
    },
  },
  {
    name: "getCurrentColors",
    description: "Get the user's current colors",
    parameters: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "addColorsToTheme",
    description: "Add a group of related colors to the user's theme",
    parameters: {
      type: "object",
      properties: {
        themeName: {
          type: "string",
          description:
            "A descriptive name for this color theme (e.g., 'Ocean Breeze')",
        },
        colors: {
          type: "array",
          description: "Array of colors that belong to this theme",
          items: {
            type: "object",
            properties: {
              color: {
                type: "string",
                description: "Color code in hex format (e.g., #3498DB)",
              },
              name: {
                type: "string",
                description:
                  "Descriptive name for this specific color (e.g., 'Deep Sea Blue')",
              },
            },
            required: ["color", "name"],
          },
        },
      },
      required: ["themeName", "colors"],
    },
  },
];

// SSE handler
export async function GET(req: NextRequest) {
  const clientId = crypto.randomUUID();
  console.log(`[MCP-SSE] Client connected: ${clientId}`);

  // Set up SSE headers
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Create a readable stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send tools event
      console.log(`[MCP-SSE] Sending tools to client ${clientId}`);
      const toolsEvent = `event: tools\ndata: ${JSON.stringify({ tools })}\n\n`;
      controller.enqueue(encoder.encode(toolsEvent));

      // Handle client disconnection
      req.signal.addEventListener("abort", () => {
        console.log(`[MCP-SSE] Client disconnected: ${clientId}`);
        controller.close();
      });
    },
  });

  console.log(`[MCP-SSE] SSE stream setup complete for client ${clientId}`);
  return new Response(stream, { headers });
}

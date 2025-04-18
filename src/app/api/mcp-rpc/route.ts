import { NextResponse } from "next/server";

export async function POST(req: Request) {
  console.log(`[MCP-RPC] Received POST request`);

  try {
    const body = await req.json();
    console.log(`[MCP-RPC] Request body:`, JSON.stringify(body));

    // Check if it's a method call
    if (body.method === "call") {
      const { id, params } = body;
      const { name, arguments: args } = params;

      console.log(`[MCP-RPC] Tool call: ${name}`, JSON.stringify(args));

      // Process the tool call
      let result;
      switch (name) {
        case "getColorInfo":
          console.log(
            `[MCP-RPC] Processing getColorInfo for color: ${args.color}`
          );
          result = {
            formats: {
              hex: args.color,
              rgb: "rgb(255, 87, 51)",
              hsl: "hsl(14, 100%, 60%)",
            },
            properties: {
              name: "Bright Orange",
              isLight: false,
              luminance: "0.32",
              contrastColor: "#FFFFFF",
            },
            harmony: {
              complementary: "#33B5FF",
              analogous: ["#FF3333", "#FF9C33"],
            },
          };
          break;

        case "getCurrentColors":
          console.log(`[MCP-RPC] Processing getCurrentColors`);
          result = {
            currentColor: "#0066FF",
            savedColors: [
              { id: "1", name: "Sky Blue", color: "#0066FF", favorite: true },
              {
                id: "2",
                name: "Sunset Orange",
                color: "#FF5733",
                favorite: false,
              },
              {
                id: "3",
                name: "Forest Green",
                color: "#228B22",
                favorite: true,
              },
            ],
          };
          break;

        case "addColorsToTheme":
          console.log(
            `[MCP-RPC] Processing addColorsToTheme for theme: ${args.themeName}`
          );
          result = {
            success: true,
            message: `Added ${args.colors.length} colors with theme "${args.themeName}"`,
            colors: args.colors,
          };
          break;

        default:
          console.log(`[MCP-RPC] Unknown tool: ${name}`);
          return NextResponse.json(
            {
              jsonrpc: "2.0",
              id,
              error: {
                code: -32601,
                message: `Method ${name} not found`,
              },
            },
            { status: 404 }
          );
      }

      // Return the result
      console.log(
        `[MCP-RPC] Tool call successful, returning result for ${name}`
      );
      return NextResponse.json({
        jsonrpc: "2.0",
        id,
        result,
      });
    }

    // Handle other methods or return error for unsupported methods
    console.log(`[MCP-RPC] Unsupported method: ${body.method}`);
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: body.id,
        error: {
          code: -32601,
          message: `Method ${body.method} not supported`,
        },
      },
      { status: 400 }
    );
  } catch (error) {
    console.error(`[MCP-RPC] Error processing request:`, error);
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        id: null,
        error: {
          code: -32603,
          message: "Internal error",
          data: error instanceof Error ? error.message : String(error),
        },
      },
      { status: 500 }
    );
  }
}

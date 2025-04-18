import { NextResponse } from "next/server";
import { experimental_createMCPClient } from "ai";

export async function GET() {
  let mcpClient = null;

  try {
    console.log("[TEST-MCP] Testing MCP client");

    // Determine the base URL for the MCP server
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const mcpUrl = `${baseUrl}/api/mcp-sse`;

    console.log("[TEST-MCP] Using MCP server URL:", mcpUrl);

    // Create an MCP client
    console.log("[TEST-MCP] Creating MCP client...");
    mcpClient = await experimental_createMCPClient({
      transport: {
        type: "sse",
        url: mcpUrl,
        onUncaughtError: (error) =>
          console.error("[TEST-MCP] MCP uncaught error:", error),
      },
    });
    console.log("[TEST-MCP] MCP client created successfully");

    // Get tools from the MCP server
    console.log("[TEST-MCP] Getting MCP tools...");
    const tools = await mcpClient.tools();
    console.log("[TEST-MCP] MCP tools retrieved successfully");

    // Test a tool call
    console.log("[TEST-MCP] Testing getColorInfo tool...");
    const result = await tools.call("getColorInfo", { color: "#FF5733" });
    console.log("[TEST-MCP] Tool call successful:", JSON.stringify(result));

    // Close the MCP client
    console.log("[TEST-MCP] Closing MCP client...");
    await mcpClient.close();
    console.log("[TEST-MCP] MCP client closed successfully");

    return NextResponse.json({
      success: true,
      message: "MCP client test successful",
      toolNames: Object.keys(tools.schemas || {}),
      result,
    });
  } catch (error) {
    console.error("[TEST-MCP] Error testing MCP client:", error);

    // Make sure to close the MCP client if there was an error
    if (mcpClient) {
      try {
        await mcpClient.close();
        console.log("[TEST-MCP] MCP client closed after error");
      } catch (closeError) {
        console.error(
          "[TEST-MCP] Error closing MCP client after error:",
          closeError
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        message: "MCP client test failed",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

import { deepseek } from "@ai-sdk/deepseek";
import { streamText, experimental_createMCPClient } from "ai";
import { colorExpertSystemPrompt } from "@/lib/prompt";

export async function POST(req: Request) {
  try {
    console.log("[CHAT] Chat API route called");

    const { messages } = await req.json();
    console.log(
      "[CHAT] Received messages:",
      JSON.stringify(messages.slice(-1))
    );

    // Check API key
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY is not set");
    }

    // Determine the base URL for the MCP server
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const mcpUrl = `${baseUrl}/api/mcp-sse`;

    console.log("[CHAT] Using MCP server URL:", mcpUrl);

    // Create an MCP client that connects to our SSE endpoint
    const mcpClient = await experimental_createMCPClient({
      transport: {
        type: "sse",
        url: mcpUrl,
        onerror: (error) => console.error("[CHAT] MCP transport error:", error),
        onmessage: (message) =>
          console.log("[CHAT] MCP transport message:", message),
        headers: {
          cache: "no-cache",
        },
        // onUncaughtError: (error) =>
        //   console.error("[CHAT] MCP uncaught error:", error),
      },
    });

    console.log("[CHAT] MCP client created successfully");

    // Get tools from the MCP server
    const tools = await mcpClient.tools();
    console.log("[CHAT] MCP tools retrieved successfully");

    // Stream the response from the model
    const result = streamText({
      model: deepseek("deepseek-reasoner"),
      messages,
      system: colorExpertSystemPrompt,
      temperature: 0.7,
      tools,
      // Close the client when the response is finished
      onFinish: async () => {
        try {
          await mcpClient.close();
          console.log("[CHAT] MCP client closed successfully");
        } catch (error) {
          console.error("[CHAT] Error closing MCP client:", error);
        }
      },
    });

    console.log("[CHAT] Stream created successfully");

    // Return the streamed response
    return result.toDataStreamResponse();
  } catch (error) {
    console.error("[CHAT] Error in chat API route:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

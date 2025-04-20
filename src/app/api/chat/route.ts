import { deepseek } from "@ai-sdk/deepseek";
import { streamText, tool, StreamData } from "ai";
import { colorExpertSystemPrompt } from "@/lib/prompt";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    console.log("Chat API route called");

    const { messages: originalMessages } = await req.json();
    console.log(
      "Received messages:",
      JSON.stringify(originalMessages).slice(0, 200) + "..."
    );

    // Check API key
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY is not set");
    }

    console.log(
      "Using DeepSeek API key:",
      process.env.DEEPSEEK_API_KEY.substring(0, 5) + "..."
    );

    // Process messages to ensure they alternate between user and assistant
    const messages = [...originalMessages];
    const processedMessages = [];

    // Ensure the first message is from the user
    if (messages.length === 0 || messages[0].role !== "user") {
      processedMessages.push({
        role: "user",
        content: "Hi, I need help with colors.",
      });
    } else {
      processedMessages.push(messages[0]);
    }

    // Process the rest of the messages to ensure alternating roles
    for (let i = 1; i < messages.length; i++) {
      const prevRole = processedMessages[processedMessages.length - 1].role;
      const currentRole = messages[i].role;

      // Only add the message if it's from a different role than the previous one
      if (currentRole !== prevRole) {
        processedMessages.push(messages[i]);
      } else {
        console.log(
          `Skipping message ${i} because it has the same role (${currentRole}) as the previous message`
        );
      }
    }

    console.log(
      "Processed messages:",
      JSON.stringify(processedMessages).slice(0, 200) + "..."
    );

    // Create a StreamData instance for custom annotations
    const data = new StreamData();

    // Define tools using the tool helper function from the AI SDK
    const tools = {
      addColorsToTheme: tool({
        description:
          "Add a group of related colors to the user's current theme",
        parameters: z.object({
          themeName: z
            .string()
            .describe(
              "A descriptive name for this color theme (e.g., 'Ocean Breeze', 'Autumn Sunset')"
            ),
          colors: z
            .array(
              z.object({
                color: z
                  .string()
                  .describe("Color code in hex format (e.g., #3498DB)"),
                name: z
                  .string()
                  .describe(
                    "Descriptive name for this specific color (e.g., 'Deep Sea Blue')"
                  ),
              })
            )
            .describe("Array of colors that belong to this theme"),
        }),
        execute: async (params) => {
          console.log(
            "Tool call: addColorsToTheme",
            JSON.stringify(params, null, 2)
          );

          // Send a client action through the data stream
          data.append({
            type: "client-action",
            action: "addColorsToTheme",
            params,
          });

          // Return a placeholder result - we don't wait for client execution
          return {
            success: true,
            message: `Added ${params.colors.length} colors with theme "${params.themeName}"`,
            colors: params.colors,
          };
        },
      }),

      getCurrentColors: tool({
        description: "Get the user's current colors",
        parameters: z.object({}),
        execute: async () => {
          console.log("Tool call: getCurrentColors");

          // Return placeholder data
          return {
            currentColor: "#0066FF", // Default placeholder
            savedColors: [
              { id: "1", name: "Sky Blue", color: "#0066FF", favorite: true },
              {
                id: "2",
                name: "Sunset Orange",
                color: "#FF5733",
                favorite: false,
              },
            ],
          };
        },
      }),

      getColorInfo: tool({
        description: "Get technical information about a specific color",
        parameters: z.object({
          color: z.string().describe("Color in hex format (e.g., #FF5733)"),
        }),
        execute: async (params) => {
          const { color } = params;
          console.log("Getting color info for:", color);

          // For getColorInfo, we can execute it on the server since it doesn't need the store
          try {
            const result = await import("@/lib/color-tools").then((module) =>
              module.handleGetColorInfo(params)
            );
            return result;
          } catch (error) {
            console.error("Error getting color info:", error);
            return {
              error: `Failed to get color info: ${
                error instanceof Error ? error.message : String(error)
              }`,
            };
          }
        },
      }),
    };

    try {
      const result = streamText({
        model: deepseek("deepseek-chat"),
        messages: processedMessages,
        system: colorExpertSystemPrompt,
        temperature: 0.7,
        tools,
        maxSteps: 3, // Allow up to 3 steps for multi-step tool calling
        onStepFinish: ({ text, toolCalls, toolResults, finishReason }) => {
          console.log(`Step finished with reason: ${finishReason}`);
          if (toolCalls.length > 0) {
            console.log(
              `Tool calls in this step: ${toolCalls
                .map((tc) => tc.toolName)
                .join(", ")}`
            );
          }
        },
        onFinish: () => {
          // Close the stream data when the response is complete
          data.close();
        },
      });

      console.log("Stream created successfully");

      return result.toDataStreamResponse({
        data,
        getErrorMessage: (error) => {
          console.error("DeepSeek error:", error);
          return String(error);
        },
      });
    } catch (deepseekError) {
      console.error("DeepSeek API error:", deepseekError);
      data.close();
      throw deepseekError;
    }
  } catch (error) {
    console.error("Error in chat API route:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

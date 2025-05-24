export const runtime = "edge";

import { deepseek } from "@ai-sdk/deepseek";
import { streamText, tool, createDataStreamResponse } from "ai";
import { colorExpertSystemPrompt } from "@/lib/prompt";
import { z } from "zod";
import type { CoreMessage } from "ai";
import { colorToName } from "@/app/actions/color";

// Define a type for client actions
interface ClientAction<T = any> {
  type: "client-action";
  action: string;
  params: T;
}

export async function POST(req: Request) {
  try {
    const { messages: originalMessages } = await req.json();

    // Check API key
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY is not set");
    }

    // Process messages to ensure they alternate between user and assistant
    const messages = [...originalMessages];
    const processedMessages: CoreMessage[] = [];

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

    // Use createDataStreamResponse instead of StreamData
    return createDataStreamResponse({
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
      onError: (error) => {
        console.error("Data stream error:", error);
        return String(error);
      },
      execute: async (dataStream) => {
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
              // Send a client action through the data stream
              dataStream.writeData({
                type: "client-action",
                action: "addColorsToTheme",
                params,
              });

              // Return a status object instead of calling the handler
              return {
                success: true,
                message: `Added ${params.colors.length} colors to theme "${params.themeName}"`,
                themeUpdated: true,
              };
            },
          }),

          updateTheme: tool({
            description: "Update existing colors in the theme or add new ones",
            parameters: z.object({
              themeName: z
                .string()
                .describe("A descriptive name for this updated theme"),
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
                .describe("Array of colors to update or add to the theme"),
            }),
            execute: async (params) => {
              // Send a client action through the data stream
              dataStream.writeData({
                type: "client-action",
                action: "updateTheme",
                params,
              });

              // Return a status object instead of calling the handler
              return {
                success: true,
                message: `Updated theme "${params.themeName}" with ${params.colors.length} colors`,
                themeUpdated: true,
              };
            },
          }),

          resetTheme: tool({
            description: "Reset the theme by removing all colors",
            parameters: z.object({}),
            execute: async () => {
              // Send a client action through the data stream
              dataStream.writeData({
                type: "client-action",
                action: "resetTheme",
                params: {},
              });

              // Return a status object instead of calling the handler
              return {
                success: true,
                message: "Theme has been reset successfully",
                themeReset: true,
              };
            },
          }),

          removeColorsFromTheme: tool({
            description: "Remove specific colors from the theme by name",
            parameters: z.object({
              colorNames: z
                .array(z.string())
                .describe("Array of color names to remove from the theme"),
            }),
            execute: async (params) => {
              // Send a client action through the data stream
              dataStream.writeData({
                type: "client-action",
                action: "removeColorsFromTheme",
                params,
              });

              // Return a status object instead of calling the handler
              return {
                success: true,
                message: `Removed ${params.colorNames.length} colors from the theme`,
                colorsRemoved: params.colorNames,
              };
            },
          }),

          markColorAsFavorite: tool({
            description: "Mark a color as favorite by name",
            parameters: z.object({
              colorName: z
                .string()
                .describe("Name of the color to mark as favorite"),
            }),
            execute: async (params) => {
              // Send a client action through the data stream
              dataStream.writeData({
                type: "client-action",
                action: "markColorAsFavorite",
                params,
              });

              // Return a status object instead of calling the handler
              return {
                success: true,
                message: `Marked color "${params.colorName}" as favorite`,
                colorMarked: params.colorName,
              };
            },
          }),

          // New tool to get color names from the server-side function
          getColorName: tool({
            description:
              "Get the standardized name for a color code from our database",
            parameters: z.object({
              colorCode: z
                .string()
                .describe("Color code in any valid format (hex, rgb, hsl)"),
            }),
            execute: async (params) => {
              try {
                // Call the server-side colorToName function
                const colorName = await colorToName(params.colorCode);
                return {
                  success: true,
                  colorName: colorName || "Unknown color",
                  colorCode: params.colorCode,
                };
              } catch (error) {
                console.error("Error getting color name:", error);
                return {
                  success: false,
                  error: String(error),
                  colorCode: params.colorCode,
                  colorName: "Unknown color",
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
            maxSteps: 5, // Allow up to 5 steps for multi-step tool calling
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
          });

          // Merge the streamText result into our data stream
          result.mergeIntoDataStream(dataStream, {
            sendUsage: true,
            sendReasoning: false,
            sendSources: false,
            experimental_sendFinish: true,
            experimental_sendStart: true,
          });
        } catch (error) {
          console.error("Error in execute function:", error);
          dataStream.writeData({
            type: "error",
            error: String(error),
          });
        }
      },
    });
  } catch (error) {
    console.error("Error in chat API route:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

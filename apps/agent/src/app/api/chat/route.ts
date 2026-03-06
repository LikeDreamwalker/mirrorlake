export const runtime = "edge";

import { deepseek } from "@ai-sdk/deepseek";
import {
  streamText,
  tool,
  createUIMessageStream,
  createUIMessageStreamResponse,
  stepCountIs,
  type ModelMessage,
} from "ai";
import { buildColorExpertSystemPrompt } from "@/lib/prompt";
import { z } from "zod";
import { colorToName } from "@/app/actions/color";

export async function POST(req: Request) {
  try {
    const { messages: originalMessages, colorContext } = await req.json();

    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY is not set");
    }

    const messages = [...originalMessages];
    const processedMessages: ModelMessage[] = [];

    if (messages.length === 0 || messages[0].role !== "user") {
      processedMessages.push({
        role: "user",
        content: "Hi, I need help with colors.",
      });
    } else {
      processedMessages.push(messages[0]);
    }

    for (let i = 1; i < messages.length; i++) {
      const prevRole = processedMessages[processedMessages.length - 1].role;
      const currentRole = messages[i].role;
      if (currentRole !== prevRole) {
        processedMessages.push(messages[i]);
      }
    }

    const stream = createUIMessageStream({
      execute: ({ writer }) => {
        const tools = {
          addColorsToTheme: tool({
            description: "Add a group of related colors to the user's current theme",
            inputSchema: z.object({
              themeName: z.string().describe("A descriptive name for this color theme"),
              colors: z
                .array(
                  z.object({
                    color: z.string().describe("Color code in hex format (e.g., #3498DB)"),
                    name: z.string().describe("Descriptive name for this specific color"),
                  })
                )
                .describe("Array of colors that belong to this theme"),
            }),
            execute: async (params) => {
              writer.write({
                type: "data-client-action" as const,
                data: { action: "addColorsToTheme", params },
              });
              return {
                success: true,
                message: `Added ${params.colors.length} colors to theme "${params.themeName}"`,
              };
            },
          }),

          updateTheme: tool({
            description: "Update existing colors in the theme or add new ones",
            inputSchema: z.object({
              themeName: z.string().describe("A descriptive name for this updated theme"),
              colors: z
                .array(
                  z.object({
                    color: z.string().describe("Color code in hex format"),
                    name: z.string().describe("Descriptive name for this color"),
                  })
                )
                .describe("Array of colors to update or add to the theme"),
            }),
            execute: async (params) => {
              writer.write({
                type: "data-client-action" as const,
                data: { action: "updateTheme", params },
              });
              return {
                success: true,
                message: `Updated theme "${params.themeName}" with ${params.colors.length} colors`,
              };
            },
          }),

          resetTheme: tool({
            description: "Reset the theme by removing all colors",
            inputSchema: z.object({}),
            execute: async () => {
              writer.write({
                type: "data-client-action" as const,
                data: { action: "resetTheme", params: {} },
              });
              return { success: true, message: "Theme has been reset successfully" };
            },
          }),

          removeColorsFromTheme: tool({
            description: "Remove specific colors from the theme by name",
            inputSchema: z.object({
              colorNames: z
                .array(z.string())
                .describe("Array of color names to remove from the theme"),
            }),
            execute: async (params) => {
              writer.write({
                type: "data-client-action" as const,
                data: { action: "removeColorsFromTheme", params },
              });
              return {
                success: true,
                message: `Removed ${params.colorNames.length} colors from the theme`,
              };
            },
          }),

          markColorAsFavorite: tool({
            description: "Mark a color as favorite by name",
            inputSchema: z.object({
              colorName: z.string().describe("Name of the color to mark as favorite"),
            }),
            execute: async (params) => {
              writer.write({
                type: "data-client-action" as const,
                data: { action: "markColorAsFavorite", params },
              });
              return {
                success: true,
                message: `Marked color "${params.colorName}" as favorite`,
              };
            },
          }),

          getColorName: tool({
            description: "Get the standardized name for a color code from our database",
            inputSchema: z.object({
              colorCode: z.string().describe("Color code in any valid format (hex, rgb, hsl)"),
            }),
            execute: async (params) => {
              try {
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
            system: buildColorExpertSystemPrompt(colorContext),
            temperature: 0.7,
            tools,
            stopWhen: stepCountIs(5),
            onStepFinish: ({ toolCalls, finishReason }) => {
              console.log(`Step finished with reason: ${finishReason}`);
              if (toolCalls.length > 0) {
                console.log(
                  `Tool calls in this step: ${toolCalls.map((tc) => tc.toolName).join(", ")}`
                );
              }
            },
          });

          writer.merge(result.toUIMessageStream());
        } catch (error) {
          console.error("Error in execute function:", error);
          writer.write({
            type: "error" as const,
            errorText: String(error),
          });
        }
      },
    });

    return createUIMessageStreamResponse({
      stream,
      status: 200,
      headers: {
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
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

import { deepseek } from "@ai-sdk/deepseek";
import { streamText, tool, StreamData } from "ai";
import { colorExpertSystemPrompt } from "@/lib/prompt";
import { z } from "zod";
import * as colorTools from "@/lib/color-tools";

// Define a type for client actions
interface ClientAction {
  type: "client-action";
  action: string;
  params: any;
}

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

          // Return the result from the handler
          return colorTools.handleAddColorsToTheme(params);
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
          console.log(
            "Tool call: updateTheme",
            JSON.stringify(params, null, 2)
          );

          // Send a client action through the data stream
          data.append({
            type: "client-action",
            action: "updateTheme",
            params,
          });

          // Return the result from the handler
          return colorTools.handleUpdateTheme(params);
        },
      }),

      resetTheme: tool({
        description: "Reset the theme by removing all colors",
        parameters: z.object({}),
        execute: async () => {
          console.log("Tool call: resetTheme");

          // Send a client action through the data stream
          data.append({
            type: "client-action",
            action: "resetTheme",
            params: {},
          });

          // Return the result from the handler
          return colorTools.handleResetTheme();
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
          console.log(
            "Tool call: removeColorsFromTheme",
            JSON.stringify(params, null, 2)
          );

          // Send a client action through the data stream
          data.append({
            type: "client-action",
            action: "removeColorsFromTheme",
            params,
          });

          // Return the result from the handler
          return colorTools.handleRemoveColorsFromTheme(params);
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
          console.log(
            "Tool call: markColorAsFavorite",
            JSON.stringify(params, null, 2)
          );

          // Send a client action through the data stream
          data.append({
            type: "client-action",
            action: "markColorAsFavorite",
            params,
          });

          // Return the result from the handler
          return colorTools.handleMarkColorAsFavorite(params);
        },
      }),

      getCurrentColors: tool({
        description: "Get the user's current colors",
        parameters: z.object({}),
        execute: async () => {
          console.log("Tool call: getCurrentColors");

          // Use the imported function from color-tools
          return colorTools.handleGetCurrentColors();
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

          // Use the imported function from color-tools
          return colorTools.handleGetColorInfo(params);
        },
      }),

      generateColorPalette: tool({
        description: "Generate a color palette based on a base color",
        parameters: z.object({
          baseColor: z
            .string()
            .describe("Base color in hex format (e.g., #FF5733)"),
          paletteType: z
            .enum([
              "analogous",
              "complementary",
              "triadic",
              "tetradic",
              "monochromatic",
            ])
            .describe("Type of color palette to generate"),
          count: z
            .number()
            .optional()
            .describe("Number of colors to generate (default: 5)"),
        }),
        execute: async (params) => {
          console.log(
            "Tool call: generateColorPalette",
            JSON.stringify(params, null, 2)
          );

          // Send a client action through the data stream
          data.append({
            type: "client-action",
            action: "generateColorPalette",
            params,
          });

          // Return the result from the handler
          return colorTools.handleGenerateColorPalette(params);
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

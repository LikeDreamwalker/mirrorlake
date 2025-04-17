// app/api/chat/route.ts
import { deepseek } from "@ai-sdk/deepseek";
import { streamText } from "ai";
import { colorExpertSystemPrompt } from "@/lib/prompt";

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
    let messages = [...originalMessages];
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

    // Add more detailed error handling
    try {
      const result = streamText({
        model: deepseek("deepseek-reasoner"),
        messages: processedMessages,
        system: colorExpertSystemPrompt, // Use the color expert system prompt
        temperature: 0.7,
      });

      console.log("Stream created successfully");

      return result.toDataStreamResponse({
        // Forward the actual error message instead of masking it
        getErrorMessage: (error) => {
          console.error("DeepSeek error:", error);
          return String(error);
        },
      });
    } catch (deepseekError) {
      console.error("DeepSeek API error:", deepseekError);
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

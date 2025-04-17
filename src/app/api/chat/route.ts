import { type NextRequest, NextResponse } from "next/server";

// Define proper types for the messages
interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  id?: string;
}

// This is a placeholder API route that will be replaced with DeepSeek integration later
export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: Message[] } = await req.json();

    // Get the last user message
    const lastUserMessage = messages.filter((msg) => msg.role === "user").pop();

    // Simple response for now
    const response: Message = {
      role: "assistant",
      content: `I'll need to connect to an AI model to properly answer: "${lastUserMessage?.content}". For now, I can only provide automated color analysis when you select colors.`,
    };

    // Simulate a delay to make it feel more natural
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({ messages: [response] });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}

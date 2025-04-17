// app/api/chat/route.ts
import { deepseek } from "@ai-sdk/deepseek";
import { streamText } from "ai";
import { colorExpertSystemPrompt } from "@/lib/prompt";

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Use streamText instead of directly calling deepseek.chat
  const result = streamText({
    model: deepseek("deepseek-reasoner"),
    messages,
    system: colorExpertSystemPrompt,
    temperature: 0.7,
  });

  // Use toDataStreamResponse with sendReasoning: true
  return result.toDataStreamResponse({
    sendReasoning: true,
  });
}

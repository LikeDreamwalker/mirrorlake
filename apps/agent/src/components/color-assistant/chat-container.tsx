"use client";

import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";
import { PromptChips } from "./prompt-chips";
import { useChatContext } from "./context";

export function ChatContainer() {
  const { messages } = useChatContext();
  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Chat messages area or empty state */}
      <div className="flex-1 overflow-hidden">
        {isEmpty ? <PromptChips /> : <ChatMessages />}
      </div>

      {/* Input area with fixed height */}
      <div className="border-t w-full" style={{ height: "70px" }}>
        <ChatInput />
      </div>
    </div>
  );
}

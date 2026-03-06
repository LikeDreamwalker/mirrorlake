"use client";

import { useRef, useEffect } from "react";
import { useChatContext, getMessageContent } from "./context";
import { cn } from "@/lib/utils";
import { ColorHighlightMarkdown } from "./color-highlight-markdown";

function TypingIndicator() {
  return (
    <div className="flex justify-start w-full">
      <div className="bg-background text-foreground border border-border rounded-xl p-3">
        <div className="flex gap-1 items-center h-5">
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

export function ChatMessages() {
  const { messages, status } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isWaiting = status === "submitted";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="space-y-4 w-full p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn("flex w-full", message.role === "user" ? "justify-end" : "justify-start")}
          >
            <div
              className={cn(
                "max-w-[95%] rounded-xl p-3",
                message.role === "user"
                  ? "bg-primary text-primary-foreground border border-border"
                  : "bg-background text-foreground border border-border"
              )}
            >
              <ColorHighlightMarkdown
                reverseTheme={message.role === "user"}
                content={getMessageContent(message)}
              />
            </div>
          </div>
        ))}
        {isWaiting && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

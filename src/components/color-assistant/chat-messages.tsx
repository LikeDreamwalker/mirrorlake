// components/chat/chat-messages.tsx
"use client";

import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatContext } from "./chat-context";
import { ColorHighlightMarkdown } from "./color-highlight-markdown";

export function ChatMessages() {
  const { messages } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <ScrollArea className="h-full p-4">
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted border border-dashed border-border"
              }`}
            >
              {message.role === "user" ? (
                <p>{message.content}</p>
              ) : (
                <ColorHighlightMarkdown
                  content={message.content}
                  reasoning={message.reasoning} // Pass reasoning to component
                />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </ScrollArea>
  );
}

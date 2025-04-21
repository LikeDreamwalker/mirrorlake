"use client";

import { useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatContext } from "./context";
import { QueuedMarkdown } from "./queued-markdown";
import { cn } from "@/lib/utils";
import { ColorHighlightMarkdown } from "./color-highlight-markdown";

export function ChatMessages() {
  const { messages, messageCompletionStatus } = useChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="space-y-4 w-full">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex w-full",
              message.role === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-[95%] rounded-xl p-3",
                message.role === "user"
                  ? "bg-primary text-primary-foreground border border-border"
                  : "bg-background text-foreground border border-border"
              )}
              // className={`max-w-[95%] rounded-lg p-3 ${
              //   message.role === "user"
              //     ? "bg-primary text-primary-foreground"
              //     : "bg-muted border border-dashed border-border"
              // }`}
            >
              {message.role === "user" ? (
                <p>{message.content}</p>
              ) : (
                // <QueuedMarkdown
                //   content={message.content}
                //   id={message.id}
                //   isComplete={messageCompletionStatus[message.id] === true}
                // />
                <ColorHighlightMarkdown content={message.content} />
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}

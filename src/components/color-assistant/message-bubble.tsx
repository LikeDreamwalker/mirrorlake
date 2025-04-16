"use client";

import type { Message } from "@ai-sdk/react";
import { QueuedMarkdown } from "./queued-markdown";
import { useEffect } from "react";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  // Helper to get message content
  const getMessageContent = (message: Message): string => {
    if ("parts" in message && message.parts && message.parts.length > 0) {
      const textParts = message.parts.filter((part) => part.type === "text");
      if (textParts.length > 0) {
        return textParts.map((part) => (part as any).text).join("");
      }
    }
    return message.content;
  };

  // Get the content once to avoid re-renders
  const content = getMessageContent(message);

  // Debug log
  useEffect(() => {
    if (message.role === "assistant") {
      console.log("Message content:", content);
    }
  }, [message, content]);

  return (
    <div
      className={`flex ${
        message.role === "user" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[80%] rounded-lg px-3 py-2 border border-dashed ${
          message.role === "user"
            ? "bg-primary text-primary-foreground border-primary-foreground/30"
            : "bg-muted border-border"
        }`}
      >
        {message.role === "user" ? (
          <div>{message.content}</div>
        ) : (
          <QueuedMarkdown
            content={content}
            id={message.id}
            isComplete={true}
            releaseInterval={5}
          />
        )}
      </div>
    </div>
  );
}

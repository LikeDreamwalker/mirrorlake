"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send } from "lucide-react";
import { useChatContext } from "./context";

export function ChatInput() {
  const {
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    isProcessingColor,
  } = useChatContext();

  return (
    <form onSubmit={handleSubmit} className="h-full flex gap-2 p-4">
      <Input
        value={input}
        onChange={handleInputChange}
        placeholder="Ask about colors or design..."
        className="flex-1"
        disabled={isLoading || isProcessingColor}
      />
      <Button
        type="submit"
        size="icon"
        aria-label="Send message"
        disabled={isLoading || isProcessingColor || !input.trim()}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
}

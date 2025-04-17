"use client";

import type React from "react";
import { createContext, useContext, useRef, useState, useEffect } from "react";
import { useChat, type Message } from "@ai-sdk/react";
import { useStore } from "@/store";
import { getColorAdvice } from "@/app/actions";

// Context type definition
interface ChatContextType {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  isProcessingColor: boolean;
}

// Create the context
const ChatContext = createContext<ChatContextType>({
  messages: [],
  input: "",
  handleInputChange: () => {},
  handleSubmit: () => {},
  isLoading: false,
  isProcessingColor: false,
});

// Hook to use the chat context
export const useChatContext = () => useContext(ChatContext);

// Provider component
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { baseColor, setBaseColor } = useStore();
  const [isProcessingColor, setIsProcessingColor] = useState(false);
  const lastProcessedColor = useRef<string | null>(null);
  const hasInitialized = useRef(false);

  // Initialize chat with AI SDK
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setMessages,
  } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hi! I'm your color assistant. I'll recommend a color for you to start with.",
      },
    ],
  });

  // Extract color codes from messages
  const extractColorCode = (content: string) => {
    const colorRegex = /`(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})`/g;
    const matches = [...(content?.matchAll(colorRegex) || [])];
    return matches.length > 0 ? matches[0][1] : null;
  };

  // Handle the initial DeepSeek response with random color
  useEffect(() => {
    if (messages.length === 2 && !hasInitialized.current) {
      // This is the first response from DeepSeek (after welcome)
      const assistantMessage = messages[1];
      if (assistantMessage.role === "assistant") {
        // Extract color code from the message
        const colorCode = extractColorCode(assistantMessage.content);
        if (colorCode) {
          // Set this as the base color
          setBaseColor(colorCode);
          hasInitialized.current = true;
        } else {
          // Fallback to default color if no color found
          setBaseColor("#0066ff");
          hasInitialized.current = true;
        }
      }
    }
  }, [messages, setBaseColor]);

  // Process color changes
  useEffect(() => {
    const processColorChange = async () => {
      if (
        baseColor !== lastProcessedColor.current &&
        !isProcessingColor &&
        baseColor
      ) {
        setIsProcessingColor(true);
        lastProcessedColor.current = baseColor;

        try {
          // Add user message about selecting the color
          const userMessage = `I just selected the color ${baseColor}.`;
          const userMessageId = Date.now().toString();

          // Create new messages array with user message
          const newMessages: Message[] = [
            ...messages,
            {
              id: userMessageId,
              role: "user" as const,
              content: userMessage,
            },
          ];

          setMessages(newMessages);

          // Get color advice from your Python part
          const response = await getColorAdvice(baseColor);

          if (response.error) {
            throw new Error(response.message);
          }

          // Add assistant response from Python part
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant" as const,
            content: response.advice,
          };

          // Set the messages with the new assistant response
          setMessages([...newMessages, assistantMessage]);
        } catch (error) {
          console.error("Error processing color:", error);

          // Add error message
          setMessages([
            ...messages,
            {
              id: Date.now().toString(),
              role: "user" as const,
              content: `I just selected the color ${baseColor}.`,
            } as Message,
            {
              id: (Date.now() + 1).toString(),
              role: "assistant" as const,
              content:
                "I'm sorry, I couldn't analyze that color right now. Please try again or ask me something else.",
            } as Message,
          ]);
        } finally {
          setIsProcessingColor(false);
        }
      }
    };

    processColorChange();
  }, [baseColor, messages, setMessages, isProcessingColor]);

  // Provide the chat context to children
  return (
    <ChatContext.Provider
      value={{
        messages,
        input,
        handleInputChange,
        handleSubmit,
        isLoading,
        isProcessingColor,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

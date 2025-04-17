"use client";

import type React from "react";

import { createContext, useContext, useRef, useState, useEffect } from "react";
import { useChat, type Message } from "@ai-sdk/react";
import { useStore } from "@/store";
import { getColorAdvice } from "@/app/actions";

// Define the context type
interface ChatContextType {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  isProcessingColor: boolean;
}

// Create the context with a default value
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
  const { baseColor } = useStore();
  const [isProcessingColor, setIsProcessingColor] = useState(false);
  const lastProcessedColor = useRef<string | null>(null);

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
          "Hi! I'm your color assistant. Select a color or ask me anything about colors and design.",
      },
    ],
  });

  // Process color changes
  useEffect(() => {
    const processColorChange = async () => {
      // Only process if the color has changed and isn't being processed
      if (
        baseColor !== lastProcessedColor.current &&
        !isProcessingColor &&
        baseColor // Make sure we have a color
      ) {
        console.log(`Processing color change: ${baseColor}`);
        setIsProcessingColor(true);
        lastProcessedColor.current = baseColor;

        try {
          // Add user message about selecting the color
          const userMessage = `I just selected the color ${baseColor}.`;

          // Create a new message ID
          const userMessageId = Date.now().toString();

          // In AI SDK 4.x, we need to create a new messages array
          const newMessages: Message[] = [
            ...messages,
            {
              id: userMessageId,
              role: "user" as const,
              content: userMessage,
            },
          ];

          setMessages(newMessages);

          // Get color advice from mock server action
          const response = await getColorAdvice(baseColor);

          if (response.error) {
            throw new Error(response.message);
          }

          // Log the advice for debugging
          console.log("Color advice received:", response.advice);

          // Add assistant response from mock API
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

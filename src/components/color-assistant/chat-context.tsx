"use client";

import type React from "react";
import {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useMemo,
} from "react";
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
  status: "submitted" | "streaming" | "ready" | "error"; // Add status
  isProcessingColor: boolean;
  messageCompletionStatus: Record<string, boolean>; // Add this for QueuedMarkdown
}

// Create the context
const ChatContext = createContext<ChatContextType>({
  messages: [],
  input: "",
  handleInputChange: () => {},
  handleSubmit: () => {},
  isLoading: false,
  status: "ready",
  isProcessingColor: false,
  messageCompletionStatus: {},
});

// Hook to use the chat context
export const useChatContext = () => useContext(ChatContext);

// Provider component
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { baseColor, setBaseColor } = useStore();
  const [isProcessingColor, setIsProcessingColor] = useState(false);
  const lastProcessedColor = useRef<string | null>(null);
  const hasInitialized = useRef(false);
  const isFirstLoad = useRef(true);

  // Track which messages are complete (for both SSE and non-SSE messages)
  const [completedMessages, setCompletedMessages] = useState<
    Record<string, boolean>
  >({});

  // Initialize chat with AI SDK - start with empty messages
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    status, // Get status from useChat
    setMessages,
  } = useChat({
    api: "/api/chat",
    initialMessages: [],
    onFinish: (message) => {
      console.log("Chat finished with message:", message);
      // Mark the message as complete when it finishes
      setCompletedMessages((prev) => ({
        ...prev,
        [message.id]: true,
      }));
    },
    onError: (error) => {
      console.error("Chat error:", error);
    },
  });

  // Create a map of message completion status that combines:
  // 1. SSE messages (tracked by status)
  // 2. Non-SSE messages (tracked by completedMessages)
  const messageCompletionStatus = useMemo(() => {
    const statusMap: Record<string, boolean> = {};

    messages.forEach((message) => {
      // For user messages, they're always complete
      if (message.role === "user") {
        statusMap[message.id] = true;
      }
      // For assistant messages from Python (with special ID format), use our completedMessages state
      else if (
        message.role === "assistant" &&
        message.id.toString().startsWith("python-")
      ) {
        statusMap[message.id] = true; // Python messages are always complete when added
      }
      // For assistant messages from AI SDK, check if they're still streaming
      else if (message.role === "assistant") {
        // If status is 'streaming' and this is the last message, it's incomplete
        const isLastMessage = message.id === messages[messages.length - 1]?.id;
        statusMap[message.id] = !(isLastMessage && status === "streaming");
      }
    });

    return statusMap;
  }, [messages, status, completedMessages]);

  // Extract color codes from messages
  const extractColorCode = (content: string) => {
    const colorRegex = /`(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3})`/g;
    const matches = [...(content?.matchAll(colorRegex) || [])];
    return matches.length > 0 ? matches[0][1] : null;
  };

  // Initialize with default color and first user message
  useEffect(() => {
    if (isFirstLoad.current && !hasInitialized.current) {
      // Set default color
      const defaultColor = "#0066ff";
      setBaseColor(defaultColor);

      // Create initial user message about selecting the color
      setMessages([
        {
          id: "initial-color-selection",
          role: "user",
          content: `I just selected the color ${defaultColor}.`,
        },
      ]);

      isFirstLoad.current = false;
      hasInitialized.current = true;
    }
  }, [setBaseColor, setMessages]);

  // Process color changes
  useEffect(() => {
    const processColorChange = async () => {
      // Skip if this is the first load or if we're already processing
      if (isFirstLoad.current || isProcessingColor) {
        return;
      }

      if (baseColor !== lastProcessedColor.current && baseColor) {
        setIsProcessingColor(true);
        lastProcessedColor.current = baseColor;

        try {
          // Skip if this is the initial color and we already have messages
          if (
            baseColor === "#0066ff" &&
            messages.length > 0 &&
            messages[0]?.content?.includes("#0066ff")
          ) {
            setIsProcessingColor(false);
            return;
          }

          // Check if the last message is from the user
          const lastMessage = messages[messages.length - 1];
          if (lastMessage && lastMessage.role === "user") {
            console.log(
              "Waiting for assistant response before adding new user message"
            );
            setIsProcessingColor(false);
            return;
          }

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

          // Add assistant response from Python part with a special ID format
          const pythonMessageId = `python-${Date.now() + 1}`;
          const assistantMessage: Message = {
            id: pythonMessageId,
            role: "assistant" as const,
            content: response.advice,
          };

          // Set the messages with the new assistant response
          setMessages([...newMessages, assistantMessage]);

          // Mark the Python message as complete
          setCompletedMessages((prev) => ({
            ...prev,
            [pythonMessageId]: true,
          }));
        } catch (error) {
          console.error("Error processing color:", error);

          // Add error message
          const errorMessageId = `python-error-${Date.now() + 1}`;
          setMessages([
            ...messages,
            {
              id: Date.now().toString(),
              role: "user" as const,
              content: `I just selected the color ${baseColor}.`,
            } as Message,
            {
              id: errorMessageId,
              role: "assistant" as const,
              content:
                "I'm sorry, I couldn't analyze that color right now. Please try again or ask me something else.",
            } as Message,
          ]);

          // Mark the error message as complete
          setCompletedMessages((prev) => ({
            ...prev,
            [errorMessageId]: true,
          }));
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
        status, // Add status
        isProcessingColor,
        messageCompletionStatus, // Add this for QueuedMarkdown
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

"use client";

import type React from "react";
import { createContext, useContext, useRef, useState, useEffect, useMemo, useCallback } from "react";
import { useChat, type UIMessage } from "@ai-sdk/react";

import { useColorStore } from "@/provider";
import { getColorAdvice } from "@/app/actions/color-advice";
import { toast } from "sonner";

// Define a type for client actions
interface ClientAction {
  action: string;
  params: Record<string, unknown>;
}

// Type guard to check if an object is a client action
function isClientAction(obj: unknown): obj is ClientAction {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "action" in obj &&
    typeof (obj as Record<string, unknown>).action === "string" &&
    "params" in obj
  );
}

// Helper to extract text content from a UIMessage
export function getMessageContent(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join("");
}

// Context type definition
interface ChatContextType {
  messages: UIMessage[];
  input: string;
  setInput: (value: string) => void;
  sendMessage: (content: string) => void;
  status: "submitted" | "streaming" | "ready" | "error";
  isProcessingColor: boolean;
  messageCompletionStatus: Record<string, boolean>;
}

// Create the context
const ChatContext = createContext<ChatContextType>({
  messages: [],
  input: "",
  setInput: () => {},
  sendMessage: () => {},
  status: "ready",
  isProcessingColor: false,
  messageCompletionStatus: {},
});

// Hook to use the chat context
export const useChatContext = () => useContext(ChatContext);

// Provider component
export function ChatProvider({ children }: { children: React.ReactNode }) {
  const {
    addColorsToTheme,
    updateTheme,
    resetTheme,
    removeColorsFromTheme,
    markColorAsFavorite,
    setColorFromHex,
    setColorFromRgb,
    setColorFromHsl,
    generateRandomColor,
    getColorById,
    setCurrentColorFromItem,
    currentColor,
  } = useColorStore((state) => ({
    addColorsToTheme: state.addColorsToTheme,
    updateTheme: state.updateTheme,
    resetTheme: state.resetTheme,
    removeColorsFromTheme: state.removeColorsFromTheme,
    markColorAsFavorite: state.markColorAsFavorite,
    setColorFromHex: state.setColorFromHex,
    setColorFromRgb: state.setColorFromRgb,
    setColorFromHsl: state.setColorFromHsl,
    generateRandomColor: state.generateRandomColor,
    getColorById: state.getColorById,
    setCurrentColorFromItem: state.setCurrentColorFromItem,
    currentColor: state.currentColor,
  }));

  const [isProcessingColor, setIsProcessingColor] = useState(false);
  const [input, setInput] = useState("");
  const lastProcessedColor = useRef<string | null>(null);
  const hasInitialized = useRef(false);
  const isFirstLoad = useRef(true);

  // Track which client actions have been processed to prevent duplicates
  const processedActions = useRef<Set<string>>(new Set());
  const lastUserMessageCount = useRef<number>(0);

  // Initialize chat with AI SDK v6
  const {
    messages,
    status,
    setMessages,
    sendMessage: chatSendMessage,
  } = useChat({
    onFinish: ({ message }) => {
      console.log("Chat finished with message:", message.id);
    },
    onError: (error) => {
      console.error("Chat error:", error);
      toast.error("Error in chat: " + error.message);
    },
  });

  // Process client actions from data parts in messages
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant") {
      return;
    }

    for (const part of lastMessage.parts) {
      if (part.type !== "data-client-action") {
        continue;
      }

      const item = (part as { type: string; data: unknown }).data;
      if (!isClientAction(item)) {
        continue;
      }

      {
        const { action, params } = item;
        const actionId = `${action}-${JSON.stringify(params)}`;

        if (processedActions.current.has(actionId)) {
          continue;
        }

        try {
          switch (action) {
            case "addColorsToTheme":
              addColorsToTheme(params as Parameters<typeof addColorsToTheme>[0]);
              break;
            case "updateTheme":
              updateTheme(params as Parameters<typeof updateTheme>[0]);
              break;
            case "resetTheme":
              resetTheme();
              break;
            case "removeColorsFromTheme":
              removeColorsFromTheme(params as Parameters<typeof removeColorsFromTheme>[0]);
              break;
            case "markColorAsFavorite":
              markColorAsFavorite(params as Parameters<typeof markColorAsFavorite>[0]);
              break;
            case "setColorFromHex":
              setColorFromHex((params as { hex: string }).hex);
              break;
            case "setColorFromRgb": {
              const { r, g, b } = params as { r: number; g: number; b: number };
              setColorFromRgb(r, g, b);
              break;
            }
            case "setColorFromHsl": {
              const { h, s, l } = params as { h: number; s: number; l: number };
              setColorFromHsl(h, s, l);
              break;
            }
            case "generateRandomColor":
              generateRandomColor();
              break;
            case "setCurrentColorFromItem": {
              const colorItem = getColorById((params as { colorId: string }).colorId);
              if (colorItem) {
                setCurrentColorFromItem(colorItem);
              }
              break;
            }
            default:
              console.warn(`Unknown client action: ${action}`);
              continue;
          }

          processedActions.current.add(actionId);
        } catch (error) {
          console.error("Error executing client action:", error);
          toast.error(
            "Error executing action: " +
              (error instanceof Error ? error.message : String(error))
          );
        }
      }
    }
  }, [
    messages,
    addColorsToTheme,
    updateTheme,
    resetTheme,
    removeColorsFromTheme,
    markColorAsFavorite,
    setColorFromHex,
    setColorFromRgb,
    setColorFromHsl,
    generateRandomColor,
    getColorById,
    setCurrentColorFromItem,
  ]);

  // Reset processed actions when a new user message is added
  useEffect(() => {
    const userMessageCount = messages.filter((m) => m.role === "user").length;
    if (
      userMessageCount > 0 &&
      userMessageCount !== lastUserMessageCount.current
    ) {
      processedActions.current = new Set();
      lastUserMessageCount.current = userMessageCount;
    }
  }, [messages]);

  // Create a map of message completion status
  const messageCompletionStatus = useMemo(() => {
    const statusMap: Record<string, boolean> = {};

    messages.forEach((message) => {
      if (message.role === "user") {
        statusMap[message.id] = true;
      } else if (
        message.role === "assistant" &&
        message.id.toString().startsWith("python-")
      ) {
        statusMap[message.id] = true;
      } else if (message.role === "assistant") {
        const isLastMessage = message.id === messages[messages.length - 1]?.id;
        statusMap[message.id] = !(isLastMessage && status === "streaming");
      }
    });

    return statusMap;
  }, [messages, status]);

  // Send message handler
  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim()) {
        return;
      }
      processedActions.current = new Set();
      chatSendMessage({ role: "user", parts: [{ type: "text", text: content }] });
      setInput("");
    },
    [chatSendMessage]
  );

  // Initialize with default color and first user message
  useEffect(() => {
    if (isFirstLoad.current && !hasInitialized.current) {
      setMessages([
        {
          id: "initial-color-selection",
          role: "user",
          parts: [
            {
              type: "text",
              text: `I just selected the color \`<ColorPreview>${currentColor}</ColorPreview>\`.`,
            },
          ],
        },
      ]);
      isFirstLoad.current = false;
      hasInitialized.current = true;
    }
  }, [setMessages, currentColor]);

  // Process color changes
  useEffect(() => {
    const processColorChange = async () => {
      if (isFirstLoad.current || isProcessingColor) {
        return;
      }

      if (currentColor !== lastProcessedColor.current && currentColor) {
        setIsProcessingColor(true);
        lastProcessedColor.current = currentColor;

        try {
          if (
            currentColor === "#0066FF" &&
            messages.length > 0 &&
            getMessageContent(messages[0])?.includes("#0066ff")
          ) {
            setIsProcessingColor(false);
            return;
          }

          const lastMessage = messages[messages.length - 1];
          if (lastMessage && lastMessage.role === "user") {
            setIsProcessingColor(false);
            return;
          }

          const userContent = `I just selected the color \`<ColorPreview>${currentColor}</ColorPreview>\`.`;
          const userMessageId = Date.now().toString();

          const newMessages: UIMessage[] = [
            ...messages,
            {
              id: userMessageId,
              role: "user" as const,
              parts: [{ type: "text", text: userContent }],
            },
          ];

          setMessages(newMessages);

          const response = await getColorAdvice(currentColor);

          if (response.error) {
            throw new Error(response.message);
          }

          const pythonMessageId = `python-${Date.now() + 1}`;
          const assistantMessage: UIMessage = {
            id: pythonMessageId,
            role: "assistant" as const,
            parts: [{ type: "text", text: response.advice }],
          };

          setMessages([...newMessages, assistantMessage]);
        } catch (error) {
          console.error("Error processing color:", error);

          const errorMessageId = `python-error-${Date.now() + 1}`;
          setMessages([
            ...messages,
            {
              id: Date.now().toString(),
              role: "user" as const,
              parts: [
                {
                  type: "text",
                  text: `I just selected the color \`<ColorPreview>${currentColor}</ColorPreview>\`.`,
                },
              ],
            },
            {
              id: errorMessageId,
              role: "assistant" as const,
              parts: [
                {
                  type: "text",
                  text: "I'm sorry, I couldn't analyze that color right now. Please try again or ask me something else.",
                },
              ],
            },
          ]);
          toast.error(
            "I'm sorry, I couldn't analyze that color right now. Please try again or ask me something else."
          );
        } finally {
          setIsProcessingColor(false);
        }
      }
    };

    processColorChange();
  }, [currentColor, messages, setMessages, isProcessingColor]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        input,
        setInput,
        sendMessage,
        status,
        isProcessingColor,
        messageCompletionStatus,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

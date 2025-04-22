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
import { getColorAdvice } from "@/app/actions/color-advice";
import { toast } from "sonner";

// Define a type for client actions
interface ClientAction {
  type: "client-action";
  action: string;
  params: any;
}

// Type guard to check if an object is a client action
function isClientAction(obj: any): obj is ClientAction {
  return (
    obj &&
    typeof obj === "object" &&
    obj.type === "client-action" &&
    typeof obj.action === "string" &&
    obj.params !== undefined
  );
}

// Context type definition
interface ChatContextType {
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  status: "submitted" | "streaming" | "ready" | "error";
  isProcessingColor: boolean;
  messageCompletionStatus: Record<string, boolean>;
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
  // Extract all necessary store methods
  const {
    // Color picker state
    currentColorInfo,
    currentColor,
    format,
    isDark,

    // Color picker actions
    setBaseColor,
    getFullColor,
    generateRandomColor,
    setColorFromHex,
    setColorFromRgb,
    setColorFromHsl,
    updateColorValues,
    getColorName,

    // Theme actions
    colors,
    addColor,
    removeColor,
    updateColor,
    toggleFavorite,
    getColorById,
    setCurrentColorFromItem,

    // Theme management actions
    addColorsToTheme,
    updateTheme,
    resetTheme,
    removeColorsFromTheme,
    markColorAsFavorite,
    generateColorPalette,
  } = useStore();

  const [isProcessingColor, setIsProcessingColor] = useState(false);
  const lastProcessedColor = useRef<string | null>(null);
  const hasInitialized = useRef(false);
  const isFirstLoad = useRef(true);

  // Track which client actions have been processed to prevent duplicates
  const processedActions = useRef<Set<string>>(new Set());

  // Track which messages are complete
  const [completedMessages, setCompletedMessages] = useState<
    Record<string, boolean>
  >({});

  // Initialize chat with AI SDK
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    status,
    setMessages,
    data, // This contains the custom data sent from the server
  } = useChat({
    api: "/api/chat",
    initialMessages: [],
    onFinish: (message) => {
      console.log("Chat finished with message:", message);
      setCompletedMessages((prev) => ({
        ...prev,
        [message.id]: true,
      }));
    },
    onError: (error) => {
      console.error("Chat error:", error);
      toast.error("Error in chat: " + error.message);
    },
  });

  // Reset processed actions when a new user message is added
  useEffect(() => {
    const userMessageCount = messages.filter((m) => m.role === "user").length;
    if (
      userMessageCount > 0 &&
      userMessageCount !== lastUserMessageCount.current
    ) {
      console.log("New user message detected, resetting processed actions");
      processedActions.current = new Set();
      lastUserMessageCount.current = userMessageCount;
    }
  }, [messages]);

  // Keep track of the last user message count
  const lastUserMessageCount = useRef<number>(0);

  // Process client actions from the data stream
  useEffect(() => {
    if (!data || data.length === 0) return;

    // Process the latest data item
    const latestData = data[data.length - 1];

    // Use the type guard to check if it's a client action
    if (isClientAction(latestData)) {
      console.log("Received client action:", latestData);

      try {
        const { action, params } = latestData;

        // Create a unique ID for this action to prevent duplicate execution
        const actionId = `${action}-${JSON.stringify(params)}`;

        // Skip if we've already processed this action
        if (processedActions.current.has(actionId)) {
          console.log("Skipping already processed action:", actionId);
          return;
        }

        // Execute the action on the client side using the store functions
        switch (action) {
          case "addColorsToTheme":
            addColorsToTheme(params);
            break;

          case "updateTheme":
            updateTheme(params);
            break;

          case "resetTheme":
            resetTheme();
            break;

          case "removeColorsFromTheme":
            removeColorsFromTheme(params);
            break;

          case "markColorAsFavorite":
            markColorAsFavorite(params);
            break;

          case "generateColorPalette":
            generateColorPalette(params);
            break;

          case "setColorFromHex":
            setColorFromHex(params.hex);
            break;

          case "setColorFromRgb":
            const { r, g, b } = params;
            setColorFromRgb(r, g, b);
            break;

          case "setColorFromHsl":
            const { h, s, l } = params;
            setColorFromHsl(h, s, l);
            break;

          case "generateRandomColor":
            generateRandomColor();
            break;

          case "setCurrentColorFromItem":
            const colorItem = getColorById(params.colorId);
            if (colorItem) {
              setCurrentColorFromItem(colorItem);
            }
            break;

          default:
            console.warn(`Unknown client action: ${action}`);
            return;
        }

        // Mark this action as processed
        processedActions.current.add(actionId);
        console.log("Marked action as processed:", actionId);
      } catch (error) {
        console.error("Error executing client action:", error);
        toast.error(
          "Error executing action: " +
            (error instanceof Error ? error.message : String(error))
        );
      }
    }
  }, [
    data,
    addColorsToTheme,
    updateTheme,
    resetTheme,
    removeColorsFromTheme,
    markColorAsFavorite,
    generateColorPalette,
    setColorFromHex,
    setColorFromRgb,
    setColorFromHsl,
    generateRandomColor,
    getColorById,
    setCurrentColorFromItem,
  ]);

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
  }, [messages, status, completedMessages]);

  // Initialize with default color and first user message
  useEffect(() => {
    if (isFirstLoad.current && !hasInitialized.current) {
      const defaultColor = "#0066ff";
      setBaseColor(defaultColor);

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

      if (currentColor !== lastProcessedColor.current && currentColor) {
        setIsProcessingColor(true);
        lastProcessedColor.current = currentColor;

        try {
          // Skip if this is the initial color and we already have messages
          if (
            currentColor === "#0066FF" &&
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
          const userMessage = `I just selected the color ${currentColor}.`;
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
          const response = await getColorAdvice(currentColor);

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
              content: `I just selected the color ${currentColor}.`,
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

  // Provide the chat context to children
  return (
    <ChatContext.Provider
      value={{
        messages,
        input,
        handleInputChange,
        handleSubmit,
        isLoading,
        status,
        isProcessingColor,
        messageCompletionStatus,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

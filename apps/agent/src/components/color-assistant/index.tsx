import { Suspense } from "react";
import { ChatContainer } from "./chat-container";
import { ChatProvider } from "./context";
import { Skeleton } from "@/components/ui/skeleton";

export default function ColorAssistant() {
  return (
    <div className="flex h-full w-full flex-col">
      <Suspense
        fallback={
          <div className="flex-1 p-4 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-8 w-1/2" />
          </div>
        }
      >
        <ChatProvider>
          <ChatContainer />
        </ChatProvider>
      </Suspense>
    </div>
  );
}

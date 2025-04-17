import { Suspense } from "react"
import { ChatContainer } from "./chat-container"
import { ChatSkeleton } from "./chat-skeleton"
import { ChatProvider } from "./chat-context"

export default function ColorAssistant() {
  return (
    <div className="flex h-full w-full flex-col">
      <Suspense fallback={<ChatSkeleton />}>
        <ChatProvider>
          <ChatContainer />
        </ChatProvider>
      </Suspense>
    </div>
  )
}

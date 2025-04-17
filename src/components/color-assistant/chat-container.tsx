import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"

export function ChatContainer() {
  return (
    <>
      {/* Chat messages area - takes up most of the space */}
      <div className="flex-1 overflow-hidden">
        <ChatMessages />
      </div>

      {/* Input area with fixed height */}
      <div className="border-t w-full" style={{ height: "70px" }}>
        <ChatInput />
      </div>
    </>
  )
}

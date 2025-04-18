import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  console.log(
    "[SIMPLE-SSE] Connection established at",
    new Date().toISOString()
  );

  // Set up SSE headers
  const headers = new Headers({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });

  // Create a readable stream
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Send an initial message
      console.log("[SIMPLE-SSE] Sending initial message");
      controller.enqueue(
        encoder.encode(
          `data: Connection established at ${new Date().toISOString()}\n\n`
        )
      );

      // Send a message every second for 10 seconds
      let count = 0;
      const interval = setInterval(() => {
        count++;
        const message = `Event #${count} at ${new Date().toISOString()}`;
        console.log(`[SIMPLE-SSE] Sending: ${message}`);
        controller.enqueue(encoder.encode(`data: ${message}\n\n`));

        if (count >= 10) {
          clearInterval(interval);
          console.log("[SIMPLE-SSE] Sending final message");
          controller.enqueue(encoder.encode(`data: Stream complete\n\n`));
          controller.close();
        }
      }, 1000);

      // Handle client disconnection
      req.signal.addEventListener("abort", () => {
        console.log(
          "[SIMPLE-SSE] Client disconnected at",
          new Date().toISOString()
        );
        clearInterval(interval);
      });
    },
  });

  console.log("[SIMPLE-SSE] Stream setup complete");
  return new Response(stream, { headers });
}

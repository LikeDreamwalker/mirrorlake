import { Skeleton } from "@/components/ui/skeleton"

export function ChatSkeleton() {
  return (
    <div className="flex flex-col h-full w-full p-4 space-y-4">
      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-lg px-3 py-2 bg-muted border border-dashed border-border">
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-4 w-60" />
        </div>
      </div>

      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-lg px-3 py-2 bg-primary/20 border border-dashed border-primary/30">
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      <div className="flex justify-start">
        <div className="max-w-[80%] rounded-lg px-3 py-2 bg-muted border border-dashed border-border">
          <Skeleton className="h-4 w-52 mb-2" />
          <Skeleton className="h-4 w-64 mb-2" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>

      <div className="mt-auto border-t pt-4">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
    </div>
  )
}

import type { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";

interface CardContainerProps {
  id: string;
  children: ReactNode;
  needScroll?: boolean;
}

export default function CardContainer({
  id,
  children,
  needScroll = true,
}: CardContainerProps) {
  return (
    <Card
      id={id}
      className="h-full min-w-full w-full flex-shrink-0 snap-center md:min-w-0 md:w-1/2 lg:min-w-0 lg:w-1/3 lg:flex-1 border-dashed shadow-sm"
    >
      <CardContent className="h-full p-2">
        {needScroll ? (
          <ScrollArea className="h-full rounded-xl">
            <div className="h-full w-full">{children}</div>
          </ScrollArea>
        ) : (
          <div className="h-full rounded-xl overflow-hidden">{children}</div>
        )}
      </CardContent>
    </Card>
  );
}

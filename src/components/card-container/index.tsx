import type { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";

interface CardContainerProps {
  id: string;
  children: ReactNode;
}

export default function CardContainer({ id, children }: CardContainerProps) {
  return (
    <Card
      id={id}
      className="h-full min-w-full w-full flex-shrink-0 snap-center lg:min-w-0 lg:w-1/3 lg:flex-1 border-dashed shadow-sm"
    >
      <CardContent className="h-full">
        <ScrollArea className="h-full rounded-xl">
          <div className="h-full my-2">{children}</div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

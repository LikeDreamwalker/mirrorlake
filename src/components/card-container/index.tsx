import type { ReactNode } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";

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
      <ScrollArea className="h-full p-3 md:p-4">{children}</ScrollArea>
    </Card>
  );
}

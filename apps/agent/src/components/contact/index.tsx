"use client";

import Link from "next/link";
import { ExternalLink, Github } from "lucide-react";

import Logo from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { useColorStore } from "@/provider";

export default function Contact() {
  const { currentColor } = useColorStore((state) => ({
    currentColor: state.currentColor,
  }));
  return (
    <Card className="w-full p-2" style={{ color: currentColor }}>
      <CardContent className="w-full gap-2 p-2 flex items-center justify-between flex-wrap">
        <Button variant="outline" size="icon" asChild>
          <Link
            href="https://github.com/LikeDreamwalker/mirrorlake"
            target="_blank"
            rel="noopener noreferrer"
          >
            {/* Update icon later */}
            <Github />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link
            href="https://likedreamwalker.space"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Meet LikeDreamwalker
          </Link>
        </Button>
        <Logo className="w-full my-4"></Logo>
        <p className="text-xs font-light mt-2">
          MIT License, All Rights Reserved
        </p>
      </CardContent>
    </Card>
  );
}

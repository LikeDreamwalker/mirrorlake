import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex-1 flex flex-col gap-8 items-center">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />

        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>nextjs-shadcn-template</CardTitle>
            <CardDescription>
              Get started by editing src/app/page.tsx
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              A simple template with Next.js 15 and shadcn/ui.
              <br />
              Build by LikeDreamwalker with Vercel, v0 and love❤️.
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Customizable components</li>
              <li>Easy to integrate with Next.js</li>
            </ul>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button asChild>
              <Link
                href="https://ui.shadcn.com/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Learn shadcn/ui
              </Link>
            </Button>
            <Badge variant="outline">v0.1.0</Badge>
          </CardFooter>
        </Card>

        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <Button asChild>
            <Link
              href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                className="mr-2 dark:invert"
                src="/vercel.svg"
                alt="Vercel logomark"
                width={20}
                height={20}
              />
              Deploy now
            </Link>
          </Button>
          <Button asChild className="bg-[#0066ff]">
            <Link
              href="https://ldwid.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                className="mr-2 text-white"
                src="/ldw.svg"
                alt="Vercel logomark"
                width={200}
                height={200}
              />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link
              href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Read Next.js docs
            </Link>
          </Button>
        </div>
      </main>

      <footer className="flex gap-6 flex-wrap items-center justify-center">
        <Button variant="link" asChild>
          <Link
            href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/file.svg"
              alt="File icon"
              width={16}
              height={16}
              className="mr-2"
            />
            Learn
          </Link>
        </Button>
        <Button variant="link" asChild>
          <Link
            href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/window.svg"
              alt="Window icon"
              width={16}
              height={16}
              className="mr-2"
            />
            Examples
          </Link>
        </Button>
        <Button variant="link" asChild>
          <Link
            href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              src="/globe.svg"
              alt="Globe icon"
              width={16}
              height={16}
              className="mr-2"
            />
            Go to nextjs.org →
          </Link>
        </Button>
      </footer>
    </div>
  );
}

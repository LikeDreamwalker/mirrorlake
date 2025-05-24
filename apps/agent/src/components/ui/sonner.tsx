"use client";
import { Check, Info, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group pointer-events-auto "
      position="top-center"
      toastOptions={{
        className: "justify-start",
        classNames: {
          toast:
            "!bg-background !text-foreground !border-border !rounded-3xl !backdrop-blur-md !shadow-lg",
          description: "!text-muted-foreground !font-light",
          title: "!text-foreground !font-bold",
          actionButton: "!bg-primary !text-primary-foreground",
          cancelButton: "!bg-muted !text-muted-foreground",
          icon: "size-6",
        },
      }}
      icons={{
        success: <Check className="text-green-500 size-full" />,
        info: <Info className="text-blue-500 size-full" />,
        warning: <TriangleAlert className="text-yellow-500 size-full" />,
        error: <X className="text-red-500 size-full" />,
        loading: <LoaderCircle className=" animate-spin size-full" />,
      }}
      {...props}
    />
  );
};

export { Toaster };

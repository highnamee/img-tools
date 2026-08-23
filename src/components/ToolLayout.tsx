import type { ReactNode } from "react";

import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/utils/css";

interface ToolLayoutProps {
  leftPanel: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ToolLayout({ leftPanel, children, className }: Readonly<ToolLayoutProps>) {
  return (
    <TooltipProvider>
      <div
        className={cn(
          "flex flex-col gap-4 py-6 lg:flex-row lg:gap-6",
          className
        )}
      >
        <aside className="w-full shrink-0 lg:w-72 xl:w-80">
          <div
            className={cn(
              "bg-card/80 border-border/60 rounded-2xl border p-5 shadow-lg backdrop-blur-sm",
              "flex flex-col gap-4",
              "lg:sticky lg:top-6 lg:overflow-y-auto"
            )}
          >
            {leftPanel}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col gap-4">
          {children}
        </section>
      </div>
    </TooltipProvider>
  );
}

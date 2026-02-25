import * as React from "react";
import { cn } from "@/lib/utils";

export type SeparatorProps = React.HTMLAttributes<HTMLDivElement> & {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
  ref?: React.Ref<HTMLDivElement>;
};

const Separator: React.FC<SeparatorProps> = ({
  className,
  orientation = "horizontal",
  decorative = true,
  ref,
  ...props
}) => (
  <div
    ref={ref}
    role={decorative ? "none" : "separator"}
    aria-orientation={decorative ? undefined : orientation}
    className={cn(
      "shrink-0 bg-border",
      orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
      className
    )}
    {...props}
  />
);

export { Separator };

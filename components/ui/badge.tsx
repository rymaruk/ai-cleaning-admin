import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
        outline: "text-foreground",
        recommended:
          "border-transparent bg-green-600 text-white hover:bg-green-700 dark:bg-green-600 dark:text-white dark:hover:bg-green-700",
        expert:
          "border-transparent bg-expert-yellow-500 text-black hover:bg-expert-yellow-600 dark:bg-expert-yellow-500 dark:text-black dark:hover:bg-expert-yellow-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export type BadgeProps = React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof badgeVariants> & {
    className?: string;
    children?: React.ReactNode;
    /** Rendered as content when no children are passed */
    label?: React.ReactNode;
  };

const Badge: React.FC<BadgeProps> = (({
  className,
  variant,
  label,
  children,
  ...props
}: BadgeProps) => (
  <div className={cn(badgeVariants({ variant }), className)} {...props}>
    {children ?? label}
  </div>
));

export { Badge, badgeVariants };

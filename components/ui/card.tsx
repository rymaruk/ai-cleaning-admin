import * as React from "react";
import { cn } from "@/lib/utils";

export type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  ref?: React.Ref<HTMLDivElement>;
};

const Card: React.FC<CardProps> = ({ className, ref, ...props }) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow",
      className
    )}
    {...props}
  />
);

export type CardHeaderProps = React.HTMLAttributes<HTMLDivElement> & {
  ref?: React.Ref<HTMLDivElement>;
};

const CardHeader: React.FC<CardHeaderProps> = ({
  className,
  ref,
  ...props
}) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
);

export type CardTitleProps = React.HTMLAttributes<HTMLHeadingElement> & {
  ref?: React.Ref<HTMLParagraphElement>;
};

const CardTitle: React.FC<CardTitleProps> = ({
  className,
  ref,
  ...props
}) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
);

export type CardDescriptionProps =
  React.HTMLAttributes<HTMLParagraphElement> & {
    ref?: React.Ref<HTMLParagraphElement>;
  };

const CardDescription: React.FC<CardDescriptionProps> = ({
  className,
  ref,
  ...props
}) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
);

export type CardContentProps = React.HTMLAttributes<HTMLDivElement> & {
  ref?: React.Ref<HTMLDivElement>;
};

const CardContent: React.FC<CardContentProps> = ({
  className,
  ref,
  ...props
}) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
);

export type CardFooterProps = React.HTMLAttributes<HTMLDivElement> & {
  ref?: React.Ref<HTMLDivElement>;
};

const CardFooter: React.FC<CardFooterProps> = ({
  className,
  ref,
  ...props
}) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
);

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };

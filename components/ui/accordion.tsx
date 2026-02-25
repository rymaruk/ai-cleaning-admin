"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cn } from "@/lib/utils";

const Accordion = AccordionPrimitive.Root;

type AccordionItemProps = Omit<
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>,
  "ref"
> & { ref?: React.Ref<HTMLDivElement>; className?: string };

const AccordionItem: React.FC<AccordionItemProps> = ({ className, ref, ...props }) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b last:border-b-0", className ?? "")}
    {...props}
  />
);

type AccordionTriggerProps = Omit<
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>,
  "ref"
> & { ref?: React.Ref<HTMLButtonElement>; className?: string };

const AccordionTrigger: React.FC<AccordionTriggerProps> = ({
  className,
  children,
  ref,
  ...props
}) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "group flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline",
        className ?? ""
      )}
      {...props}
    >
      {children}
      <span
        className="shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180"
        aria-hidden
      >
        ▼
      </span>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
);

type AccordionContentProps = Omit<
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>,
  "ref"
> & { ref?: React.Ref<HTMLDivElement>; className?: string };

const AccordionContent: React.FC<AccordionContentProps> = ({
  className,
  children,
  ref,
  ...props
}) => (
  <AccordionPrimitive.Content ref={ref} className="overflow-hidden text-sm" {...props}>
    <div className={cn("pb-4 pt-0", className ?? "")}>{children}</div>
  </AccordionPrimitive.Content>
);

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };

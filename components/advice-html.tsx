"use client";

import { sanitizeAdviceHtml, wrapProductNamesInLinks } from "@/lib/utils/advice-html";

const ADVICE_HTML_CLASS =
  "text-sm text-foreground [&_p]:mb-2 [&_p:last-child]:mb-0 [&_strong]:font-semibold [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:opacity-90";

type AdviceHtmlProps = {
  content: string;
  products?: { name: string; url: string | null }[];
};

/** Рендер поради: HTML з абзацами та жирним. Якщо передано products — назви товарів у <strong> стають посиланнями. */
export function AdviceHtml({ content, products }: AdviceHtmlProps) {
  const hasTags = /<p>|<\/p>|<strong>|<\/strong>|<b>|<\/b>|<br\s*\/?>/i.test(content);
  const sanitized = hasTags ? sanitizeAdviceHtml(content) : "";
  let toRender =
    hasTags && sanitized
      ? sanitized
      : content
          .split(/\n+/)
          .filter((s) => s.trim())
          .map((s) => `<p>${s.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>`)
          .join("");
  if (products?.length) {
    toRender = wrapProductNamesInLinks(toRender, products);
  }
  return (
    <div className={ADVICE_HTML_CLASS} dangerouslySetInnerHTML={{ __html: toRender }} />
  );
}

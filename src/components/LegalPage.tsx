import type { ReactNode } from "react";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <article className="relative z-10 mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-extrabold md:text-4xl">{title}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{updated}</p>
      <div className="mt-8 space-y-4 rounded-2xl glass p-6 text-sm leading-relaxed text-foreground/85 [&_h2]:mt-6 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1.5">
        {children}
      </div>
    </article>
  );
}

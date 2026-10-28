import type { ReactNode } from "react";

export function Prose({ children }: { children: ReactNode }) {
  return <div className="sticker space-y-4 p-6 leading-relaxed [&_a]:font-semibold [&_a]:text-pink-deep [&_a:hover]:underline [&_h2]:h-display [&_h2]:mt-6 [&_h2]:text-2xl [&_li]:ml-5 [&_li]:list-disc">{children}</div>;
}

import type { ReactNode } from "react";

/** Article text: guides, posts, about and the legal pages (`.prose-fc` in globals.css). */
export function Prose({ children }: { children: ReactNode }) {
  return <div className="prose-fc mb-8">{children}</div>;
}

import Link from "next/link";
import type { ReactNode } from "react";

export function Section({ title, href, more, children }: { title: string; href?: string; more?: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 className="h-display text-xl sm:text-2xl">{title}</h2>
        {href && (
          <Link prefetch={false} href={href} className="text-sm font-semibold text-pink-deep hover:underline">
            {more ?? "See all"} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function PageHead({ title, sub }: { title: string; sub?: ReactNode; emoji?: string }) {
  return (
    <header className="relative mb-6 mt-6">
      <h1 className="h-display text-3xl leading-tight sm:text-4xl">{title}</h1>
      {sub && <div className="mt-2 max-w-2xl text-soft">{sub}</div>}
    </header>
  );
}

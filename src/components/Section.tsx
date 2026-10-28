import Link from "next/link";
import type { ReactNode } from "react";

export function Section({ title, kaomoji, href, more, children }: { title: string; kaomoji?: string; href?: string; more?: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 className="h-display text-2xl sm:text-3xl">
          {title} {kaomoji && <span className="ml-1 whitespace-nowrap align-middle text-base font-normal text-pink">{kaomoji}</span>}
        </h2>
        {href && (
          <Link prefetch={false} href={href} className="font-display font-semibold text-pink-deep hover:underline">
            {more ?? "See all"} →
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

export function PageHead({ title, sub, emoji }: { title: string; sub?: ReactNode; emoji?: string }) {
  return (
    <header className="relative mb-6 mt-6">
      {emoji && <span aria-hidden className="absolute -top-2 right-0 text-6xl opacity-40 motion-safe:animate-float">{emoji}</span>}
      <h1 className="h-display text-4xl leading-tight sm:text-5xl">{title}</h1>
      {sub && <div className="mt-2 max-w-2xl text-soft">{sub}</div>}
    </header>
  );
}

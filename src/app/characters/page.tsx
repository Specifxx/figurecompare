import type { Metadata } from "next";
import Link from "next/link";
import { EbayStrip, lineQueries } from "@/components/EbayStrip";
import { PageHead } from "@/components/Section";
import { figuresOfCharacter, liveCharacters } from "@/lib/characters";

export const metadata: Metadata = {
  title: "Anime figures by character: Nendoroid, figma & POP UP PARADE prices",
  description: "Find every figure of your favourite character: Hatsune Miku, Frieren, Gojo, Rem, Anya, Makima and more, priced across real figure stores.",
  alternates: { canonical: "/characters" },
};

export default function CharactersIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4">
      <PageHead
        title="Figures by character"
        sub={
          <p>
            Every character with three or more Nendoroid, figma and POP UP PARADE figures to compare, most figures first. Or browse{" "}
            <Link prefetch={false} href="/series" className="font-medium text-ink underline underline-offset-4">
              by series
            </Link>
            .
          </p>
        }
      />
      <ul className="mb-12 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {liveCharacters().map((c) => (
          <li key={c.slug}>
            <Link prefetch={false} href={`/character/${c.slug}`} className="sticker flex items-center justify-between gap-2 px-4 py-3 hover:border-pink">
              <span className="font-semibold">{c.name}</span>
              <span className="text-sm text-soft">{figuresOfCharacter(c.slug).length}</span>
            </Link>
          </li>
        ))}
      </ul>
      <EbayStrip className="mb-10" placement="characters_index" queries={lineQueries("Nendoroid")} />
    </div>
  );
}

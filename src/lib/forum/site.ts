// FigureCompare's forum settings (the rules are in ./core.ts, docs/forum.md).
import type { ForumSite } from "./core";

export const FORUM_SITE: ForumSite = {
  site: "figurecompare",
  siteName: "FigureCompare",
  repo: "Specifxx/figurecompare",
  hosts: ["figurecompare.com", "www.figurecompare.com"],
  base: "/forum",
  topic: "anime figure",
  intro: "Talk anime figure prices, pre-orders, deals and collections with other collectors.",
  categories: [
    {
      "key": "preorders",
      "name": "Pre-orders & new releases",
      "blurb": "Upcoming Nendoroids, figmas and POP UP PARADEs, and where to pre-order them for less.",
      "prompts": [
        "Which upcoming figure are you most excited for?",
        "Best store for pre-orders in your country?"
      ]
    },
    {
      "key": "deals",
      "name": "Deals & where to buy",
      "blurb": "Good prices you spotted, store experiences and shipping tips.",
      "prompts": [
        "Which store shipped fastest for you?",
        "Best deal you found this month"
      ]
    },
    {
      "key": "collection",
      "name": "Collection & display",
      "blurb": "Shelves, cases, lighting and what you collect.",
      "prompts": [
        "How do you display your Nendoroids?",
        "Your grail figure?"
      ]
    },
    {
      "key": "bootlegs",
      "name": "Spotting bootlegs",
      "blurb": "How to tell a real figure from a fake, and stores to trust.",
      "prompts": [
        "Red flags in a listing?",
        "Is a price too good to be true?"
      ]
    },
    {
      "key": "site",
      "name": "Site feedback",
      "blurb": "Ideas, bugs or a store we should add.",
      "prompts": [
        "A store we should compare"
      ]
    }
  ],
  reserved: ["figure compare", "good smile"],
};

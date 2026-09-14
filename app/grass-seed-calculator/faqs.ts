// Shared between layout.tsx (FAQPage JSON-LD) and page.tsx (the visible FAQ
// section). Google requires the schema answers to match what is on the page, so
// both read from this one array — never duplicate the copy.

export interface Faq {
  question: string;
  answer: string;
}

export const FAQS: Faq[] = [
  {
    question: "How much grass seed do I need?",
    answer:
      "Measure the lawn in square feet, divide by 1,000, and multiply by the seeding rate. This calculator uses 5 lb per 1,000 sq ft for a new lawn, 3 for overseeding and 4 for bare patches, so a 2,000 sq ft lawn from scratch needs 10 lb — two of the common 7 lb bags. Those rates suit a typical sun-and-shade mix; a pure stand of one species can need anywhere from 2 to 10 lb, which is worth checking on the bag before you buy.",
  },
  {
    question: "How much grass seed per 1,000 square feet?",
    answer:
      "It depends on the species, and the spread is wide. Published seeding rates run roughly 2 to 3 lb per 1,000 sq ft for Kentucky bluegrass, 4 to 5 for fine fescue, 6 to 9 for perennial ryegrass, and 6 to 10 for tall fescue. The reason is seed size: a pound of Kentucky bluegrass holds around two million seeds, a pound of tall fescue closer to 230,000. You need roughly eight times the weight of tall fescue to put down the same number of seeds.",
  },
  {
    question: "How much seed do I need for overseeding?",
    answer:
      "Around half to two-thirds of a new-lawn rate, because you are thickening existing turf rather than covering bare ground. This calculator uses 3 lb per 1,000 sq ft against 5 for a new lawn. Mow short — around 2 inches — and dethatch first if the thatch layer is over half an inch, or most of the seed never reaches soil and never germinates.",
  },
  {
    question: "When is the best time to plant grass seed?",
    answer:
      "For cool-season grasses — bluegrass, fescue, ryegrass — late summer into early autumn is the best window by a wide margin. The soil is still warm enough for fast germination, the air is cooling, and annual weeds are finishing rather than starting. Spring is the second-best option and a harder one, because crabgrass germinates alongside your seed and you cannot use a pre-emergent herbicide without killing the grass seed too. Warm-season grasses like Bermuda and zoysia go in late spring to early summer, once soil temperatures are reliably warm.",
  },
  {
    question: "How long does grass seed take to germinate?",
    answer:
      "Perennial ryegrass is the quickest at roughly 5 to 10 days, tall fescue 7 to 12, fine fescue 7 to 14, and Kentucky bluegrass the slowest at 14 to 30. That range is why most bagged mixes include ryegrass — it greens up fast and holds the soil while the bluegrass takes its time. It is also why people conclude a seeding has failed at day ten when the slow half has not started yet.",
  },
  {
    question: "How often should I water new grass seed?",
    answer:
      "Light and frequent until it germinates, then less often and deeper. The goal before germination is to keep the top quarter inch of soil consistently damp, which in warm weather usually means two or three short waterings a day rather than one long one. A single deep soak washes seed into low spots and lets the surface dry out in between, and dry seed that has already started to swell will die. Once the grass is up, taper to fewer, longer waterings so the roots chase the moisture downward.",
  },
  {
    question: "Do I need starter fertilizer for new grass seed?",
    answer:
      "It helps, and the type matters. Starter formulas carry more phosphorus — the middle number — which supports root development in seedlings. Do not substitute standard lawn fertilizer: the high nitrogen in it pushes top growth the seedlings cannot support and can burn them outright. One caution on availability: several US states restrict phosphorus lawn fertilizer, usually with an exemption for new seeding or a soil test showing a deficiency, so check your state's rule before ordering.",
  },
];

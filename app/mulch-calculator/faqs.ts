// Shared between layout.tsx (FAQPage JSON-LD) and page.tsx (the visible FAQ
// section). Google requires the schema answers to match what's on the page, so
// both read from this one array — never duplicate the copy.

export interface Faq {
  question: string;
  answer: string;
}

export const FAQS: Faq[] = [
  {
    question: "How much mulch do I need?",
    answer:
      "Multiply the bed's square footage by the depth in feet to get cubic feet, then divide by 27 for cubic yards or by the bag size for a bag count. At the standard 3-inch depth, depth in feet is 0.25 — so a 100 sq ft bed needs 25 cubic feet, which is about 0.9 cubic yards or 13 bags of the common 2-cubic-foot size.",
  },
  {
    question: "How many bags of mulch are in a cubic yard?",
    answer:
      "A cubic yard is 27 cubic feet, so it takes 13.5 bags of the standard 2-cubic-foot size — round up to 14 to actually fill a yard. If you are buying 3-cubic-foot bags it takes 9. That ratio is why bulk delivery starts winning on price once a job runs past a few yards: 3 cubic yards is roughly 41 two-cubic-foot bags to load, haul, and open by hand.",
  },
  {
    question: "How many square feet does a bag of mulch cover?",
    answer:
      "A 2-cubic-foot bag covers about 12 square feet at a 2-inch depth, 8 square feet at 3 inches, and 6 square feet at 4 inches. A 3-cubic-foot bag covers about 18, 12, and 9 square feet at those same depths. Coverage is just bag volume divided by depth in feet, so doubling the depth halves the area a bag covers.",
  },
  {
    question: "How deep should mulch be?",
    answer:
      "Three inches is the standard for a new bed — deep enough to block light from weed seeds and slow moisture loss, shallow enough that water and air still reach the roots. Use 2 inches when you are topping up over mulch that is still in decent shape, and up to 4 inches on bare soil where weed pressure is heavy. Going past 4 inches works against you: it can keep water from reaching the root zone, hold damp against stems, and encourage fungal growth. Around a tree, keep mulch pulled back from the trunk flare rather than piled against it.",
  },
  {
    question: "Is bagged or bulk mulch cheaper?",
    answer:
      "Bulk is sold by the cubic yard and adds a flat delivery fee, so it only wins once the volume is large enough to absorb that fee — commonly somewhere around 3 cubic yards, about 41 two-cubic-foot bags. Below that, bags usually come out ahead and are far easier to handle. Bulk also needs a spot for the pile to be dumped and a wheelbarrow to move it, which is worth factoring in before you order.",
  },
  {
    question: "Do I need to remove the old mulch before adding new?",
    answer:
      "Usually not. Mulch breaks down into the soil, which is part of what it is there for, so most beds just need a top-up rather than a strip-out. Rake the existing layer to break up any crust and check the total depth first — if the bed is already sitting at 3 inches, adding another 3 puts you well past the point where mulch starts holding damp against stems. Remove the old layer only if it has matted into a water-shedding crust or is showing persistent fungal growth.",
  },
];

// Shared between layout.tsx (FAQPage JSON-LD) and page.tsx (the visible FAQ
// section). Google requires the schema answers to match what's on the page, so
// both read from this one array — never duplicate the copy.

export interface Faq {
  question: string;
  answer: string;
}

export const FAQS: Faq[] = [
  {
    question: "How much paint do I need for a 12x12 room?",
    answer:
      "A 12 × 12 ft room with 8 ft ceilings has 384 square feet of wall before you subtract anything. Take out a standard door (20 sq ft) and two windows (15 sq ft each) and you are at 334. At 400 square feet per gallon that is a little over three quarters of a gallon per coat, so two gallons covers two coats with enough left for touch-ups. Buy the second gallon at the same time as the first — paint is tinted in batches, and a gallon mixed three weeks later can be visibly off against the first.",
  },
  {
    question: "Do I need to subtract doors and windows?",
    answer:
      "Subtract them once the openings pass roughly a tenth of the wall area, which in practice means any room with more than one window. Below that, leaving them in gives you a margin you will use on touch-ups. A standard 3 ft by 6 ft 8 in interior door is 20 square feet, and a typical double-hung window about 15 — the figures this calculator deducts.",
  },
  {
    question: "Is one gallon of paint enough for two coats?",
    answer:
      "Only on a small room. A gallon covers 350 to 400 square feet in one coat on smooth, primed, previously painted drywall — so it covers 175 to 200 square feet in two. That is a bathroom or a small hallway. For a bedroom, plan on two gallons.",
  },
  {
    question: "How much does the ceiling add?",
    answer:
      "The ceiling is length × width, so a 12 × 12 room adds 144 square feet — well under half a gallon per coat. Ceilings are usually painted flat white in a dedicated ceiling paint, which is formulated thicker to cut spatter and to hide the roller lap marks that show badly on a large uninterrupted surface.",
  },
  {
    question: "What roller nap should I use?",
    answer:
      "3/8 inch for smooth drywall and plaster, 1/2 inch for light orange-peel texture, and 3/4 inch or more for knockdown, stucco or brick. Nap that is too short leaves the valleys of a texture unpainted and reads as thin coverage, which is the usual reason a wall seems to need a third coat.",
  },
  {
    question: "Does a dark color need more paint?",
    answer:
      "It needs more coats rather than more square footage per coat, and the two amount to the same trip back to the store. Saturated reds, deep blues and true yellows carry less opaque pigment and commonly take three coats over a light wall. A grey-tinted primer underneath cuts that to two more often than a white primer does.",
  },
];

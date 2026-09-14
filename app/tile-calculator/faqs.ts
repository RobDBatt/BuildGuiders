// Shared between layout.tsx (FAQPage JSON-LD) and page.tsx (the visible FAQ
// section). Google requires the schema answers to match what is on the page, so
// both read from this one array — never duplicate the copy.

export interface Faq {
  question: string;
  answer: string;
}

export const FAQS: Faq[] = [
  {
    question: "How many tiles do I need?",
    answer:
      "Multiply length by width for the area, add a waste factor, then divide by the square footage of one tile. A 12 × 12 inch tile is exactly 1 square foot, so 100 square feet at 10 percent waste is 110 tiles. An 18 × 18 is 2.25 square feet, so the same room takes 49. Subway tile at 3 × 6 inches is an eighth of a square foot, so it takes 880.",
  },
  {
    question: "How many 12x12 tiles do I need for 100 square feet?",
    answer:
      "110, allowing the standard 10 percent waste. A 12 × 12 inch tile covers exactly one square foot, which makes this the easiest size to estimate and the reason it is the default here. Raise the waste factor and the count rises with it: 115 at 15 percent, 120 at 20 percent.",
  },
  {
    question: "How much waste should I add when ordering tile?",
    answer:
      "Ten percent for a straight grid layout in a room with square corners. Fifteen for a diagonal layout, because every tile along the perimeter gets cut into two triangles and one half is usually scrap. Fifteen to twenty for herringbone and chevron, where almost every edge tile is a cut. Add more again for large-format tile — a bad cut on a 24 × 24 wastes four square feet, not one — and for rooms with alcoves, jogs or an island to work around.",
  },
  {
    question: "Should I use sanded or unsanded grout?",
    answer:
      "Unsanded for joints under 1/8 inch, sanded for 1/8 inch and wider. The sand gives a wide joint the compressive strength to resist cracking, which is why it is not optional on floors with normal joints. The exception is soft or polished surfaces — marble, glass, some polished porcelain — where sand can scratch the face during grouting. For those, use unsanded or a specialty grout and check the tile manufacturer's guidance first.",
  },
  {
    question: "How wide should grout lines be?",
    answer:
      "The tile decides, not taste. Rectified tile has mechanically squared edges and near-identical dimensions, so it can take joints as tight as 1/16 inch. Non-rectified tile comes out of the kiln with real size variation, and a joint of around 3/16 inch is what absorbs it — go tighter and the lines visibly wander. Check whether your tile is rectified before committing to a tight joint, because you cannot fix it after the first row.",
  },
  {
    question: "How much thinset mortar do I need?",
    answer:
      "This calculator allows one 50 lb bag per 40 square feet, which is about right for a 1/4 inch square-notch trowel — the normal choice for tile up to around 12 × 12. Notch size drives the number more than anything else: a 1/2 inch notch for large-format tile can halve the coverage per bag, so buy roughly double if you are setting 18 × 18 or larger. The target is 80 percent mortar contact behind the tile in dry areas and 95 percent in showers and outdoors, so pull a tile after your first few and check before you carry on.",
  },
  {
    question: "Can I use wall tile on a floor?",
    answer:
      "Usually not. Wall tile is often softer and thinner than floor tile and will craze or crack underfoot. The number to look for is the PEI rating: PEI I and II are wall and light-duty only, PEI III suits normal residential floors, and PEI IV and V are for heavy traffic. Floor tile on a wall is the safe direction — the only issue there is weight, and whether the substrate and adhesive are rated for it.",
  },
];

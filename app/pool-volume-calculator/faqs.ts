// Shared between layout.tsx (FAQPage JSON-LD) and page.tsx (the visible FAQ
// section). Google requires the schema answers to match what's on the page, so
// both read from this one array — never duplicate the copy.

export interface Faq {
  question: string;
  answer: string;
}

export const FAQS: Faq[] = [
  {
    question: "How many gallons is my pool?",
    answer:
      "Multiply the pool's surface area by its average depth to get cubic feet, then multiply by 7.48 to get US gallons. For a rectangle that is length × width × average depth × 7.48. On a pool that slopes, average depth is the shallow-end water depth plus the deep-end water depth, divided by two. A 16 × 32 ft rectangular pool sloping from 3 ft to 8 ft holds roughly 21,100 gallons.",
  },
  {
    question: "How do I measure average depth on a pool with a deep end?",
    answer:
      "Measure the water depth — not the wall height — at the shallow end and again at the deepest point, then average the two. That average is exact when the floor slopes at a constant grade from one end to the other. If your pool has a flat shallow shelf that drops sharply into a hopper, the simple average runs high, because the shallow shelf covers more floor area than the deep hopper does. In that case take a third measurement at the midpoint and average all three, or treat the shallow half and the deep half as separate rectangles and add their volumes.",
  },
  {
    question: "Why does my above-ground pool hold less water than the box says?",
    answer:
      "The capacity printed on the box is generally calculated at the pool's full wall height, and an above-ground pool is never filled that high. Manufacturers direct you to fill to about the middle of the skimmer opening, which leaves roughly 4 to 6 inches of dry wall. On a 52-inch wall that puts actual water depth closer to 46–48 inches. Volume scales directly with depth, so the real number lands about 10 percent under the wall-height figure. Measure your actual water depth and use that.",
  },
  {
    question: "How many gallons is a 15 ft round above-ground pool?",
    answer:
      "About 5,300 gallons at 4 feet of water depth: π × 7.5² × 4 × 7.48. The same pool at 42 inches of water holds about 4,600 gallons. Round pools gain and lose volume quickly with depth, so measure the water rather than assuming the wall height.",
  },
  {
    question: "What is turnover rate, and what pump flow does my pool need?",
    answer:
      "Turnover rate is how long the pump takes to circulate a volume of water equal to the entire pool. Eight hours is the usual residential target. Divide the pool's gallons by 480 (8 hours × 60 minutes) to get the minimum flow rate in gallons per minute. A 20,000-gallon pool needs roughly 42 GPM for an 8-hour turnover. The filter's rated flow should meet or exceed the pump's output, and plumbing diameter caps what the system can actually move.",
  },
  {
    question: "How much chlorine and shock does a pool this size need?",
    answer:
      "That depends on the concentration of the specific product, plus water temperature, sunlight and how heavily the pool is used, so there is no single correct figure by volume alone. Manufacturers of 3-inch stabilized tablets generally direct one tablet per 5,000 gallons per week as a starting point, adjusted by what your test kit reads. This calculator sizes the shopping list for a pool your size — always dose to the product label and your test results, not to a number from a website.",
  },
];

// Shared between layout.tsx (FAQPage JSON-LD) and page.tsx (the visible FAQ
// section). Google requires the schema answers to match what is on the page, so
// both read from this one array — never duplicate the copy.

export interface Faq {
  question: string;
  answer: string;
}

export const FAQS: Faq[] = [
  {
    question: "How much drywall do I need?",
    answer:
      "Measure the perimeter of the room, multiply by the ceiling height for wall area, add length × width if you are boarding the ceiling, then subtract the openings. Divide by 32 for the number of 4 × 8 sheets, or by 48 for 4 × 12 sheets, and add about 10 percent for waste. A 12 × 12 ft room with an 8 ft ceiling, one door and one window comes to roughly 493 square feet including the ceiling, which is 17 sheets of 4 × 8.",
  },
  {
    question: "How many sheets of drywall do I need for a 12x12 room?",
    answer:
      "About 17 sheets of 4 × 8 board, boarding the walls and the ceiling with an 8 ft ceiling height, one door and one window. That is 349 square feet of wall plus 144 of ceiling, divided by the 32 square feet in a sheet, plus 10 percent waste. Walls only, with no ceiling, drops it to 13 sheets.",
  },
  {
    question: "Should I buy 4x8 or 4x12 drywall sheets?",
    answer:
      "Buy the longest sheet you can physically get into the room. Drywall has tapered long edges that form a shallow trough for the compound to fill, so those seams finish nearly flat. The cut ends have no taper, and a seam between two of them — a butt joint — has to be built up and feathered wide to hide. A 4 × 12 sheet spans most residential walls in one piece and removes butt joints entirely. 4 × 8 is the DIY default because it fits in a car and two people can carry it, and it is what this calculator assumes at 32 square feet per sheet.",
  },
  {
    question: "Is 1/2 inch or 5/8 inch drywall better?",
    answer:
      "Half-inch is the residential standard for walls and is what most rooms need. Five-eighths Type X is the one to use where fire resistance is required — the garage side of a garage-to-house wall and its ceiling is the common case in the US residential code — and on ceilings where the framing is 24 inches on centre, because half-inch board will sag between joists over time, especially with insulation sitting on it. Check your local code before deciding, since fire-separation requirements vary. Three-eighths and quarter-inch exist for patching and for curved walls, not for general hanging.",
  },
  {
    question: "How many screws do I need per sheet of drywall?",
    answer:
      "The usual spec is a screw every 16 inches along each framing member on walls and every 12 inches on ceilings, which works out to roughly 32 screws in a 4 × 8 wall sheet. Use 1-1/4 inch coarse-thread screws in wood framing and fine-thread in steel studs. This calculator allows one box per five sheets, which leaves margin for the ones you strip, overdrive through the paper, or drop.",
  },
  {
    question: "Should I use paper tape or mesh tape?",
    answer:
      "Paper tape is stronger in tension and is the right choice for flat seams and inside corners, where it also gives you a crease to fold against. Self-adhesive mesh is faster to put up and does not need bedding compound under it, but it is weaker, so it needs a setting-type compound over it rather than a premixed all-purpose — premixed does not develop enough strength to stop a mesh seam cracking. If you are taping your first room, paper on the flats and corners is the more forgiving option.",
  },
  {
    question: "How much joint compound do I need?",
    answer:
      "This calculator allows one bucket per 400 square feet of board, which covers a normal three-coat finish — a bedding coat over the tape, a fill coat, and a thin skim. Buy setting-type compound as well if you have deep gaps or butt joints to build up: it hardens by chemical reaction rather than by drying, shrinks less, and lets you put a second coat on the same day.",
  },
];

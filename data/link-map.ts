import { amznSearchUrl, amznPdpUrl } from "../lib/amzn";

export type LinkRec = {
  title: string;
  href: string;
  notes?: string;
};

/**
 * LINK_MAP
 * 
 * This is a temporary stub map of outbound links.
 * You can add real entries later or generate them from content.
 */
export const LINK_MAP: LinkRec[] = [
  // Example:
  // {
  //   title: "Search HDMI cables on Amazon",
  //   href: amznSearchUrl("Ultra High Speed HDMI 2.1 cable"),
  //   notes: "Generic HDMI cable search",
  // },
  // {
  //   title: "Example PDP link for an HDMI switch",
  //   href: amznPdpUrl("B08XXXXXXX"),
  // },
];

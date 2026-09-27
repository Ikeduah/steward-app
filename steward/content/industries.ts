/**
 * The five groups Steward is written for, in the one order used everywhere.
 *
 * Section 6 of the landing page reads from this, and so will the per-group
 * pages when they exist. Keep the copy here rather than in a component, so the
 * homepage panel and the group's own page can never disagree about what the
 * group is called or what it lends out.
 *
 * The industry is an example, never the headline. Every line here is about
 * equipment moving between people, which is the thing all five share.
 */

export interface Industry {
  /** URL segment for the group's own page, e.g. /churches. */
  slug: string;
  /** Display name, sentence case. */
  name: string;
  /** One short line under the name. */
  line: string;
  /** Photograph under public/, with a QR tag visible in frame. */
  photo: string;
  alt: string;
  /** Three items this group typically lends out. */
  examples: string[];
}

export const INDUSTRIES: Industry[] = [
  {
    slug: "churches",
    name: "Churches",
    line: "Volunteers change. Your records don't.",
    photo: "/landing/photos/photo-church-stage.jpg",
    alt: "Volunteer adjusting a tagged audio console at the front of a church before a service",
    examples: ["Sony FX3 camera", "Wireless mic pack", "Projector"],
  },
  {
    slug: "events",
    name: "Events and production",
    line: "Every case that goes out comes back.",
    photo: "/landing/photos/photo-event-load-in.jpg",
    alt: "Team wheeling tagged flight cases down a loading ramp during an event load-in",
    examples: ["Flight case", "Radio 4", "Lighting kit"],
  },
  {
    slug: "it-teams",
    name: "IT teams",
    line: "Laptops go out with new hires. Make sure they come back.",
    photo: "/landing/photos/photo-it-rack-room.jpg",
    alt: "Technician checking tagged network hardware in a server rack room",
    examples: ["MacBook Pro 14", "Loaner iPad", "Barcode scanner"],
  },
  {
    slug: "schools",
    name: "Schools",
    line: "Chromebooks, cameras, and instruments students borrow every day.",
    photo: "/landing/photos/photo-school-cart.jpg",
    alt: "Student's hand pulling a tagged Chromebook from an open charging cart in a school library",
    examples: ["Chromebook cart A", "Camera kit", "Violin"],
  },
  {
    slug: "trades",
    name: "Facilities and trades",
    line: "Tools that leave the shop, and return.",
    photo: "/landing/photos/photo-trades-tool-crib.jpg",
    alt: "Gloved hand scanning the QR tag on a drill case with a phone in a job site tool room",
    examples: ["DeWalt drill kit", "Laser level", "Extension cable"],
  },
];

/**
 * ASSET GAP: these two photographs have not been produced yet. Until they land
 * in public/landing/photos, section 6 renders their panels on flat ink instead
 * of requesting a file that 404s. Delete an entry once its file is committed.
 *
 * Prompts, matched to the existing section 6 set (QR tag visible, emerald only
 * on the tag, 16:10):
 *
 * photo-school-cart: School library corner, soft afternoon light. Chromebook
 * charging cart, door open, each laptop with a small white QR tag with a thin
 * emerald border. A student's hand, seen from the side, pulls one out. Shelves
 * soft behind. Documentary, 35mm, shallow depth of field, no faces, no logos.
 *
 * photo-trades-tool-crib: Tidy tool room in a job site trailer. Pegboard of
 * power tools and hard cases; a drill case on the counter with a small white QR
 * tag with a thin emerald border. A gloved hand scans it with a phone. Morning
 * window light. Documentary, 35mm, shallow depth of field, no faces, no logos.
 */
export const PENDING_PHOTOS = new Set<string>([
  "/landing/photos/photo-school-cart.jpg",
  "/landing/photos/photo-trades-tool-crib.jpg",
]);

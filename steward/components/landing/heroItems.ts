/**
 * Hero cloud item data.
 *
 * Every value here is hand-authored and static. Nothing is randomized at
 * runtime: people scroll back up, and random positions break reverse scrubbing.
 *
 * MOTION MODEL
 * One scroll progress value p (0 to 1) drives the whole hero. Each item has a
 * local progress t = clamp((p - enter) / (exit - enter), 0, 1). As t advances
 * the item's depth decreases, so scale grows, it drifts outward and downward a
 * little, and it rotates a few degrees. It fades in from the far distance and
 * fades out as it passes the camera. Nothing spins, nothing tumbles.
 *
 * DEPTH BANDS
 * Band decides size and speed, not importance. Far items are small, dim, softly
 * blurred and barely move. Near items are large, cropped by the frame edges and
 * travel furthest. That speed difference is the parallax, and it is the entire
 * effect: if the bands move at similar rates the hero looks broken.
 *
 * THE CORRIDOR
 * The type sits in a clear column from CORRIDOR_LEFT to CORRIDOR_RIGHT. No item
 * may cross it at any point in the scroll. Because x and scale are both linear
 * in t, an item's inner edge (x plus halfWidth for a left-channel item, x minus
 * halfWidth for a right-channel one) is also linear in t, so checking t=0 and
 * t=1 proves the whole range. verifyCorridor() below does exactly that, and
 * `npm run verify:hero` asserts it, so a bad edit to this table fails a check
 * instead of shipping an item that drifts through the headline.
 */

export type Band = "far" | "mid" | "near";

export interface HeroLabel {
  /** Asset ID, shown in mono. */
  id: string;
  /** Item name, shown under the ID. */
  name: string;
  /**
   * Which way the leader line runs, toward the centre of the frame.
   *
   * Pointing outward is the obvious choice and it is wrong: items drift outward
   * as they approach, so an outward label walks off the edge of the screen
   * partway through the scroll. Pointing inward gains room over time instead.
   * The cost is that a labelled item has to sit clear of the type block
   * vertically, which is why the labels are on items high and low in the frame
   * and never on one sitting level with the headline.
   */
  side: "left" | "right";
}

export interface HeroItem {
  name: string;
  band: Band;
  src: string;
  /** Intrinsic pixel size of the source asset, from assets/manifest.json. */
  intrinsic: [number, number];
  alt: string;
  /** Horizontal centre, [start, end] as a percentage of viewport width. */
  x: [number, number];
  /** Vertical centre, [start, end] as a percentage of viewport height. */
  y: [number, number];
  /** Rotation, [start, end] in degrees. A few degrees of drift, never a spin. */
  rotate: [number, number];
  /**
   * Scroll progress at which the item starts fading in. May be negative, which
   * means it is already part-way through its travel on the first frame.
   */
  enter: number;
  /** Scroll progress at which the item has fully passed the camera. */
  exit: number;
  label?: HeroLabel;
  /**
   * Fixed placement for the reduced-motion and mobile arrangement. Only the six
   * items that make up that still composition carry one.
   */
  still?: { x: number; y: number; scale: number; rotate: number };
}

/** Base rendered width per band, as a percentage of viewport width. */
export const BAND_WIDTH: Record<Band, number> = { far: 10, mid: 15, near: 22 };

/** Scale at t=0 and t=1 per band. Near travels furthest: that is the parallax. */
export const BAND_SCALE: Record<Band, [number, number]> = {
  far: [0.55, 1.0],
  mid: [0.6, 1.35],
  near: [0.7, 2.2],
};

/** Peak opacity per band. Far items read as atmosphere, not as subjects. */
export const BAND_OPACITY: Record<Band, number> = { far: 0.7, mid: 1, near: 1 };

/** Paint order: near over mid over far. */
export const BAND_Z: Record<Band, number> = { far: 1, mid: 2, near: 3 };

export const CORRIDOR_LEFT = 28;
export const CORRIDOR_RIGHT = 68;

export const HERO_ITEMS: HeroItem[] = [
  // ---- left channel ------------------------------------------------------
  {
    name: "hard-case",
    band: "near",
    src: "/landing/hero-items/hard-case.webp",
    intrinsic: [1400, 1013],
    alt: "Tagged hard-shell equipment case with an emerald QR asset tag on its lid",
    x: [13, -9],
    y: [20, 4],
    rotate: [-7, -2],
    enter: -0.1,
    exit: 0.62,
  },
  {
    name: "laptop",
    band: "mid",
    src: "/landing/hero-items/laptop.webp",
    intrinsic: [1000, 726],
    alt: "Open laptop tagged with an emerald QR asset tag below the trackpad",
    x: [19, 7],
    y: [40, 47],
    rotate: [5, 1],
    enter: -0.12,
    exit: 1.1,
    still: { x: 16, y: 40, scale: 1.0, rotate: 4 },
  },
  {
    name: "two-way-radio",
    band: "mid",
    src: "/landing/hero-items/two-way-radio.webp",
    intrinsic: [522, 1000],
    alt: "Two-way radio standing upright, tagged with an emerald QR asset tag",
    x: [15, 3],
    y: [70, 84],
    rotate: [-4, 2],
    enter: -0.16,
    exit: 1.04,
    label: { id: "STW-0512", name: "Motorola R7", side: "right" },
    still: { x: 15, y: 74, scale: 0.85, rotate: -3 },
  },
  {
    name: "tripod",
    band: "far",
    src: "/landing/hero-items/tripod.webp",
    intrinsic: [787, 800],
    alt: "Folded camera tripod carrying an emerald QR asset tag on one leg",
    x: [23, 18],
    y: [28, 24],
    rotate: [8, 3],
    enter: -0.05,
    exit: 1.05,
    still: { x: 22, y: 24, scale: 0.9, rotate: 6 },
  },
  {
    name: "mic-pack",
    band: "far",
    src: "/landing/hero-items/mic-pack.webp",
    intrinsic: [647, 800],
    alt: "Wireless microphone belt pack tagged with an emerald QR asset tag",
    x: [21, 16],
    y: [82, 90],
    rotate: [-5, -1],
    enter: 0.12,
    exit: 1.18,
  },

  // ---- right channel -----------------------------------------------------
  {
    name: "cable-coil",
    band: "near",
    src: "/landing/hero-items/cable-coil.webp",
    intrinsic: [1400, 1338],
    alt: "Coiled extension cable with an emerald QR asset tag clipped to the loop",
    x: [86, 108],
    y: [30, 16],
    rotate: [6, 1],
    enter: -0.04,
    exit: 0.7,
  },
  {
    name: "camera-body",
    band: "near",
    src: "/landing/hero-items/camera-body.webp",
    intrinsic: [1300, 1400],
    alt: "Professional camera body and lens tagged with an emerald QR asset tag",
    x: [84, 107],
    y: [70, 86],
    rotate: [-6, -1],
    enter: -0.18,
    exit: 0.42,
    still: { x: 90, y: 82, scale: 0.9, rotate: -5 },
  },
  {
    name: "barcode-scanner",
    band: "mid",
    src: "/landing/hero-items/barcode-scanner.webp",
    intrinsic: [893, 1000],
    alt: "Handheld barcode scanner angled downward, tagged with an emerald QR asset tag",
    x: [81, 93],
    y: [24, 14],
    rotate: [-8, -3],
    enter: -0.08,
    exit: 1.06,
    label: { id: "STW-0233", name: "Zebra DS2278", side: "left" },
    still: { x: 82, y: 24, scale: 0.95, rotate: -7 },
  },
  {
    name: "mixer",
    band: "mid",
    src: "/landing/hero-items/mixer.webp",
    intrinsic: [1000, 708],
    alt: "Audio mixing desk tagged with an emerald QR asset tag on its side panel",
    x: [87, 99],
    y: [56, 62],
    rotate: [7, 2],
    enter: 0.2,
    exit: 1.14,
    still: { x: 88, y: 58, scale: 1.05, rotate: 6 },
  },
  {
    name: "tablet",
    band: "mid",
    src: "/landing/hero-items/tablet.webp",
    intrinsic: [933, 1000],
    alt: "Tablet held at an angle with an emerald QR asset tag on its back",
    x: [80, 92],
    y: [80, 92],
    rotate: [4, -1],
    enter: 0.3,
    exit: 1.22,
    label: { id: "STW-0309", name: "iPad Pro 11", side: "left" },
  },
  {
    name: "projector",
    band: "far",
    src: "/landing/hero-items/projector.webp",
    intrinsic: [800, 616],
    alt: "Video projector tagged with an emerald QR asset tag on its housing",
    x: [77, 82],
    y: [46, 42],
    rotate: [-6, -2],
    enter: -0.02,
    exit: 1.08,
  },
];

/** The still arrangement used under reduced motion and on mobile. */
export const STILL_ITEMS = HERO_ITEMS.filter((item) => item.still);

/** The three items whose mono labels explain what the animation is showing. */
export const LABELLED_ITEMS = HERO_ITEMS.filter((item) => item.label);

export interface CorridorBreach {
  item: string;
  at: "start" | "end";
  edge: number;
}

/**
 * Proves no item crosses the type corridor at any point in the scroll.
 *
 * An item's inner edge is x(t) offset by halfWidth(t). Both x and scale are
 * linear in t, so the edge is linear in t and its extremes sit at t=0 and t=1.
 * Checking those two points therefore checks the entire range.
 */
export function verifyCorridor(items: HeroItem[] = HERO_ITEMS): CorridorBreach[] {
  const breaches: CorridorBreach[] = [];

  for (const item of items) {
    const base = BAND_WIDTH[item.band];
    const [scaleFrom, scaleTo] = BAND_SCALE[item.band];
    const isLeftChannel = item.x[0] < 50;

    const samples: ReadonlyArray<readonly ["start" | "end", number, number]> = [
      ["start", item.x[0], (base * scaleFrom) / 2],
      ["end", item.x[1], (base * scaleTo) / 2],
    ];

    for (const [at, x, halfWidth] of samples) {
      const edge = isLeftChannel ? x + halfWidth : x - halfWidth;
      const clear = isLeftChannel ? edge <= CORRIDOR_LEFT : edge >= CORRIDOR_RIGHT;
      if (!clear) breaches.push({ item: item.name, at, edge });
    }
  }

  return breaches;
}

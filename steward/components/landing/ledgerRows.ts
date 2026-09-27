/**
 * Chain-of-custody ledger rows.
 *
 * Typed from the copy spec, not from the reference comps: the comps carry
 * garbled model-generated strings in exactly these cells, so reading them off
 * the image would ship nonsense that looks like real data.
 *
 * The rows deliberately span the five groups the page speaks to, so no single
 * industry reads as the headline.
 *
 * TODO(isaac): confirm feature. Check-outs do not record a location today, so
 * the Where column shows something the product cannot yet capture.
 */

export type LedgerStatus = "Checked out" | "Overdue" | "In stock" | "Returned";

export interface LedgerRow {
  assetId: string;
  item: string;
  /** The person holding it, or the room it lives in when it is in stock. */
  holder: string;
  where: string;
  status: LedgerStatus;
}

export const LEDGER_ROWS: LedgerRow[] = [
  {
    assetId: "STW-0142",
    item: "Sony FX3 camera",
    holder: "Mike A.",
    where: "Media booth",
    status: "Checked out",
  },
  {
    assetId: "STW-0318",
    item: "MacBook Pro 14",
    holder: "Jess K.",
    where: "Finance",
    status: "Checked out",
  },
  {
    assetId: "STW-0521",
    item: "DeWalt drill kit",
    holder: "Dan R.",
    where: "Building B",
    status: "Overdue",
  },
  {
    assetId: "STW-0077",
    item: "Chromebook cart A",
    holder: "Room 204",
    where: "Library",
    status: "In stock",
  },
  {
    assetId: "STW-0610",
    item: "Radio 4",
    holder: "Sam T.",
    where: "Main hall",
    status: "Returned",
  },
];

/**
 * The row that flips to its listed status once the ledger has settled. It
 * arrives as FLIP_FROM and changes once, not on a loop: the point is to show a
 * record changing, and a loop would turn that into wallpaper.
 */
export const FLIP_ROW_INDEX = 4;
export const FLIP_FROM: LedgerStatus = "Checked out";

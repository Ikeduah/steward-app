/**
 * Chain-of-custody ledger rows.
 *
 * Typed from the build handoff, not from the reference comps: the comps carry
 * garbled model-generated strings in exactly these cells, so reading them off
 * the image would ship nonsense that looks like real data.
 */

export type LedgerStatus = "OUT" | "RETURNED";

export interface LedgerRow {
  assetId: string;
  item: string;
  person: string;
  timestamp: string;
  status: LedgerStatus;
}

export const LEDGER_ROWS: LedgerRow[] = [
  {
    assetId: "STW-0416",
    item: "Sony FX6 body",
    person: "R. Oyelaran",
    timestamp: "Fri 18:42",
    status: "OUT",
  },
  {
    assetId: "STW-0102",
    item: "Sennheiser G4 kit",
    person: "D. Amankwah",
    timestamp: "Fri 18:39",
    status: "OUT",
  },
  {
    assetId: "STW-0388",
    item: "Pelican 1610",
    person: "M. Castellanos",
    timestamp: "Thu 09:15",
    status: "RETURNED",
  },
  {
    assetId: "STW-0291",
    item: "Shure wireless pack",
    person: "T. Bediako",
    timestamp: "Thu 08:52",
    status: "OUT",
  },
  {
    assetId: "STW-0177",
    item: "MacBook Pro 14",
    person: "J. Whitfield",
    timestamp: "Wed 17:20",
    status: "RETURNED",
  },
  {
    assetId: "STW-0455",
    item: "Extension cable 50ft",
    person: "R. Oyelaran",
    timestamp: "Wed 16:04",
    status: "OUT",
  },
];

/**
 * The row that flips from OUT to RETURNED once the ledger has settled. It
 * happens once, not on a loop: the point is to show a record changing, and a
 * loop would turn that into wallpaper.
 */
export const FLIP_ROW_INDEX = 3;

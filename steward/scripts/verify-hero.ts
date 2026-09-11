/**
 * Hero cloud sanity check. Run with `npm run verify:hero`.
 *
 * The hero's one unforgiving rule is that no floating item may drift through
 * the headline. That is normally caught by eye, badly, on one frame. Because
 * every item's inner edge is linear in its local progress, it can be proven
 * arithmetically across the whole scroll instead. This script does that, plus a
 * few counts the design brief pins down, and exits non-zero on a violation.
 *
 * Runs on Node's native TypeScript type stripping. No build step, no test
 * runner: the Playwright suite in tests/ needs a live server and auth state,
 * which is far too much machinery for checking a table of numbers.
 */

import {
  BAND_WIDTH,
  CORRIDOR_LEFT,
  CORRIDOR_RIGHT,
  HERO_ITEMS,
  LABELLED_ITEMS,
  STILL_ITEMS,
  verifyCorridor,
} from "../components/landing/heroItems.ts";

let failed = false;

function check(label: string, ok: boolean, detail: string) {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}  ${detail}`);
  if (!ok) failed = true;
}

// 1. No item crosses the type corridor at any point in the scroll.
const breaches = verifyCorridor();
check(
  "corridor, scroll range",
  breaches.length === 0,
  breaches.length === 0
    ? `all ${HERO_ITEMS.length} items clear of ${CORRIDOR_LEFT}-${CORRIDOR_RIGHT}%`
    : JSON.stringify(breaches),
);

// 2. Same rule for the static arrangement used on mobile and reduced motion.
const stillBreaches = STILL_ITEMS.flatMap((item) => {
  const still = item.still!;
  const halfWidth = (BAND_WIDTH[item.band] * still.scale) / 2;
  const isLeftChannel = still.x < 50;
  const edge = isLeftChannel ? still.x + halfWidth : still.x - halfWidth;
  const clear = isLeftChannel ? edge <= CORRIDOR_LEFT : edge >= CORRIDOR_RIGHT;
  return clear ? [] : [{ item: item.name, edge }];
});
check(
  "corridor, still arrangement",
  stillBreaches.length === 0,
  stillBreaches.length === 0
    ? `all ${STILL_ITEMS.length} items clear`
    : JSON.stringify(stillBreaches),
);

// 3. The brief caps labels at three. More than that and the hero stops
//    explaining the product and starts shouting over itself.
check("label count", LABELLED_ITEMS.length === 3, `${LABELLED_ITEMS.length} labelled`);

// 4. The still arrangement is specified as six items.
check("still item count", STILL_ITEMS.length === 6, `${STILL_ITEMS.length} placed`);

// 5. Eight to ten items should be in flight at once across the scroll. Fewer
//    and the cloud looks like it has holes; more and it reads as clutter.
const occupancy = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1].map((p) => ({
  p,
  on: HERO_ITEMS.filter((item) => p > item.enter && p < item.exit).length,
}));
const outOfRange = occupancy.filter((sample) => sample.on < 8 || sample.on > 10);
check(
  "items in flight",
  outOfRange.length === 0,
  outOfRange.length === 0
    ? occupancy.map((s) => `${s.p}:${s.on}`).join(" ")
    : `out of the 8-10 range at ${JSON.stringify(outOfRange)}`,
);

// 6. Every item needs alt text that describes the equipment and the action.
//    Naming the object is the point, so "laptop" appearing in the laptop's alt
//    text is correct, not a smell. What is banned is alt text that is merely
//    the filename: the bare slug, or anything carrying a file extension.
const weakAlt = HERO_ITEMS.filter((item) => {
  const alt = item.alt.trim();
  const isBareSlug = alt.toLowerCase().replace(/[\s-]/g, "") === item.name.replace(/-/g, "");
  return alt.split(/\s+/).length < 6 || /\.(webp|png|jpe?g)\b/i.test(alt) || isBareSlug;
});
check("alt text", weakAlt.length === 0, weakAlt.map((i) => i.name).join(", ") || "all descriptive");

// Set the code rather than calling process.exit(), which tears the loop down
// while stdout handles are still open and aborts with a libuv assertion on
// Windows. That abort looks like a failing check when it is nothing of the sort.
process.exitCode = failed ? 1 : 0;

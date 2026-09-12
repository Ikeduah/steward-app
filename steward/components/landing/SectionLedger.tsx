import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { FLIP_ROW_INDEX, LEDGER_ROWS, type LedgerStatus } from "./ledgerRows";

/**
 * Section 5. Chain of custody.
 *
 * The densest section on the page and the concept centrepiece. The ledger is
 * real DOM rather than a generated screenshot: the mono data has to be real
 * text, it reads sharper at every zoom level, and it is the one place where the
 * product's actual shape shows through.
 *
 * Hairline dividers, no per-row boxes, no charts. Emerald appears on RETURNED
 * and nowhere else in this section.
 */

const ROW_STAGGER_S = 0.06;
const ROW_COUNT = LEDGER_ROWS.length;

/** How long after the last row settles before the status flip fires. */
const FLIP_DELAY_MS = 900;

function StatusCell({ status }: { status: LedgerStatus }) {
  return (
    <motion.span
      key={status}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className={
        status === "RETURNED" ? "text-stw-emerald" : "text-[color:var(--stw-muted)]"
      }
    >
      {status}
    </motion.span>
  );
}

export function SectionLedger() {
  const reduce = useReducedMotion();
  const [settled, setSettled] = useState(false);
  const [flipped, setFlipped] = useState(false);

  // One row flips from OUT to RETURNED once the ledger has finished arriving.
  // Once, not on a loop, and never under reduced motion.
  useEffect(() => {
    if (!settled || reduce) return;
    const timer = window.setTimeout(() => setFlipped(true), FLIP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [settled, reduce]);

  return (
    <section data-surface="ink" className="stw-surface relative overflow-hidden font-display">
      {/* Fine micro-noise over the ink field. Fixed to a pointer-events-none
          overlay on a non-scrolling element, never applied to a scrolling
          container, which would repaint the grain every frame. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035] mix-blend-screen"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative mx-auto max-w-[1400px] px-6 py-24 md:px-12 md:py-32">
        <h2 className="max-w-[18ch] text-3xl font-bold leading-[1.1] tracking-tight md:text-[2.75rem]">
          Always know who has what gear.
        </h2>

        <div className="mt-14 md:mt-20 md:pr-16">
          <motion.div
            onViewportEnter={() => {
              if (reduce) setSettled(true);
            }}
            className="rounded-xl bg-[color:var(--stw-float)] p-2 shadow-[0_40px_120px_-60px_rgba(16,185,129,0.22)] sm:p-4 md:p-6"
          >
            {/* Horizontal scroll is contained here so the page body never
                scrolls sideways on a narrow screen. */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[38rem] border-collapse text-left font-mono text-[13px]">
                <caption className="sr-only">
                  Recent equipment check-out and return records
                </caption>
                <thead>
                  <tr className="text-[11px] uppercase tracking-[0.16em] text-[color:var(--stw-muted)]">
                    <th scope="col" className="px-4 py-3 font-normal">Asset</th>
                    <th scope="col" className="px-4 py-3 font-normal">Item</th>
                    <th scope="col" className="px-4 py-3 font-normal">Person</th>
                    <th scope="col" className="px-4 py-3 font-normal">Time</th>
                    <th scope="col" className="px-4 py-3 text-right font-normal">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {LEDGER_ROWS.map((row, index) => {
                    const status =
                      flipped && index === FLIP_ROW_INDEX ? "RETURNED" : row.status;

                    return (
                      <motion.tr
                        key={row.assetId}
                        data-reveal
                        className="border-t border-[color:var(--stw-hairline)]"
                        // Not conditional on the reduced-motion preference: that
                        // would change the markup between server and client and
                        // trip a hydration mismatch. The preference is honoured
                        // in the transition, so the row snaps into place instead.
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.4 }}
                        transition={
                          reduce
                            ? { duration: 0, delay: 0 }
                            : {
                                duration: 0.55,
                                delay: index * ROW_STAGGER_S,
                                ease: [0.16, 1, 0.3, 1],
                              }
                        }
                        onAnimationComplete={() => {
                          if (index === ROW_COUNT - 1) setSettled(true);
                        }}
                      >
                        <td className="whitespace-nowrap px-4 py-4 text-[color:var(--stw-muted)]">
                          {row.assetId}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4">{row.item}</td>
                        <td className="whitespace-nowrap px-4 py-4">{row.person}</td>
                        <td className="whitespace-nowrap px-4 py-4 text-[color:var(--stw-muted)]">
                          {row.timestamp}
                        </td>
                        <td className="whitespace-nowrap px-4 py-4 text-right">
                          <StatusCell status={status} />
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>

      {/* The second-read moment, used here and nowhere else on the page: a
          margin note in an archive. The design brief calls for this explicitly,
          which is why it overrides the usual rule against rotated type. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden w-16 items-center justify-center lg:flex"
      >
        <span className="absolute inset-y-16 right-8 w-px bg-[color:var(--stw-hairline)]" />
        {/* Centred on the rail via its own midpoint. Offsetting a rotated
            element from an edge positions its pre-rotation box, which lands the
            caption on top of the table instead of beside it. */}
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.32em] text-[color:var(--stw-muted)]">
          Every movement leaves a record
        </span>
      </div>
    </section>
  );
}

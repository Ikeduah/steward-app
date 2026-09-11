import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

/**
 * Section 3. Asymmetric trio.
 *
 * One tall panel on the left at full height, two unequal panels stacked on the
 * right. Explicitly not three equal cards: the sizes carry the reading order,
 * which is why the left panel is the one you land on.
 *
 * Carries the first of exactly two uppercase eyebrows on the page. The second
 * is in section 6. There are no others.
 */

interface Step {
  src: string;
  alt: string;
  title: string;
  body: string;
}

const LEAD: Step = {
  src: "/landing/photos/photo-label-printer.jpg",
  alt: "Label printer feeding out a freshly printed emerald QR asset tag on a workbench",
  title: "Tag it",
  body: "Create rugged tags for any asset.",
};

const SUPPORTING: Step[] = [
  {
    src: "/landing/photos/photo-tag-macro-case.jpg",
    alt: "Hand holding a phone to scan the QR tag on a hard case lid",
    title: "Scan it",
    body: "Confirm check-in and check-out in seconds.",
  },
  {
    src: "/landing/photos/photo-scanning-in-storage.jpg",
    alt: "Crew member scanning tagged equipment on a shelf in a storage room",
    title: "Hand it off",
    body: "Update chain of custody instantly.",
  },
];

function Panel({
  step,
  className,
  sizes,
  delay,
  reduce,
}: {
  step: Step;
  className: string;
  sizes: string;
  delay: number;
  reduce: boolean | null;
}) {
  return (
    <motion.figure
      data-reveal
      className={`relative overflow-hidden rounded-xl ${className}`}
      // initial is deliberately not conditional. Making it depend on the
      // reduced-motion preference changes the markup between server and client
      // and trips a hydration mismatch, so the preference is honoured in the
      // transition instead: same markup, but it snaps rather than travels.
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={
        reduce
          ? { duration: 0, delay: 0 }
          : { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }
      }
    >
      <Image src={step.src} alt={step.alt} fill sizes={sizes} className="object-cover" />
      {/* Scrim so the caption clears AA over any part of the photograph. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-t from-stw-ink/85 via-stw-ink/25 to-transparent"
      />
      <figcaption className="absolute inset-x-0 bottom-0 p-6 text-stw-paper md:p-8">
        <h3 className="text-xl font-bold tracking-tight md:text-2xl">{step.title}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-stw-paper/80">{step.body}</p>
      </figcaption>
    </motion.figure>
  );
}

export function SectionSteps() {
  const reduce = useReducedMotion();

  return (
    <section
      id="how-it-works"
      data-surface="paper"
      className="stw-surface scroll-mt-20 font-display"
    >
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-12 md:py-32">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--stw-muted)]">
          System overview
        </p>
        <h2 className="mt-5 max-w-[20ch] text-3xl font-bold leading-[1.1] tracking-tight md:text-[2.75rem]">
          Three simple steps to total gear tracking
        </h2>

        <div className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-[2fr_1fr] md:gap-6">
          <Panel
            step={LEAD}
            className="min-h-[22rem] md:min-h-[38rem]"
            sizes="(max-width: 768px) 100vw, 62vw"
            delay={0}
            reduce={reduce}
          />
          {/* Unequal heights on purpose. Matching them would rebuild the equal
              card row this layout exists to avoid. */}
          <div className="grid grid-cols-1 gap-5 md:grid-rows-[5fr_4fr] md:gap-6">
            <Panel
              step={SUPPORTING[0]}
              className="min-h-[16rem]"
              sizes="(max-width: 768px) 100vw, 31vw"
              delay={0.08}
              reduce={reduce}
            />
            <Panel
              step={SUPPORTING[1]}
              className="min-h-[14rem]"
              sizes="(max-width: 768px) 100vw, 31vw"
              delay={0.16}
              reduce={reduce}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

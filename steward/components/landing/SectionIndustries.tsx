import Image from "next/image";
import { useState } from "react";
import { INDUSTRIES, PENDING_PHOTOS } from "../../content/industries";

/**
 * Section 6. Accordion slices.
 *
 * Five full-height vertical photo panels at unequal widths, one expanded and
 * four compressed. Never a row of five equal cards: one panel is always the
 * large one. The expansion is driven by grid-template-columns on the
 * container, changing only on interaction, so the reflow cost is negligible
 * and the result is far cleaner than transforming five children.
 *
 * Every panel is a real button. Expansion works on hover, on tap and on
 * keyboard focus, and the focus ring is visible over the photography.
 *
 * The groups, their order and their copy come from content/industries.ts.
 *
 * Carries the second and final uppercase eyebrow on the page.
 */

export function SectionIndustries() {
  const [active, setActive] = useState(0);

  return (
    <section data-surface="paper" className="stw-surface font-display">
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-12 md:py-32">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--stw-muted)]">
          Industries served
        </p>
        <h2 className="mt-5 max-w-[18ch] text-3xl font-bold leading-[1.1] tracking-tight md:text-[2.75rem]">
          Built for teams that share equipment.
        </h2>

        {/* Below md the five stack. Each shows its name and line, and the
            active one opens up to show its photograph. */}
        <div
          className="mt-14 grid grid-cols-1 gap-3 transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:h-[32rem] md:grid-cols-[var(--cols)]"
          style={
            {
              "--cols": INDUSTRIES.map((_, index) =>
                index === active ? "5fr" : "2fr",
              ).join(" "),
            } as React.CSSProperties
          }
        >
          {INDUSTRIES.map((industry, index) => {
            const expanded = index === active;
            const hasPhoto = !PENDING_PHOTOS.has(industry.photo);

            return (
              <button
                key={industry.slug}
                type="button"
                aria-expanded={expanded}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
                className={`stw-focus group relative overflow-hidden rounded-xl bg-stw-ink text-left transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:h-full ${
                  expanded ? "h-[20rem]" : "h-[7.5rem]"
                }`}
              >
                {hasPhoto ? (
                  <Image
                    src={industry.photo}
                    alt={industry.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 40vw"
                    className="object-cover"
                  />
                ) : null}
                {/* Scrim carries the caption to AA over any frame of the photo. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-stw-ink/90 via-stw-ink/35 to-stw-ink/10"
                />
                <span className="absolute inset-x-0 bottom-0 block p-6 text-stw-paper md:p-7">
                  <span className="block text-lg font-bold tracking-tight md:text-xl">
                    {industry.name}
                  </span>
                  {/* The line shows only in the expanded panel, so a squeezed
                      panel shows a name rather than a column of broken words.
                      Below md every panel is full width, so every line shows.
                      Both branches are whole class names: Tailwind extracts
                      these from source, so an interpolated variant would never
                      make it into the stylesheet. */}
                  <span
                    className={`mt-2 block max-w-[38ch] text-sm leading-relaxed text-stw-paper/80 transition-opacity duration-300 ${
                      expanded ? "opacity-100" : "opacity-100 md:opacity-0"
                    }`}
                  >
                    {industry.line}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

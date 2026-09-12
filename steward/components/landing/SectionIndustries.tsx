import Image from "next/image";
import { useState } from "react";

/**
 * Section 6. Accordion slices.
 *
 * Three full-height vertical photo panels at unequal widths, one expanded and
 * two compressed. The expansion is driven by grid-template-columns on the
 * container: three cells, changing only on interaction, so the reflow cost is
 * negligible and the result is far cleaner than transforming three children.
 *
 * Every panel is a real button. Expansion works on hover, on tap and on
 * keyboard focus, and the focus ring is visible over the photography.
 *
 * Carries the second and final uppercase eyebrow on the page.
 */

const PANELS = [
  {
    id: "production",
    src: "/landing/photos/photo-church-stage.jpg",
    alt: "Volunteer adjusting a tagged audio console at the side of a church stage before a service",
    title: "Production teams",
    body: "Cameras, audio and lighting shared across a volunteer rota, tracked to the person holding each item.",
  },
  {
    id: "events",
    src: "/landing/photos/photo-event-load-in.jpg",
    alt: "Crew wheeling tagged flight cases down a loading ramp during an event load-in",
    title: "Live events",
    body: "Load in and load out against a manifest, so the truck leaves with everything it arrived with.",
  },
  {
    id: "it",
    src: "/landing/photos/photo-it-rack-room.jpg",
    alt: "Technician checking tagged network hardware in a server rack room",
    title: "IT and A/V departments",
    body: "Laptops, adapters and loaner hardware issued and returned on a record that survives staff turnover.",
  },
];

export function SectionIndustries() {
  const [active, setActive] = useState(0);

  return (
    <section data-surface="paper" className="stw-surface font-display">
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-12 md:py-32">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--stw-muted)]">
          Industries served
        </p>
        <h2 className="mt-5 max-w-[18ch] text-3xl font-bold leading-[1.1] tracking-tight md:text-[2.75rem]">
          Built for teams that move their gear.
        </h2>

        {/* Below md every panel is full width and fully expanded: a squeezed
            accordion on a phone hides the photograph and the copy at once. */}
        <div
          className="mt-14 grid grid-cols-1 gap-3 transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] md:h-[32rem] md:grid-cols-[var(--cols)]"
          style={
            {
              "--cols": PANELS.map((_, index) =>
                index === active ? "5fr" : "2fr",
              ).join(" "),
            } as React.CSSProperties
          }
        >
          {PANELS.map((panel, index) => {
            const expanded = index === active;

            return (
              <button
                key={panel.id}
                type="button"
                aria-expanded={expanded}
                onMouseEnter={() => setActive(index)}
                onFocus={() => setActive(index)}
                onClick={() => setActive(index)}
                className="stw-focus group relative h-[20rem] overflow-hidden rounded-xl text-left md:h-full"
              >
                <Image
                  src={panel.src}
                  alt={panel.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
                {/* Scrim carries the caption to AA over any frame of the photo. */}
                <span
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-stw-ink/90 via-stw-ink/35 to-stw-ink/10"
                />
                <span className="absolute inset-x-0 bottom-0 block p-6 text-stw-paper md:p-7">
                  <span className="block text-lg font-bold tracking-tight md:text-xl">
                    {panel.title}
                  </span>
                  {/* The body shows only in the expanded panel, so a squeezed
                      panel shows a title rather than a column of broken words.
                      Below md every panel is full width, so every body shows.
                      Both branches are whole class names: Tailwind extracts
                      these from source, so an interpolated variant would never
                      make it into the stylesheet. */}
                  <span
                    className={`mt-2 block max-w-[38ch] text-sm leading-relaxed text-stw-paper/80 transition-opacity duration-300 ${
                      expanded ? "opacity-100" : "opacity-100 md:opacity-0"
                    }`}
                  >
                    {panel.body}
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

import Image from "next/image";

/**
 * Section 7. Single quote.
 *
 * ============================ PLACEHOLDER ============================
 * DO NOT SHIP THIS SECTION ENABLED.
 *
 * The quote, the name, the role and the organisation below are all invented.
 * There is no portrait asset either. A fabricated testimonial is the fastest
 * way to lose a technical buyer, and this audience is exactly the one that
 * checks.
 *
 * Flip SHOW_TESTIMONIAL to true only when ALL of the following are true:
 *   1. A real, named customer has approved a real quote in writing.
 *   2. That customer has supplied, or approved, a real portrait photograph.
 *   3. The copy below has been replaced with what they actually said.
 *
 * Until then the page renders nothing here and section 6 hands straight to
 * section 8, which reads fine.
 * =====================================================================
 */
const SHOW_TESTIMONIAL = false;

const PLACEHOLDER_QUOTE = {
  body: "We stopped losing an hour before every shoot to working out where the kit was.",
  name: "Name Surname",
  role: "Role, Organisation",
  portrait: "/landing/photos/photo-church-stage.jpg",
  portraitAlt: "Portrait placeholder. Replace with an approved photograph of the named customer.",
};

export function SectionProof() {
  if (!SHOW_TESTIMONIAL) return null;

  return (
    <section data-surface="paper" className="stw-surface font-display">
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-12 md:py-32">
        {/* Portrait takes two thirds and the quote one third, inverted from the
            usual arrangement on purpose. */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[2fr_1fr] md:items-end md:gap-16">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl md:aspect-[3/2]">
            <Image
              src={PLACEHOLDER_QUOTE.portrait}
              alt={PLACEHOLDER_QUOTE.portraitAlt}
              fill
              sizes="(max-width: 768px) 100vw, 62vw"
              className="object-cover"
            />
          </div>

          <figure>
            <blockquote className="text-xl leading-[1.45] tracking-tight md:text-2xl">
              &ldquo;{PLACEHOLDER_QUOTE.body}&rdquo;
            </blockquote>
            <figcaption className="mt-7 font-mono text-xs leading-relaxed text-[color:var(--stw-muted)]">
              <span className="block text-[color:var(--stw-on-surface)]">
                {PLACEHOLDER_QUOTE.name}
              </span>
              <span className="block">{PLACEHOLDER_QUOTE.role}</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

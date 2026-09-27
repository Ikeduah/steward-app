/**
 * Section 7. Single quote.
 *
 * The real Kingdom Full Tabernacle quote goes here, typed exactly as approved.
 * There is no portrait: the quote stands on its own rather than beside an
 * invented face.
 *
 * TODO(isaac): paste the approved wording into QUOTE.body, and confirm the
 * name, the role and approval of the edited wording. Until the name and role
 * are confirmed, leave them null and the quote is attributed to the church
 * alone.
 *
 * With no body the section renders nothing and section 6 hands straight to
 * section 8, which reads fine. Never put placeholder words here: a fabricated
 * testimonial is the fastest way to lose the people this page is written for.
 */
const QUOTE: {
  body: string | null;
  name: string | null;
  role: string | null;
  organisation: string;
} = {
  body: null,
  name: null,
  role: null,
  organisation: "Kingdom Full Tabernacle",
};

export function SectionProof() {
  if (!QUOTE.body) return null;

  const person = [QUOTE.name, QUOTE.role].filter(Boolean).join(", ");

  return (
    <section data-surface="paper" className="stw-surface font-display">
      <div className="mx-auto max-w-[1400px] px-6 py-24 md:px-12 md:py-32">
        <figure className="max-w-[40ch]">
          <blockquote className="text-2xl leading-[1.4] tracking-tight md:text-[2rem]">
            &ldquo;{QUOTE.body}&rdquo;
          </blockquote>
          <figcaption className="mt-8 font-mono text-xs leading-relaxed text-[color:var(--stw-muted)]">
            {person ? (
              <span className="block text-[color:var(--stw-on-surface)]">{person}</span>
            ) : null}
            <span className={person ? "block" : "block text-[color:var(--stw-on-surface)]"}>
              {QUOTE.organisation}
            </span>
          </figcaption>
        </figure>
      </div>
    </section>
  );
}

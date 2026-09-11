import Image from "next/image";

/**
 * Section 2. Colour-blocked diptych.
 *
 * Deliberately quiet after the hero: no button, no eyebrow, lots of air. Left
 * block is flat ink, right block is the macro photograph, and the seam between
 * them is hard. No gradient, no blend, no soft edge.
 *
 * ASSET GAP: the foam-insert macro this section was designed around has not
 * been delivered. The tag macro stands in and reads correctly, so this is not
 * blocking, but swap it when the real one exists.
 */
export function SectionCost() {
  return (
    <section data-surface="paper" className="stw-surface font-display">
      <div className="grid grid-cols-1 md:grid-cols-[55fr_45fr]">
        <div
          data-surface="ink"
          className="stw-surface flex items-center px-6 py-24 md:px-12 md:py-32 lg:px-20"
        >
          <div className="max-w-[30rem]">
            <h2 className="text-3xl font-bold leading-[1.1] tracking-tight md:text-[2.75rem]">
              Missing gear disrupts production and inflates costs.
            </h2>
            <p className="mt-7 text-base leading-relaxed text-[color:var(--stw-muted)]">
              A case that cannot be found is a call sheet that slips. An item
              nobody signed for is an item nobody replaces.
            </p>
            <p className="mt-4 text-base leading-relaxed text-[color:var(--stw-muted)]">
              The cost is rarely the equipment. It is the hour the crew spends
              looking for it.
            </p>
          </div>
        </div>

        <div className="relative min-h-[18rem] md:min-h-0">
          <Image
            src="/landing/photos/photo-tag-macro-case.jpg"
            alt="Close-up of an emerald QR asset tag adhered to the textured lid of a hard equipment case"
            fill
            sizes="(max-width: 768px) 100vw, 45vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}

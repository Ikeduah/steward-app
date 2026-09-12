import Link from "next/link";
import { StewardMark } from "../StewardMark";
import { requestAccessHref } from "../../lib/marketing";

/**
 * Section 8. Close, plus the site footer.
 *
 * No photograph. At least 40% of this section is empty ink, and the emptiness
 * is the design, so resist the urge to fill the gap between the call to action
 * and the footer.
 *
 * The pill label matches the hero's word for word. One label per intent across
 * the whole page.
 *
 * Every footer link resolves to a page that exists. No invented destinations,
 * no placeholder columns padded out to look symmetrical.
 */

const FOOTER_COLUMNS: {
  heading: string;
  links: { label: string; href: string }[];
}[] = [
  {
    heading: "Product",
    links: [
      { label: "Platform", href: "/platform" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    heading: "Company",
    links: [{ label: "Request access", href: requestAccessHref() }],
  },
  {
    heading: "Resources",
    links: [{ label: "Demos", href: "/promos/demos" }],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function SectionClose() {
  return (
    <section data-surface="ink" className="stw-surface font-display">
      <div className="mx-auto max-w-[1400px] px-6 md:px-12">
        <div className="flex flex-col items-center py-28 text-center md:py-40">
          <span className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-stw-emerald">
              <StewardMark className="h-4 w-4 text-stw-ink" />
            </span>
            <span className="text-lg font-bold tracking-tight">Steward</span>
          </span>

          <h2 className="mt-14 max-w-[16ch] text-3xl font-bold leading-[1.1] tracking-tight md:text-[3.25rem]">
            Ready to end the equipment chase?
          </h2>

          <Link
            href={requestAccessHref()}
            className="stw-focus mt-10 inline-flex items-center rounded-full bg-stw-emerald px-7 py-3.5 font-medium text-stw-ink transition-transform active:scale-[0.98]"
          >
            Request access
          </Link>

          <p className="mt-6 text-sm text-[color:var(--stw-muted)]">
            Steward is invitation only while we onboard teams one at a time.
          </p>
        </div>

        {/* Hairline, then a large gap, then the footer. The gap is structural. */}
        <div className="h-px w-full bg-[color:var(--stw-hairline)]" />

        <footer className="grid grid-cols-2 gap-x-8 gap-y-10 pb-16 pt-24 md:grid-cols-4 md:pb-20 md:pt-32">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.heading}>
              <h3 className="font-mono text-[11px] tracking-[0.18em] text-[color:var(--stw-muted)]">
                {column.heading}
              </h3>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="stw-focus font-mono text-[13px] transition-colors hover:text-stw-emerald"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </footer>
      </div>
    </section>
  );
}

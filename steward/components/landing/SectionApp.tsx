import Image from "next/image";
import Link from "next/link";

/**
 * Section 4. Editorial side-image, image left.
 *
 * This is the only image-and-text split on the whole page, so it gets the good
 * version: the photograph bleeds to the section edge rather than sitting in a
 * padded container, and the supporting lines are separated by hairlines
 * instead of being turned into bullets or cards.
 *
 * No eyebrow here. The page has two, and both are spent.
 */

/**
 * Only features Steward ships, plus audit export, which is planned and listed
 * here at Isaac's request. TODO(isaac): confirm audit export is live before
 * this page ships, or drop the last line.
 *
 * TODO(isaac): confirm feature. The spec line reads "who, where, and when",
 * but check-outs do not record a location today, so "where" is left out until
 * they do.
 */
const LINES = [
  {
    title: "Tag anything.",
    body: "Print a QR tag and stick it on any item you share.",
  },
  {
    title: "Check out in one scan.",
    body: "Anyone on your team can scan with their phone. No app training.",
  },
  {
    title: "See the full history.",
    body: "Every hand-off is recorded: who had it, and when.",
  },
  {
    title: "Know what's missing.",
    body: "See what's out, who has it, and what's overdue.",
  },
  {
    title: "Be ready for audits.",
    body: "Export a full record of every item and who had it.",
  },
];

export function SectionApp() {
  return (
    <section data-surface="paper" className="stw-surface font-display">
      <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-[55fr_45fr] md:gap-0">
        <div className="relative min-h-[20rem] md:min-h-[40rem]">
          <Image
            src="/landing/app-screens/app-scan-screen.jpg"
            alt="Phone running the Steward scan screen, with a QR asset tag framed in the viewfinder and the matching item resolving underneath"
            fill
            sizes="(max-width: 768px) 100vw, 55vw"
            // The screenshot is shot on a near-white studio ground, which in
            // dark mode makes this the brightest block on the page by a wide
            // margin and reads as a mistake. A small knock-down settles it into
            // the section without greying out the phone itself.
            className="object-cover dark:brightness-[0.88]"
          />
        </div>

        <div className="px-6 pb-24 md:px-12 md:py-32 lg:px-20">
          <h2 className="max-w-[16ch] text-3xl font-bold leading-[1.1] tracking-tight md:text-[2.75rem]">
            Every item accounted for.
          </h2>

          <dl className="mt-12">
            {LINES.map((line, index) => (
              <div
                key={line.title}
                className={`py-6 ${
                  index === 0 ? "" : "border-t border-[color:var(--stw-hairline)]"
                }`}
              >
                <dt className="text-base font-medium">{line.title}</dt>
                <dd className="mt-1.5 max-w-[46ch] text-sm leading-relaxed text-[color:var(--stw-muted)]">
                  {line.body}
                </dd>
              </div>
            ))}
          </dl>

          <Link
            href="/platform"
            className="stw-focus mt-6 inline-flex items-center gap-2 text-sm underline decoration-[color:var(--stw-hairline)] underline-offset-[6px] transition-colors hover:decoration-[color:var(--stw-emerald)]"
          >
            Explore all app features
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

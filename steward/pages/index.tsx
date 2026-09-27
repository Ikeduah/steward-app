import Head from "next/head";
import { HeroCloud } from "../components/landing/HeroCloud";
import { SectionCost } from "../components/landing/SectionCost";
import { SectionSteps } from "../components/landing/SectionSteps";
import { SectionApp } from "../components/landing/SectionApp";
import { SectionLedger } from "../components/landing/SectionLedger";
import { SectionIndustries } from "../components/landing/SectionIndustries";
import { SectionProof } from "../components/landing/SectionProof";
import { SectionClose } from "../components/landing/SectionClose";
import { SITE_URL } from "../lib/marketing";

/**
 * Steward marketing landing page.
 *
 * Eight sections, eight different layout families. No two sections repeat a
 * shape, there is exactly one image-and-text split (section 4), and the page
 * carries exactly two uppercase eyebrows (sections 3 and 6).
 *
 * Sections 1, 5 and 8 sit on ink and the rest on paper. That alternation is the
 * one deliberate colour-block rhythm on the site, not accidental theme drift,
 * and it is preserved in dark mode rather than being flattened.
 *
 * There is no "trusted by" logo strip, on purpose. Steward has no customer
 * logos to put there yet, and invented ones destroy credibility with the people
 * this page is written for.
 *
 * The share image (public/og-image.jpg, 1200x630) is a capture of the hero at
 * the point in the scroll where all three labelled items are on screen. Crawlers
 * need an absolute URL, so it is built from SITE_URL.
 */
export default function Home() {
  return (
    <>
      <Head>
        <title>Steward — Equipment tracking for teams that share</title>
        <meta
          name="description"
          content="Tag any item with a QR code. Scan to check out and return. Know where every item is and who has it."
        />
        <meta property="og:title" content="Steward — Equipment tracking for teams that share" />
        <meta
          property="og:description"
          content="Tag any item with a QR code. Scan to check out and return. Know where every item is and who has it."
        />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={`${SITE_URL}/og-image.jpg`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta
          property="og:image:alt"
          content="Steward hero: a camera, a laptop and a drill kit, each with a QR asset tag, around the line Know where every item is, and who has it."
        />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <main>
        <HeroCloud />
        <SectionCost />
        <SectionSteps />
        <SectionApp />
        <SectionLedger />
        <SectionIndustries />
        <SectionProof />
        <SectionClose />
      </main>
    </>
  );
}

import Head from "next/head";
import { HeroCloud } from "../components/landing/HeroCloud";
import { SectionCost } from "../components/landing/SectionCost";
import { SectionSteps } from "../components/landing/SectionSteps";
import { SectionApp } from "../components/landing/SectionApp";
import { SectionLedger } from "../components/landing/SectionLedger";
import { SectionIndustries } from "../components/landing/SectionIndustries";
import { SectionProof } from "../components/landing/SectionProof";
import { SectionClose } from "../components/landing/SectionClose";

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
 * ASSET GAP: the Open Graph share image (1200x630) has not been produced. The
 * og:image tag is deliberately absent rather than pointed at a wrong-shaped
 * file, which would render worse than no card at all.
 */
export default function Home() {
  return (
    <>
      <Head>
        <title>Steward, equipment tracking for teams that own a lot of gear</title>
        <meta
          name="description"
          content="Tag every item, scan it in and out, and keep a record of who is holding what. Steward is inventory and asset tracking for production teams, live events, and IT departments."
        />
        <meta property="og:title" content="Steward, equipment tracking for teams that own a lot of gear" />
        <meta
          property="og:description"
          content="Tag every item, scan it in and out, and keep a record of who is holding what."
        />
        <meta property="og:type" content="website" />
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

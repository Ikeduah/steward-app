import Link from "next/link";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { StewardMark } from "../StewardMark";
import { requestAccessHref } from "../../lib/marketing";

/**
 * Landing page navigation.
 *
 * Sits over the top of the ink hero rather than sticking, so the pinned hero
 * still starts at the true top of the viewport and nothing has to solve the
 * problem of an ink bar floating over the paper sections below.
 *
 * Section links are desktop only. On a phone the bar carries the wordmark and
 * the auth action alone: the hero's own call to action is a few hundred pixels
 * below, so duplicating it into a cramped bar buys nothing.
 */
export function LandingNav() {
  return (
    <nav className="absolute inset-x-0 top-0 z-30 font-display">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-6 px-6 md:h-[72px] md:px-12">
        <Link href="/" className="stw-focus flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-stw-emerald">
            <StewardMark className="h-4 w-4 text-stw-ink" />
          </span>
          <span className="text-lg font-bold tracking-tight">Steward</span>
        </Link>

        <div className="hidden items-center gap-9 md:flex">
          <Link
            href="/platform"
            className="stw-focus text-sm text-[color:var(--stw-muted)] transition-colors hover:text-[color:var(--stw-on-surface)]"
          >
            Platform
          </Link>
          <Link
            href="/pricing"
            className="stw-focus text-sm text-[color:var(--stw-muted)] transition-colors hover:text-[color:var(--stw-on-surface)]"
          >
            Pricing
          </Link>
          <Link
            href="/promos/demos"
            className="stw-focus text-sm text-[color:var(--stw-muted)] transition-colors hover:text-[color:var(--stw-on-surface)]"
          >
            Demos
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <SignedOut>
            <SignInButton mode="modal">
              <button
                type="button"
                className="stw-focus text-sm text-[color:var(--stw-muted)] transition-colors hover:text-[color:var(--stw-on-surface)]"
              >
                Sign in
              </button>
            </SignInButton>
            <Link
              href={requestAccessHref()}
              className="stw-focus hidden whitespace-nowrap rounded-full bg-stw-emerald px-5 py-2.5 text-sm font-medium text-stw-ink transition-transform active:scale-[0.98] md:inline-flex"
            >
              Request access
            </Link>
          </SignedOut>
          <SignedIn>
            <Link
              href="/dashboard"
              className="stw-focus whitespace-nowrap rounded-full bg-stw-emerald px-5 py-2.5 text-sm font-medium text-stw-ink transition-transform active:scale-[0.98]"
            >
              Launch app
            </Link>
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}

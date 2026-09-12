import Head from "next/head";
import { useRouter } from "next/router";
import { useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { LandingNav } from "../components/landing/LandingNav";
import { REQUEST_ACCESS_EMAIL, requestAccessMailto } from "../lib/marketing";

/**
 * The destination for every "request access" call to action.
 *
 * Steward has no self-serve sign-up, so this is the single conversion path on
 * the marketing site. It used to be a `mailto:`, which a browser with no
 * registered mail handler drops silently — the most common configuration on
 * Windows and on any machine whose owner lives in webmail. So the form is the
 * primary route and the mail address is the fallback beneath it, rather than
 * the other way around.
 *
 * Written in the rebuilt landing page's language (ink surface, --stw-* tokens,
 * Satoshi display face), not the older slate-and-blur style pricing.tsx and
 * platform.tsx still carry.
 *
 * Motion is deliberately thin: one mount ease on the heading, and the press
 * response already on every landing CTA. A form is a task, not a showcase.
 */

/** Bands rather than a free-text number: nobody counts, and the plan tiers
 *  think in these ranges already (Starter caps out at 25 people). */
const TEAM_SIZES = ["1–10", "11–25", "26–100", "More than 100"];

/** Deliberately loose. The address is verified by a reply landing in it, not
 *  by a regex, and anything stricter starts rejecting real addresses. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Values = {
  name: string;
  email: string;
  organization: string;
  teamSize: string;
  notes: string;
  /** Honeypot. Named for what a bot expects to see, hidden from real people. */
  companyWebsite: string;
};

type FieldErrors = Partial<Record<"name" | "email" | "organization", string>>;

const EMPTY_VALUES: Values = {
  name: "",
  email: "",
  organization: "",
  teamSize: TEAM_SIZES[0],
  notes: "",
  companyWebsite: "",
};

const FIELD_CLASS =
  "stw-focus mt-2 w-full rounded-[var(--stw-radius-input)] border bg-[color:var(--stw-float)] px-4 py-3 text-[15px] text-[color:var(--stw-on-surface)] placeholder:text-[color:var(--stw-n500)]";

const LABEL_CLASS = "block text-sm font-medium text-[color:var(--stw-on-surface)]";

// No semantic red on this page: the landing token set is ink, paper and emerald
// only. An errored field states its case with a full-contrast border and a
// full-contrast message rather than a hue a third of people can't rely on.
const BORDER_REST = "border-[color:var(--stw-hairline)]";
const BORDER_ERROR = "border-[color:var(--stw-on-surface)]";

function borderClass(hasError: boolean): string {
  return hasError ? BORDER_ERROR : BORDER_REST;
}

export default function RequestAccess() {
  const router = useRouter();
  const plan = typeof router.query.plan === "string" ? router.query.plan : "";

  const [values, setValues] = useState<Values>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [submitError, setSubmitError] = useState("");

  function update<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    // Clear the message the moment the field it describes is edited; leaving it
    // up while someone types the fix reads as the fix not having worked.
    if (key in errors) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {};
    if (!values.name.trim()) next.name = "Tell us who you are.";
    if (!values.email.trim()) {
      next.email = "We need an address to reply to.";
    } else if (!EMAIL_PATTERN.test(values.email.trim())) {
      next.email = "That doesn't look like an email address.";
    }
    if (!values.organization.trim()) {
      next.organization = "Tell us where you work.";
    }
    return next;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError("");

    const found = validate();
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setStatus("submitting");
    try {
      const response = await fetch("/api/public/request-access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name.trim(),
          email: values.email.trim(),
          organization: values.organization.trim(),
          team_size: values.teamSize,
          notes: values.notes.trim(),
          plan: plan,
          company_website: values.companyWebsite,
        }),
      });

      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      setStatus("success");
    } catch {
      setStatus("idle");
      // Never leave someone holding a request that went nowhere: the fallback
      // address is in the message, not just further down the page.
      setSubmitError(
        `We couldn't send that. Email ${REQUEST_ACCESS_EMAIL} and we'll pick it up from there.`,
      );
    }
  }

  const submitting = status === "submitting";

  return (
    <>
      <Head>
        <title>Request access to Steward</title>
        <meta
          name="description"
          content="Steward is invitation only while we onboard teams one at a time. Tell us about your team and we'll be in touch."
        />
        {/* Nothing here belongs in a search index or a share card. */}
        <meta name="robots" content="noindex" />
      </Head>

      <main data-surface="ink" className="stw-surface min-h-screen font-display">
        <LandingNav />

        <div className="mx-auto max-w-[34rem] px-6 pb-24 pt-32 md:pb-32 md:pt-44">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <h1 className="text-4xl font-bold leading-[1.05] tracking-tight md:text-5xl">
              Request access
            </h1>
            <p className="mt-5 text-base leading-relaxed text-[color:var(--stw-muted)]">
              Steward is invitation only while we onboard teams one at a time.
            </p>
          </motion.div>

          {status === "success" ? (
            <div className="mt-12 rounded-[var(--stw-radius-card)] border border-[color:var(--stw-hairline)] bg-[color:var(--stw-float)] p-7">
              <h2 className="text-xl font-bold tracking-tight">Request received</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[color:var(--stw-muted)]">
                Thanks, {values.name.trim()}. We have your request for{" "}
                {values.organization.trim()}
                {plan ? ` on the ${plan} plan` : ""}. A reply comes to{" "}
                <span className="font-mono text-[13px] text-[color:var(--stw-on-surface)]">
                  {values.email.trim()}
                </span>{" "}
                once we have a spot for your team.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-12 space-y-6">
              {plan ? (
                <p className="font-mono text-[13px] text-[color:var(--stw-muted)]">
                  Plan of interest:{" "}
                  <span className="text-[color:var(--stw-on-surface)]">{plan}</span>
                </p>
              ) : null}

              <div>
                <label htmlFor="ra-name" className={LABEL_CLASS}>
                  Name
                </label>
                <input
                  id="ra-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={values.name}
                  onChange={(e) => update("name", e.target.value)}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "ra-name-error" : undefined}
                  className={`${FIELD_CLASS} ${borderClass(Boolean(errors.name))}`}
                />
                {errors.name ? (
                  <p id="ra-name-error" className="mt-2 text-sm">
                    {errors.name}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="ra-email" className={LABEL_CLASS}>
                  Work email
                </label>
                <input
                  id="ra-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={(e) => update("email", e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "ra-email-error" : undefined}
                  className={`${FIELD_CLASS} ${borderClass(Boolean(errors.email))}`}
                />
                {errors.email ? (
                  <p id="ra-email-error" className="mt-2 text-sm">
                    {errors.email}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="ra-organization" className={LABEL_CLASS}>
                  Organization
                </label>
                <input
                  id="ra-organization"
                  name="organization"
                  type="text"
                  autoComplete="organization"
                  value={values.organization}
                  onChange={(e) => update("organization", e.target.value)}
                  aria-invalid={Boolean(errors.organization)}
                  aria-describedby={
                    errors.organization ? "ra-organization-error" : undefined
                  }
                  className={`${FIELD_CLASS} ${borderClass(Boolean(errors.organization))}`}
                />
                {errors.organization ? (
                  <p id="ra-organization-error" className="mt-2 text-sm">
                    {errors.organization}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="ra-team-size" className={LABEL_CLASS}>
                  Team size
                </label>
                <select
                  id="ra-team-size"
                  name="team_size"
                  value={values.teamSize}
                  onChange={(e) => update("teamSize", e.target.value)}
                  className={`${FIELD_CLASS} ${BORDER_REST}`}
                >
                  {TEAM_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ra-notes" className={LABEL_CLASS}>
                  What you would track{" "}
                  <span className="font-normal text-[color:var(--stw-muted)]">
                    (optional)
                  </span>
                </label>
                <textarea
                  id="ra-notes"
                  name="notes"
                  rows={4}
                  value={values.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Cameras, radios, laptops, road cases…"
                  className={`${FIELD_CLASS} ${BORDER_REST} resize-y`}
                />
              </div>

              {/* Honeypot. Off-screen rather than display:none, which some bots
                  check for, and hidden from assistive tech and tab order. */}
              <div aria-hidden="true" className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
                <label htmlFor="ra-company-website">
                  Company website (leave this empty)
                </label>
                <input
                  id="ra-company-website"
                  name="company_website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={values.companyWebsite}
                  onChange={(e) => update("companyWebsite", e.target.value)}
                />
              </div>

              {submitError ? (
                <p role="alert" className="text-sm leading-relaxed">
                  {submitError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="stw-focus inline-flex items-center rounded-full bg-stw-emerald px-7 py-3.5 font-medium text-stw-ink transition-transform active:scale-[0.98] disabled:opacity-60"
              >
                {submitting ? "Sending…" : "Send request"}
              </button>
            </form>
          )}

          <div className="mt-14 border-t border-[color:var(--stw-hairline)] pt-6">
            <p className="text-sm text-[color:var(--stw-muted)]">
              Prefer email?{" "}
              <a
                href={requestAccessMailto(plan || undefined)}
                className="stw-focus font-mono text-[13px] text-[color:var(--stw-on-surface)] transition-colors hover:text-stw-emerald"
              >
                {REQUEST_ACCESS_EMAIL}
              </a>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

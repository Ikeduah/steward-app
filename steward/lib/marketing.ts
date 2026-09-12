// Steward is invitation-only: the public site has no self-serve sign-up, so the
// marketing CTAs route prospects to a request for an invitation instead.
export const REQUEST_ACCESS_EMAIL = "hello@stward.app";

/**
 * Prefilled "request an invitation" mail link. Pass a plan name from the
 * pricing page so the request arrives with the plan the prospect was looking at.
 */
export function requestAccessMailto(plan?: string): string {
    const subject = plan ? `Steward access request — ${plan}` : "Steward access request";
    const body = [
        "Hi Steward team,",
        "",
        "I'd like an invitation to Steward. A few details:",
        "",
        "Name:",
        "Organization:",
        "Team size:",
        "What we'd use Steward for:",
    ].join("\n");

    return `mailto:${REQUEST_ACCESS_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export const REQUEST_ACCESS_MAILTO = requestAccessMailto();

/**
 * The in-app destination for every "request access" call to action.
 *
 * A `mailto:` is dropped silently by any browser with no registered mail
 * handler, which is the default on Windows Chrome and on any machine whose
 * owner lives in webmail. The CTAs therefore point at a page that always
 * opens, and the mailto survives there as a fallback for people who want it.
 */
export function requestAccessHref(plan?: string): string {
    return plan ? `/request-access?plan=${encodeURIComponent(plan)}` : "/request-access";
}

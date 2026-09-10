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

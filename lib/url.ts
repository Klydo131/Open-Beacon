// Turning a URL somebody typed into a link you can click.
//
// Any field where a person enters a web address and the app later renders it as
// an `href` is a stored-XSS hole unless the value is checked. `javascript:alert(1)`
// in an href runs on click, with the full privileges of your origin, for every
// user who sees that record — and it survives a page reload because it is in your
// database. The person who typed it does not have to be an attacker; they only
// have to be one account an attacker got hold of.
//
// The guard is one anchored pattern, and each part of it is load-bearing:
//
//   ^        anchored at the start, or `data:text/html,...#https://x` passes a
//            search-style test that only looks for "https://" somewhere
//   https?   an allowlist of exactly two schemes, never a denylist of bad ones —
//            new dangerous schemes get invented, and a denylist never hears
//   :\/\/    a scheme-relative `//evil.example.com` is not an absolute URL and
//            silently inherits the current page's scheme
//   \S+      something must follow, so a bare "https://" is not a link
//   i        `JaVaScRiPt:` is the same scheme as `javascript:`
//
// Return null rather than throwing, and render the raw text unlinked. A value
// that cannot be trusted as a link is still worth showing the user.
export function safeExternalUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  return /^https?:\/\/\S+$/i.test(trimmed) ? trimmed : null;
}

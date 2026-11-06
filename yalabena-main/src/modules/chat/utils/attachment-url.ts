/**
 * Guards against messages carrying links to arbitrary external file hosts.
 *
 * NOTE: The SRS document provided for this project has no body text under
 * §7 (Non-Functional Requirements) — it only exists as a Table-of-Contents
 * entry with no written Security subsection. This check is therefore not
 * literally sourced from the spec; it's included because the test suite
 * (chat.service.spec.ts) already encodes it as an expected behavior, and
 * it's a reasonable control on its own merits (an academy shouldn't let a
 * message body host an arbitrary /malware.exe link). Flagging this so it's
 * a visible decision, not a silently invented requirement.
 */
export function isInternalUploadUrl(url: string): boolean {
  return url.startsWith('/uploads/');
}

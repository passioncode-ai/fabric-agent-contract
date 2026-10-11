// #region operator-session — docs: docs/specification/service.md#operator-session-lifetime
/**
 * The operator's dashboard session (DEC-0039, Fabric ADR-0144 §8): it ends 12 hours after it was last used,
 * 7 days after the login code was redeemed whatever the use, on logout, and when the descriptor token
 * rotates. A service may shorten either bound, never lengthen it.
 */
export const OPERATOR_SESSION_IDLE_SECONDS = 12 * 60 * 60;
export const OPERATOR_SESSION_MAX_SECONDS = 7 * 24 * 60 * 60;

export interface OperatorSession {
  /** When the login code was redeemed, seconds since the epoch. */
  signedInAt: number;
  /** When the session last carried a request. */
  lastUsedAt: number;
  /** Set on logout. */
  loggedOutAt?: number;
  /** The descriptor token's revision when the session began. */
  tokenRevision: string;
}

export interface SessionPolicy { idleSeconds?: number; maxSeconds?: number }

/** When the session ends, or `null` when it has already ended (logout, rotation). A longer policy is clamped. */
export function operatorSessionExpiresAt(session: OperatorSession, currentTokenRevision: string, policy: SessionPolicy = {}): number | null {
  if (session.loggedOutAt !== undefined || session.tokenRevision !== currentTokenRevision) return null;
  const idle = Math.min(policy.idleSeconds ?? OPERATOR_SESSION_IDLE_SECONDS, OPERATOR_SESSION_IDLE_SECONDS);
  const max = Math.min(policy.maxSeconds ?? OPERATOR_SESSION_MAX_SECONDS, OPERATOR_SESSION_MAX_SECONDS);
  return Math.min(session.lastUsedAt + idle, session.signedInAt + max);
}

export const operatorSessionLive = (session: OperatorSession, now: number, currentTokenRevision: string, policy?: SessionPolicy): boolean => {
  const until = operatorSessionExpiresAt(session, currentTokenRevision, policy);
  return until !== null && now < until;
};
// #endregion operator-session

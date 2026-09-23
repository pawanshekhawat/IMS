/**
 * In-Memory & Persistent Rate Limiting Service
 * Provides brute-force protection, rapid burst throttling,
 * and double-submission protection across all critical store APIs.
 */

interface StoredLockout {
  failedAttempts: number;
  lockedUntil: number;
  firstFailureTime: number;
}

const LOGIN_LOCKOUT_STORAGE_PREFIX = 'gl_rl_lockout_';

class RateLimiterService {
  // In-memory timestamps: Map of action key -> array of timestamps
  private timestamps: Map<string, number[]> = new Map();

  /**
   * General sliding-window rate limit checker.
   * Keeps track of timestamps of past actions within windowMs.
   */
  public checkLimit(
    key: string,
    maxAttempts: number,
    windowMs: number,
    customErrorMessage?: string
  ): { allowed: boolean; retryAfterSeconds: number; error?: string } {
    const now = Date.now();
    const history = (this.timestamps.get(key) || []).filter(t => now - t < windowMs);

    if (history.length >= maxAttempts) {
      const oldestInWindow = history[0];
      const retryAfterSeconds = Math.max(1, Math.ceil((oldestInWindow + windowMs - now) / 1000));
      return {
        allowed: false,
        retryAfterSeconds,
        error: customErrorMessage || `Too many requests. Please wait ${retryAfterSeconds} second(s) before trying again.`,
      };
    }

    history.push(now);
    this.timestamps.set(key, history);

    return { allowed: true, retryAfterSeconds: 0 };
  }

  /**
   * Check login rate limiting for a specific user ID / role (Admin or Staff).
   * Checks both:
   * 1. Persistent lockout from repeated failed attempts (brute-force defense)
   * 2. Rapid burst spamming (e.g. rapid multi-clicking)
   */
  public checkLoginRateLimit(username: string): { allowed: boolean; retryAfterSeconds: number; error?: string } {
    const cleanUser = username.trim().toLowerCase();
    const now = Date.now();

    // 1. Check persistent lockout
    const lockout = this.getStoredLockout(cleanUser);
    if (lockout && lockout.lockedUntil > now) {
      const retryAfterSeconds = Math.max(1, Math.ceil((lockout.lockedUntil - now) / 1000));
      return {
        allowed: false,
        retryAfterSeconds,
        error: `Too many failed login attempts for '${cleanUser}'. Account temporarily locked for security. Please try again in ${retryAfterSeconds} second(s).`,
      };
    }

    // 2. Check rapid burst submissions (max 5 requests per 10 seconds per client)
    const burstCheck = this.checkLimit(
      `login_burst_${cleanUser}`,
      5,
      10000,
      'Too many rapid login attempts. Please wait a few seconds before trying again.'
    );

    if (!burstCheck.allowed) {
      return burstCheck;
    }

    return { allowed: true, retryAfterSeconds: 0 };
  }

  /**
   * Record a failed login attempt for a user ID.
   * If failed attempts reach threshold (5 attempts within 5 minutes),
   * locks out the account for 60 seconds (or 180 seconds if repeated).
   */
  public recordFailedLogin(username: string): {
    locked: boolean;
    retryAfterSeconds: number;
    remainingAttempts: number;
    error: string;
  } {
    const cleanUser = username.trim().toLowerCase();
    const now = Date.now();
    const WINDOW_MS = 5 * 60 * 1000; // 5 minute window
    const MAX_FAILURES = 5;

    let lockout = this.getStoredLockout(cleanUser);

    if (!lockout || now - lockout.firstFailureTime > WINDOW_MS) {
      // First failure in a fresh window
      lockout = {
        failedAttempts: 1,
        firstFailureTime: now,
        lockedUntil: 0,
      };
    } else {
      lockout.failedAttempts += 1;
    }

    if (lockout.failedAttempts >= MAX_FAILURES) {
      // Progressive lockout: 60s for first lockout, 180s for subsequent
      const lockoutDurationMs = lockout.failedAttempts > MAX_FAILURES ? 180 * 1000 : 60 * 1000;
      lockout.lockedUntil = now + lockoutDurationMs;
      this.saveStoredLockout(cleanUser, lockout);

      const retryAfterSeconds = Math.ceil(lockoutDurationMs / 1000);
      return {
        locked: true,
        retryAfterSeconds,
        remainingAttempts: 0,
        error: `Too many failed login attempts for '${cleanUser}'. Account temporarily locked for ${retryAfterSeconds} seconds.`,
      };
    }

    this.saveStoredLockout(cleanUser, lockout);
    const remaining = MAX_FAILURES - lockout.failedAttempts;

    return {
      locked: false,
      retryAfterSeconds: 0,
      remainingAttempts: remaining,
      error: `Incorrect password. You have ${remaining} attempt(s) remaining before a temporary security lockout.`,
    };
  }

  /**
   * Clear failed login history upon successful authentication.
   */
  public recordSuccessfulLogin(username: string): void {
    const cleanUser = username.trim().toLowerCase();
    this.removeStoredLockout(cleanUser);
    this.timestamps.delete(`login_burst_${cleanUser}`);
  }

  /**
   * Debounce protection for single-click submissions (e.g., invoice generation, purchases)
   * Ensures at least minIntervalMs has passed since the last submission.
   */
  public checkMinInterval(key: string, minIntervalMs: number, actionName: string): void {
    const now = Date.now();
    const history = this.timestamps.get(key) || [];
    const lastTime = history.length > 0 ? history[history.length - 1] : 0;

    if (now - lastTime < minIntervalMs) {
      throw new Error(`A ${actionName} is currently being processed. Please wait a moment.`);
    }

    history.push(now);
    this.timestamps.set(key, history);
  }

  /**
   * Rate limit helper for CRUD and Admin panel operations.
   * Throws an Error with a user-friendly message if the limit is exceeded.
   */
  public enforceLimit(
    key: string,
    maxAttempts: number,
    windowMs: number,
    actionDescription: string
  ): void {
    const res = this.checkLimit(key, maxAttempts, windowMs);
    if (!res.allowed) {
      throw new Error(
        `Rate limit exceeded: Please wait ${res.retryAfterSeconds} second(s) before attempting to ${actionDescription} again.`
      );
    }
  }

  // --- LocalStorage Persistence Helpers ---
  private getStoredLockout(username: string): StoredLockout | null {
    try {
      const data = localStorage.getItem(`${LOGIN_LOCKOUT_STORAGE_PREFIX}${username}`);
      if (!data) return null;
      return JSON.parse(data) as StoredLockout;
    } catch {
      return null;
    }
  }

  private saveStoredLockout(username: string, lockout: StoredLockout): void {
    try {
      localStorage.setItem(`${LOGIN_LOCKOUT_STORAGE_PREFIX}${username}`, JSON.stringify(lockout));
    } catch {
      // ignore
    }
  }

  private removeStoredLockout(username: string): void {
    try {
      localStorage.removeItem(`${LOGIN_LOCKOUT_STORAGE_PREFIX}${username}`);
    } catch {
      // ignore
    }
  }
}

export const rateLimiter = new RateLimiterService();

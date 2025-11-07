type FixedWindowState = {
  count: number;
  windowStart: number;
};

type FixedWindowResult =
  | { success: true; remaining: number }
  | { success: false; retryAfterSeconds: number };

type FixedWindowLimiter = (identifier: string) => FixedWindowResult;

const createFixedWindowLimiter = ({
  max,
  windowMs,
  label,
}: {
  max: number;
  windowMs: number;
  label: string;
}): FixedWindowLimiter => {
  const store = new Map<string, FixedWindowState>();

  return (identifier: string) => {
    const now = Date.now();
    const entry = store.get(identifier);

    if (!entry || now - entry.windowStart >= windowMs) {
      store.set(identifier, { count: 1, windowStart: now });
      return { success: true, remaining: Math.max(max - 1, 0) };
    }

    if (entry.count >= max) {
      const retryAfter = Math.ceil(
        (entry.windowStart + windowMs - now) / 1000
      );
      if (retryAfter <= 0) {
        store.set(identifier, { count: 1, windowStart: now });
        return { success: true, remaining: Math.max(max - 1, 0) };
      }
      return { success: false, retryAfterSeconds: retryAfter };
    }

    entry.count += 1;

    // Opportunistic cleanup to keep the map from growing forever.
    if (store.size > max * 8) {
      store.forEach((value, key) => {
        if (now - value.windowStart > windowMs * 2) {
          store.delete(key);
        }
      });
    }

    return { success: true, remaining: Math.max(max - entry.count, 0) };
  };
};

type RateLimiterConfig = {
  shortWindowMs: number;
  shortWindowLimit: number;
  longWindowMs: number;
  longWindowLimit: number;
};

type RateLimitVerdict =
  | { success: true; remainingShort: number; remainingLong: number }
  | { success: false; retryAfterSeconds: number };

type CompositeLimiter = (identifier: string) => RateLimitVerdict;

export const createCompositeRateLimiter = ({
  shortWindowLimit,
  shortWindowMs,
  longWindowLimit,
  longWindowMs,
}: RateLimiterConfig): CompositeLimiter => {
  const shortLimiter = createFixedWindowLimiter({
    max: shortWindowLimit,
    windowMs: shortWindowMs,
    label: "short",
  });
  const longLimiter = createFixedWindowLimiter({
    max: longWindowLimit,
    windowMs: longWindowMs,
    label: "long",
  });

  return (identifier: string) => {
    const shortVerdict = shortLimiter(identifier);
    if (!shortVerdict.success) {
      return shortVerdict;
    }

    const longVerdict = longLimiter(identifier);
    if (!longVerdict.success) {
      return longVerdict;
    }

    return {
      success: true,
      remainingShort: shortVerdict.remaining,
      remainingLong: longVerdict.remaining,
    };
  };
};

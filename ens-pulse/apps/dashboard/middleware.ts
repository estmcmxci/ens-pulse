import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiter (use Redis in production for distributed environments)
const rateLimit = new Map<string, { count: number; resetTime: number }>();

// Configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 100; // 100 requests per minute per IP

function getClientIdentifier(request: NextRequest): string {
  // Try to get the real IP from various headers
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfConnectingIp = request.headers.get("cf-connecting-ip");

  // Use the first IP from x-forwarded-for, or fall back to other headers
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }
  if (cfConnectingIp) {
    return cfConnectingIp;
  }
  if (realIp) {
    return realIp;
  }

  // Fallback to a generic identifier (should not happen in production)
  return "unknown";
}

function isRateLimited(identifier: string): { limited: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimit.get(identifier);

  // Clean up expired entries periodically
  if (rateLimit.size > 10000) {
    for (const [key, value] of rateLimit) {
      if (value.resetTime < now) {
        rateLimit.delete(key);
      }
    }
  }

  if (!record || record.resetTime < now) {
    // Create new record
    rateLimit.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return {
      limited: false,
      remaining: MAX_REQUESTS_PER_WINDOW - 1,
      resetIn: RATE_LIMIT_WINDOW_MS,
    };
  }

  // Increment count
  record.count++;

  if (record.count > MAX_REQUESTS_PER_WINDOW) {
    return {
      limited: true,
      remaining: 0,
      resetIn: record.resetTime - now,
    };
  }

  return {
    limited: false,
    remaining: MAX_REQUESTS_PER_WINDOW - record.count,
    resetIn: record.resetTime - now,
  };
}

export function middleware(request: NextRequest) {
  // Only rate limit API routes
  if (!request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const identifier = getClientIdentifier(request);
  const { limited, remaining, resetIn } = isRateLimited(identifier);

  if (limited) {
    return NextResponse.json(
      {
        success: false,
        error: "Too many requests. Please try again later.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(resetIn / 1000)),
          "X-RateLimit-Limit": String(MAX_REQUESTS_PER_WINDOW),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(resetIn / 1000)),
        },
      }
    );
  }

  // Add rate limit headers to successful responses
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(MAX_REQUESTS_PER_WINDOW));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(Math.ceil(resetIn / 1000)));

  return response;
}

export const config = {
  matcher: "/api/:path*",
};

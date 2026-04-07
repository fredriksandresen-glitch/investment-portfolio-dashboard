# Specification

## Summary
**Goal:** Stop continuous UI flicker/lag for authenticated users by removing any silent React Query invalidation/refetch loop tied to Internet Identity/actor initialization, and keep portfolio display stable during background updates.

**Planned changes:**
- Identify and eliminate any actor/identity initialization behavior that repeatedly invalidates/refetches portfolio-related and other non-actor queries while logged in (ensure stable query keys and correct `enabled`/timing so refetching occurs only as intended).
- Stabilize portfolio rendering during background refetches by keeping and displaying the last known successful computed values (avoid reverting to fallback/default values mid-session when a refetch is in-flight or fails).
- Add lightweight diagnostics that emit a single, clearly identifiable reason when portfolio-related queries are invalidated/refetched due to actor/auth readiness, without continuous spam during normal operation.

**User-visible outcome:** When logged in, the dashboard no longer continuously blinks between fallback and live values; portfolio totals/rows remain steady during background updates and only change when new data successfully arrives.

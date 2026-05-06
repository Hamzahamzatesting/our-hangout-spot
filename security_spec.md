# Security Specification for Echo

## Data Invariants
1. A session must have a host who is a verified user.
2. Only members of a session can post vibes to it.
3. Users cannot modify the `result` field of a session (it's system-generated via AI integration).
4. Users cannot change the `hostId` after creation.
5. Users can only modify their own vibe inputs.

## The Dirty Dozen Payloads (Rejection Targets)

1. **Host Spoofing:** Create a session with `hostId` of another user.
2. **Anonymous Creation:** Create a session without being logged in.
3. **Session Hijack:** Update a session's `hostId` to point to yourself.
4. **Result Poisoning:** Manually writing to the `result` field as a non-admin user.
5. **Vibe Infiltration:** Posting a `vibe` to a session you aren't a member of.
6. **Vibe Identity Theft:** Posting a `vibe` with a `userId` that isn't yours.
7. **Ghost Edit:** Editing someone else's vibe content.
8. **Massive Payload:** Sending 1MB of garbage string into the `title` field.
9. **Status Fast-Tracking:** Forcefully setting a session status to `revealed` without going through `deciding`.
10. **Member Leak:** Reading a session document without being a member.
11. **Profile Takeover:** Updating another user's profile metadata.
12. **Id Poisoning:** Using a malicious string like `../../etc/passwd` as a session ID.

## Test Runner Logic
The following rules enforce these constraints.

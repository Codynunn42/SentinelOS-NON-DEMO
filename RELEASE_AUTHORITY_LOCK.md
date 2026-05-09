SentinelOS Update: Authority Lock Enforced

- All execution now requires a signed Sentinel passport (HMAC)
- Replay, stale, tampered, and wrong-scope commands are blocked
- Repo Control Layer classifies failures and enforces next action
- Authority Panel added to /proof for live visibility

Result:
No action executes without validation and approval.
No failure results in uncontrolled behavior.

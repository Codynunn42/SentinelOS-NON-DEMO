# EV-RUN-002 Secret-Exclusion Protocol

## Prohibited Evidence

The evidence packet must not retain:

- API key or credential values;
- `Authorization`, `Proxy-Authorization`, `Cookie`, or `Set-Cookie` values;
- bearer, session, refresh, or access tokens;
- environment-variable values;
- private keys, certificates containing private keys, passwords, or connection strings;
- unredacted request headers or diagnostic output containing authentication material.

Field names may be recorded when needed to explain configuration, but their values must be omitted or replaced with a fixed redaction marker before an artifact enters this directory.

## Required Checks

| Sequence | Check | Owner | Current state |
| --- | --- | --- | --- |
| 1 | Confirm capture tooling omits authentication values before invocation | Runtime operator | Pending; execution unauthorized |
| 2 | Inspect request, response, and transport artifacts before retention | Evidence custodian | Pending; no runtime artifacts exist |
| 3 | Scan retained artifacts for credential patterns and high-risk headers | Evidence custodian | Pending; no runtime artifacts exist |
| 4 | Independently repeat the secret scan before hashing | Independent reviewer | Pending; reviewer not assigned |
| 5 | Record only sanitized artifact hashes in `integrity/SHA256SUMS` | Evidence custodian | Pending; no artifacts exist |

## Preparation Check

At packet preparation:

- no request or response artifact exists;
- no authentication value was copied into the packet;
- the target server URL remains null because hostname approval is held;
- metadata records zero invocations and no execution authority; and
- execution-time checks remain `pending`, not `passed`.

## Failure Rule

If a possible secret appears in a captured artifact, stop retention and review. Do not commit, hash, transmit, or present that artifact until the value is removed, the source is controlled, and the sanitized replacement is inspected again.

# Sentinel audit logger

`auditLogger.log()` fsyncs each event to a local outbox before it acknowledges
the event to its caller. The outbox is stored at `SENTINEL_AUDIT_SPOOL_DIR`, or
under `SENTINEL_DATA_DIR/audit-spool` when that setting is present; otherwise it
uses `.data/audit-spool` in the current working directory. Production
deployments must place this directory on persistent storage. The Docker Compose
deployment mounts `SENTINEL_DATA_DIR` on the `sentinel_data` volume.

Entries are normalized once using JSON serialization before hashing. This
matches persisted JSON behavior: undefined object properties are omitted,
undefined array elements become `null`, Dates become ISO strings, and
non-finite numbers (`NaN`, `Infinity`, and `-Infinity`) become `null`.
Circular references and BigInt values are rejected before the outbox sequence
or pending records are changed.

The outbox has one writer lock, a 100 MiB default pending-size limit
(`SENTINEL_AUDIT_SPOOL_MAX_BYTES`), and a hash-anchored, ordered sequence of
entry files. PostgreSQL writes use the event ID as an idempotency key. A
checkpoint is fsynced after the database write and before deleting the spool
entry. A crash before checkpointing therefore replays the entry. PostgreSQL
suppresses a duplicate event ID; the logger verifies the stored chain sequence
and hashes and rejects a conflicting event. Startup retries the outbox before
the API begins listening.

If PostgreSQL is unavailable, entries remain on disk and `getPersistenceStatus()`
reports their count, byte size, IDs, and configured limit. Calls to
`reconcilePending()` retry entries in order and append a
`system.audit.persist_reconciled` event after recovery. The API logs a pending
recovery result and last persistence error at startup. When the spool reaches
its limit, is corrupt, or cannot be safely reconciled, logging fails explicitly;
do not delete or edit spool files to clear the condition. Preserve the volume
and spool, restore PostgreSQL, and the logger retries with a bounded exponential
delay (five seconds initially, capped at one minute). A database mode change on
an existing spool is rejected and requires operator-led recovery rather than
silently reattaching the chain.

`verifyChain()` verifies the loaded in-memory chain from its persisted database
anchor, including previous-hash links. Existing `audit_logs` rows are migrated
by adding nullable event IDs and chain sequence values; legacy IDs are copied
from their JSON result where available. No database rows are rewritten during
replay.

Startup may advance the checkpoint over a retained prefix already present in
PostgreSQL after a lost acknowledgement. Before advancing, it compares every
prefix event's stored identity, sequence, tenant, command, payload, result, actor,
audit timestamp, and hashes using the same validation as duplicate replay.
It durably publishes the recovered checkpoint before deleting any prefix files.
If publication fails, those files remain available for the next recovery attempt.
If deletion is interrupted, the published checkpoint permits cleanup on restart.
`getAll()` and the `checked` count cover only the loaded in-memory chain; database
prefix inventory must be checked separately. Neither API re-verifies the entire
database-backed history.

The disk outbox survives process/container restarts only when its directory is
on storage that survives those restarts. It is not replicated or protected
against loss of the host or volume, filesystem corruption, or simultaneous
mounting by multiple machines. It is a bounded recovery queue, not a
replacement for backups or multi-host durable messaging.

The writer lock uses the operating system's `flock` utility and kernel advisory
locks. The spool filesystem must provide exclusive `flock(2)` semantics across
all processes that can access the directory; the utility and lock support must
be available or logger initialization fails closed. Keep the lock file in place:
the kernel lock, not file contents, identifies the current writer. The runtime
helper releases the lock when its owning process exits, including an abrupt exit.

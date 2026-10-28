# Sentinel audit logger

`auditLogger.log()` adds each event to the in-memory hash chain before attempting
database persistence. If persistence fails, it adds a `system.audit.persist_failed`
event to that same chain and queues both entries for ordered reconciliation.
`verifyChain()` verifies the complete in-memory chain, including the previous-hash
link. `getPersistenceStatus()` exposes whether entries remain pending, and
`reconcilePending()` retries them in order before recording a
`system.audit.persist_reconciled` event.

Writes are serialized. While an earlier persistence failure remains unresolved,
later events cannot be persisted ahead of the pending events. The pending queue
is process-local; a process restart before reconciliation can lose events that
were not persisted. This logger does not provide a durable outbox.

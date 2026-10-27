# Executive reporting tooling

The generator reads only explicitly configured inputs. It does not discover
dated operating documents, mailboxes, customers, personnel, cloud resources, or
register attachments. Operational evidence and configuration belong in private
storage outside the repository. No workbook or dated report is needed in Git.

## Synthetic smoke test

Requirements: Node.js with `node:test` and `fs.cpSync`, Git, and Python 3 for XLSX.
Only built-in Node modules and Python's standard library are used.

```sh
npm run test:executive-template-orchestration
node scripts/run-governance-flow.js \
  --config=tests/fixtures/executive-template/synthetic-config.json \
  --date=2031-02-03 \
  --output-dir=/tmp/executive-synthetic-reports \
  --skip-pre-escalation --skip-ledger
```

All fixture facts are invented. The explicit date makes this smoke test
repeatable; real builds should select the intended observation/report date.
The existing packet gate receives the external packet through `--file`.
The orchestration suite also runs through `pnpm test`, including in PR CI.

### XLSX dates

The reader converts numeric cells with built-in calendar-date formats or custom
formats containing calendar-date tokens to ISO dates. It respects the workbook's
`date1904` setting (1900 system by default). Fractional days retain their time as
an ISO datetime, without assigning a timezone; report freshness and deadlines use
the calendar date. Text dates remain unchanged. Ordinary numbers, clock-only
formats, elapsed-time formats, and quoted/escaped date-like literals are not
converted. Text dates used for freshness should start with `YYYY-MM-DD`.

Negative, nonfinite, out-of-range date serials and serials in the fictitious
1900-02-29 day (60 through less than 61, in the 1900 system only) fail generation
before either report is written. They are not silently changed to another date.
Conversion reflects cell formatting; it does not independently verify the
underlying recorded date, refresh an old row, or authorize a status change.

## Private configuration

Use the [synthetic configuration](../../tests/fixtures/executive-template/synthetic-config.json)
as a schema example, not as an operational record. Configuration version is `1`.

- `sources`: keyed descriptors with `path`, `label`, and explicit ISO `date`.
  Paths resolve relative to the configuration file. Source dates are never
  inferred from filenames or file modification times. Missing configured
  sources are explicitly marked MISSING; unreadable sources fail the build.
- `register`: optional XLSX or JSON path, relative to configuration. JSON uses
  a `sheets` object mapping sheet names to arrays of records. The
  [synthetic register](../../tests/fixtures/executive-template/synthetic-register.json)
  demonstrates the supported field names for Portfolio, Actions, Decisions,
  Evidence, Risks, and VR Workforce. Rows are reproduced, not modified.
  Duplicate nonempty IDs in any of these sheets are rejected before either
  report is written, even if the duplicate rows agree or one is closed. IDs
  are compared after trimming surrounding whitespace. An absent sheet is
  labeled UNVERIFIED in source quality and its report section; it is not an
  empty sheet. A present empty sheet reports no matching register records.
  Checks depending on absent sheets are unverified, not evidence of agreement.
  `--register=<path>` overrides configuration, relative to the working directory.
- `dispositionSources`: source IDs used for narrative assertions. Only the
  latest configured dated set is used, including missing sources. Older sources
  are never substituted silently.
- `dispositions`: work-item `id` and `patterns` (`value`, `pattern`).
  Patterns are case-insensitive regular expressions applied to source text.
  Optional `registerPatterns` (`status`, `field`, `pattern`, `value`) interpret a
  more specific register disposition only when the row's status matches
  `status` and the specified field matches the pattern. This must not mask a
  later status change; the register is never modified.
- `verdict`: optional `patterns` for a separately attributed runtime verdict.
- `maximumAgeDays`: nonnegative integer; default seven. Future assertions are
  unverified. Old assertions and rows remain explicitly stale.
- `sections`: optional `queue`, `personnel`, and `historicalQueue` source IDs.
  Source content is reproduced verbatim inside an attributed, freshness-labeled
  section. Stale text remains historical evidence, not today's verified status.
- `summaries`: optional entries containing `source`, `pattern`, and `text`.
  An attributed summary is emitted only if a fresh, present source matches its
  assertion. Otherwise it is explicitly withheld. Write summaries that preserve
  the source's evidence limits; a regex match does not independently verify truth.
- `checks`: optional register/source discrepancy checks, each with `message`,
  `register`, `source`, and optional `resolution`. Source/resolution assertions
  use `source` and `pattern`; only fresh evidence can establish or resolve the
  discrepancy. Register predicates contain `sheet`, `fields`, and `pattern`,
  optionally `id` plus `idField`. A matching unresolved check emits CONFLICT.
- `controls`: optional controlling-decision checks with `register` predicate,
  `disposition` ID, `requiredValue`, and `message`. A register value inconsistent
  with a matched controlling decision emits CONFLICT even without narrative
  support. This reports a conflict; it cannot override the controlling record.
- `followups`: optional `source`, `pattern`, `text`, and `register` predicate.
  Fresh source assertions are cross-checked against register rows. Missing
  matches are explicitly not a register assignment or verified completion.
- `outputDir`: required external directory unless `--output-dir` is provided.
  The override resolves relative to the working directory. Output is rejected
  inside registered worktrees or another Git repository, including symlinked
  locations. Both reports live together, with a relative link between them.

The generator validates both templates and the inputs before writing either
report. New output directories use mode `0700`, and new report files use
`0600` subject to the host filesystem. Existing output permissions are not
changed. Choose a private directory, not a shared temporary folder in production.
Do not point report filenames at existing sensitive files.

The external report provenance uses source labels, dates, file basenames, and
SHA-256 hashes, not local attachment paths. **This is not a redaction tool**:
source content, register fields/links, labels, and configured summaries may be
private. Generated reports remain private unless separately reviewed for release.
Relative links inside raw source content retain their original spelling;
moving reports does not make referenced evidence publicly available.

## Reporting-only boundary

This wrapper intentionally requires `--skip-pre-escalation --skip-ledger`.
The legacy escalation and evidence-ledger writers target repository paths and
are not invoked by the private reporting flow. Use separately approved tooling
for those operations. No report grants staging, commit, runtime, external-contact,
access-change, reviewer, or action-closure authority.

Disposition freshness/conflicts and packet structure are checked separately.
Passing the packet gate establishes neither runtime acceptance nor privacy
clearance. Receipt signing and checksum-ledger remediation are separate reviews.

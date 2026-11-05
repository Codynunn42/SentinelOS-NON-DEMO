# Executive Template workflow authorization pilot

The first pilot is a read-only GitHub Actions workflow for reviewing the checks
on PR #48. It demonstrates how a workflow can be tied to the exact reviewed PR
head rather than the branch currently open in a Codespace.

## Running the pilot

After this workflow is reviewed and merged to `main`:

1. Open **Actions** and choose **Executive Template PR check review**.
2. Select `main` as **Use workflow from**.
3. Copy the full head commit SHA from PR #48 into **expected_head_sha**.
4. Choose `current-pr-checks`.
5. Check **confirm_read_only**, then select **Run workflow**.

The workflow reads PR #48 metadata and the GitHub check-run inventory for its
head SHA. It stops if the PR is closed, no longer targets `main`, uses a fork
head, the head SHA differs from the SHA entered for review, or it cannot fetch
the complete check set. It rereads the PR immediately before publishing and
revalidates its open state, base, repository and head. A mismatch or failed
final read stops the job before either outputs or the summary are written.
Normal PR CI remains responsible for running tests.

## Authorization boundary

Pressing **Run workflow** authorizes only this bounded check review. The job
has `checks: read` and `pull-requests: read` permissions. It does not check out
or execute PR code, modify the PR or repository, commit, push, merge, deploy,
contact anyone, or alter governance status. The workflow records its target
SHA, workflow definition SHA (`github.workflow_sha`) and check inventory in
the Actions run summary. Both SHAs are also step outputs (`head_sha` and
`workflow_sha`). Check statuses do not constitute review acceptance.

This pilot reports existing checks; it does not apply suggested fixes or
rerun tests. Any future workflow that executes code or writes files or updates
a branch must be a separate, reviewed workflow with an explicit target, exact
reviewed diff, and appropriate authorization. A changed target SHA requires
review before rerunning.

## Snapshot and workflow provenance

The final read narrows the window in which the target can change during
collection. It does not lock the PR: it can change after that read. Recheck
the head and applicable authorization immediately before any later action.
Check statuses can also change after collection; this inventory is a snapshot,
not a claim of fresh test execution or a requirement that every check passed.

Selecting `main` establishes the selected ref only. It does not establish
that the workflow definition was independently reviewed or that branch
protections are configured and enforced. The recorded workflow SHA identifies
the definition used by the run; review evidence and branch protection must
be verified separately before an authorized dispatch.

## Evidence scope and regression validation

The previously cited 35 orchestration tests at PR #48 commit
`9a09d1ad766006c2f31070176ad313ba01b7578f` are historical evidence. They do
not establish validation of its later head
`c737e87be6d1f284a644622cee33edecfc227be5` or any future head. Existing
check inventories for a head do not establish that a named suite ran; inspect
the corresponding run and job logs to establish its tested commit and scope.

Run the retained workflow regression tests locally with:

```sh
node --test tests/executive-template-pr-validation.test.cjs
```

These execute the workflow's actual embedded shell and Node guards against
mocked API responses with temporary outputs and no network access. They do
not dispatch a hosted workflow or execute PR #48's code. No merge, deployment,
runtime acceptance or governance change is established by these tests.

# Executive Template workflow authorization pilot

The first pilot is a read-only GitHub Actions workflow for validating PR #48.
It demonstrates how a workflow can be tied to the exact reviewed PR head rather
than the branch currently open in a Codespace.

## Running the pilot

After this workflow is reviewed and merged to `main`:

1. Open **Actions** and choose **Executive Template PR validation**.
2. Select `main` as **Use workflow from**.
3. Copy the full head commit SHA from PR #48 into **expected_head_sha**.
4. Choose `focused-orchestration-suite`.
5. Check **confirm_read_only**, then select **Run workflow**.

The workflow reads PR #48 metadata and stops if the PR is closed, no longer
targets `main`, uses a fork head, or its head SHA differs from the SHA entered
for review. It checks out that exact commit and runs
`npm run test:executive-template-orchestration`.

## Authorization boundary

Pressing **Run workflow** authorizes only this bounded validation run. The job
has `contents: read` and `pull-requests: read` permissions. It does not modify
the PR or repository, and it does not commit, push, merge, deploy, contact
anyone, or alter governance status. It does not run code from a fork. The
workflow records its target SHA and test outcome in the Actions run summary.

This pilot validates a proposed change; it does not apply suggested fixes.
Any future workflow that writes files or updates a branch must be a separate,
reviewed workflow with an explicit target, exact reviewed diff, and narrower
authorization. A changed target SHA requires review before rerunning.

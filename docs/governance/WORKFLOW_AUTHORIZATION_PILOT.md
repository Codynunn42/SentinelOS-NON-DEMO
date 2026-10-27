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
the complete check set. Normal PR CI remains responsible for running tests.

## Authorization boundary

Pressing **Run workflow** authorizes only this bounded check review. The job
has `checks: read` and `pull-requests: read` permissions. It does not check out
or execute PR code, modify the PR or repository, commit, push, merge, deploy,
contact anyone, or alter governance status. The workflow records its target
SHA and check inventory in the Actions run summary. Check statuses do not
constitute review acceptance.

This pilot reports existing checks; it does not apply suggested fixes or
rerun tests. Any future workflow that executes code or writes files or updates
a branch must be a separate, reviewed workflow with an explicit target, exact
reviewed diff, and appropriate authorization. A changed target SHA requires
review before rerunning.

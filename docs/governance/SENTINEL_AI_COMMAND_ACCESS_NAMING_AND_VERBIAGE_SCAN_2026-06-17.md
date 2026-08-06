# Sentinel AI Command Access Naming And Verbiage Scan - 2026-06-17

**COMM:** Sentinel AI by Cody Nunn | Nunn Cloud  
**Mode:** read-only naming and command-access discovery  
**State:** corrected starting vocabulary identified  
**Authority Created:** false

## Evidence First

```yaml
repository:
  name: sentinelos-non-demo
  product_surface: SentinelOS_NON_DEMO
  implemented_runtime_process: Sentinel_API
  runtime_entrypoint: node apps/api/server.js
  npm_start: npm start
  default_local_port: 3000
  container_port: 80
  primary_command_route: POST /v1/command
  health_route: GET /health
  trace_routes:
    - GET /v1/traces
    - GET /v1/traces/:correlationId
docker:
  Dockerfile_present: true
  compose_file_present: false
  Docker_daemon_running_at_scan: false
  running_container_names_verified: false
```

## Correct Naming

| Name | Supported Meaning | Usage |
| --- | --- | --- |
| Sentinel AI | governance, evidence, and communications identity | use for board commands and documented processing requests |
| SentinelOS NON-DEMO | current repository and product operating surface | use for repository, implementation, and deployment references |
| Sentinel API | implemented Node.js runtime started by `npm start` or the Docker image | use for HTTP health, command, audit, and trace access |
| Nexus | internal architecture/concept label; no verified runtime or container | do not describe as running or directly accessible |
| Vault | internal secure-evidence concept label; no verified retrieval connector | do not describe as a running retrieval container |
| Bhindi | not identified in the current repository | do not describe as an implemented service or CLI |
| `NAV-TASKS` | proposed non-sensitive proof fixture only | do not describe as an existing capsule |

## Unsupported Submitted Verbiage

The following statements and examples are not supported by current evidence:

- “Sentinel/Nexus is already running in Docker.”
- containers named `sentinel`, `nexus`, `bhindi`, or `vault`;
- `docker compose up`, `docker compose ps`, or `docker compose exec` for this
  checkout, because no Compose file exists;
- CLI commands `nav.sync`, `vault.retrieve`, `sentinel.status`, or
  `bhindi.run`;
- entering a Nexus, Bhindi, or Vault container;
- describing VS Code terminal access as command authority.

Opening the repository in VS Code provides repository and terminal access. It
does not establish runtime authentication, command authorization, container
availability, connector access, or Vault retrieval authority.

## Correct Starting Workflow

### Repository Access

```bash
code /Users/codynunn/SentinelOS/SentinelOS-NON-DEMO/SentinelOS-NON-DEMO
```

### Local Runtime Discovery

```bash
npm start
curl http://localhost:3000/health
```

Starting the runtime is separately gated and was not performed by this scan.

### Docker Image Discovery

This repository contains one Dockerfile for the Sentinel API image. It does not
define named Nexus, Bhindi, or Vault services.

```bash
docker build -t sentinelos-non-demo .
docker run --rm -p 8080:80 sentinelos-non-demo
curl http://localhost:8080/health
```

Building or running the image requires separate execution authority and was not
performed by this scan.

### Supported Command Model

SentinelOS commands are structured envelopes submitted to the governed HTTP
route, not shell commands installed as `sentinel.status` or `vault.retrieve`.

```text
POST /v1/command
Content-Type: application/json
x-api-key: <authorized-key>

{
  "tenant": "<authorized-tenant>",
  "command": "<registered-command>",
  "payload": {},
  "metadata": {
    "source": "sentinel",
    "actor": "<authorized-actor>",
    "role": "<authorized-role>"
  }
}
```

Examples of currently evidenced registered command surfaces include:

- `docking.evaluate`
- `repo.control.workflow.diagnose`
- `repo.control.workflow.retry`
- `support.ticket.create`
- `support.refund.request`

Exact authorization still depends on tenant, key, role, scope, policy, and
approval state.

## Corrected Verbiage

Use:

> Open the SentinelOS NON-DEMO repository in VS Code. Verify whether the
> Sentinel API runtime is available locally or through a separately built
> Docker image. Submit only registered command envelopes through the governed
> `/v1/command` route using an authorized identity. Nexus and Vault remain
> internal architecture labels, and Bhindi remains unverified, until exact
> adapters and command contracts are implemented and approved.

Do not use:

> Enter the Nexus container and run `vault.retrieve NAV-TASKS`.

## Processing Result

```yaml
naming_scan_result:
  Sentinel_AI_identity: supported
  SentinelOS_NON_DEMO_repository: supported
  Sentinel_API_runtime: supported
  Dockerfile: supported
  Docker_Compose_environment: not_identified
  Docker_daemon_running: false
  Nexus_runtime: not_identified
  Bhindi_runtime: not_identified
  Vault_retrieval_runtime: not_identified
  submitted_example_CLI_commands: not_identified
  next_gate: REVIEW_CORRECTED_SENTINEL_AI_COMMAND_ACCESS_VERBIAGE
  runtime_start_authority: false
  Docker_execution_authority: false
  command_execution_authority: false
  connector_execution_authority: false
```

## Non-Authorization

This scan does not authorize starting the runtime, building or running a Docker
image, entering containers, issuing commands, retrieving Vault records,
connector execution, staging, commit, push, deployment, or external sharing.

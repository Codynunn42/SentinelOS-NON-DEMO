#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3000}"
API_KEY="${API_KEY:-${SENTINEL_API_KEY:-}}"
TENANT="${TENANT:-ownerfi}"

if [[ -z "${API_KEY}" ]]; then
  echo "API_KEY or SENTINEL_API_KEY is required"
  exit 1
fi

submit_response="$(curl -s -X POST "${BASE_URL}/v1/command" \
  -H "content-type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d '{
    "tenant":"'"${TENANT}"'",
    "command":"application.submit",
    "payload":{
      "name":"John Doe",
      "vehicle":"2019 Honda Civic",
      "amount":18000,
      "creditScore":680
    },
    "metadata":{
      "actor":"demo.operator",
      "role":"approver"
    }
  }')"

application_id="$(printf '%s' "${submit_response}" | node -e 'let data="";process.stdin.on("data",d=>data+=d);process.stdin.on("end",()=>{const json=JSON.parse(data);process.stdout.write(json.applicationId || json.result.applicationId || "");});')"

evaluate_response="$(curl -s -X POST "${BASE_URL}/v1/command" \
  -H "content-type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d "{
    \"tenant\":\"${TENANT}\",
    \"command\":\"application.evaluate\",
    \"payload\":{
      \"applicationId\":\"${application_id}\"
    },
    \"metadata\":{
      \"actor\":\"demo.operator\",
      \"role\":\"approver\"
    }
  }")"

deal_response="$(curl -s -X POST "${BASE_URL}/v1/command" \
  -H "content-type: application/json" \
  -H "x-api-key: ${API_KEY}" \
  -d "{
    \"tenant\":\"${TENANT}\",
    \"command\":\"deal.execute\",
    \"payload\":{
      \"applicationId\":\"${application_id}\"
    },
    \"metadata\":{
      \"actor\":\"demo.operator\",
      \"role\":\"approver\"
    }
  }")"

audit_response="$(curl -s "${BASE_URL}/v1/audit/${application_id}?tenant=${TENANT}" \
  -H "x-api-key: ${API_KEY}")"

printf '%s\n' "{"
printf '  "submit": %s,\n' "${submit_response}"
printf '  "evaluate": %s,\n' "${evaluate_response}"
printf '  "deal": %s,\n' "${deal_response}"
printf '  "audit": %s\n' "${audit_response}"
printf '%s\n' "}"

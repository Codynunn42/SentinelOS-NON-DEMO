#!/usr/bin/env python3
"""
Send JSON payload to Azure Log Analytics (Sentinel) via HTTP Data Collector API.

Usage:
  python3 send_to_log_analytics.py --workspace-id <id> --shared-key <key> --log-type MyTemplates --file payload.json

Environment variables (alternative to flags):
  LOG_ANALYTICS_WORKSPACE_ID
  LOG_ANALYTICS_SHARED_KEY
"""
import argparse
import base64
import hashlib
import hmac
import json
import os
import sys
from datetime import datetime
from pathlib import Path

try:
    import requests
except ImportError:
    print("Requires: pip3 install requests")
    sys.exit(1)


def build_signature(customer_id, shared_key, date, content_length, method, content_type, resource):
    x_headers = f"x-ms-date:{date}"
    string_to_hash = f"{method}\n{str(content_length)}\n{content_type}\n{x_headers}\n{resource}"
    bytes_to_hash = bytes(string_to_hash, encoding='utf-8')
    decoded_key = base64.b64decode(shared_key)
    encoded_hash = base64.b64encode(
        hmac.new(decoded_key, bytes_to_hash, digestmod=hashlib.sha256).digest()
    ).decode()
    return encoded_hash


def post_data(customer_id, shared_key, log_type, json_payload):
    body = json_payload.encode('utf-8')
    method = 'POST'
    content_type = 'application/json'
    resource = '/api/logs'
    rfc1123date = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')
    content_length = len(body)
    
    signature = build_signature(customer_id, shared_key, rfc1123date, content_length, method, content_type, resource)
    authorization = f"SharedKey {customer_id}:{signature}"
    uri = f"https://{customer_id}.ods.opinsights.azure.com{resource}?api-version=2016-04-01"
    
    headers = {
        'Content-Type': content_type,
        'Authorization': authorization,
        'Log-Type': log_type,
        'x-ms-date': rfc1123date
    }
    
    resp = requests.post(uri, data=body, headers=headers)
    return resp


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workspace-id", default=os.getenv("LOG_ANALYTICS_WORKSPACE_ID"))
    ap.add_argument("--shared-key", default=os.getenv("LOG_ANALYTICS_SHARED_KEY"))
    ap.add_argument("--log-type", default="ExecutiveTemplates")
    ap.add_argument("--file", required=True, help="JSON file to send (array or object)")
    args = ap.parse_args()

    if not args.workspace_id or not args.shared_key:
        print("[✗] Missing LOG_ANALYTICS_WORKSPACE_ID or LOG_ANALYTICS_SHARED_KEY")
        sys.exit(1)

    payload = Path(args.file).read_text()
    resp = post_data(args.workspace_id, args.shared_key, args.log_type, payload)
    
    if resp.status_code == 200:
        print(f"[✓] Successfully sent to Log Analytics (status: {resp.status_code})")
    else:
        print(f"[✗] Failed to send (status: {resp.status_code})")
        print(resp.text)
        sys.exit(1)


if __name__ == '__main__':
    main()
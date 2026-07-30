#!/usr/bin/env python3
"""
Minimal helper to POST JSON to Azure Log Analytics Data Collector API.
This script supports --dry-run to avoid sending during tests.
"""
import argparse
import base64
import hashlib
import hmac
import requests
import time
import json
import sys

def build_signature(customer_id, shared_key, date, content_length, method, content_type, resource):
    x_headers = f'x-ms-date:{date}'
    string_to_hash = f'{method}\n{content_length}\n{content_type}\n{x_headers}\n{resource}'
    bytes_to_hash = bytes(string_to_hash, 'utf-8')
    decoded_key = base64.b64decode(shared_key)
    hashed = hmac.new(decoded_key, bytes_to_hash, digestmod=hashlib.sha256).digest()
    encoded_hash = base64.b64encode(hashed).decode()
    authorization = f'SharedKey {customer_id}:{encoded_hash}'
    return authorization

def post_json(customer_id, shared_key, log_type, body_json):
    body = json.dumps(body_json)
    resource = '/api/logs'
    content_type = 'application/json'
    rfc1123date = time.strftime('%a, %d %b %Y %H:%M:%S GMT', time.gmtime())
    content_length = len(body)
    signature = build_signature(customer_id, shared_key, rfc1123date, content_length, 'POST', content_type, resource)
    uri = f'https://{customer_id}.ods.opinsights.azure.com{resource}?api-version=2016-04-01'
    headers = {
        'Content-Type': content_type,
        'Authorization': signature,
        'Log-Type': log_type,
        'x-ms-date': rfc1123date
    }
    resp = requests.post(uri, data=body, headers=headers, timeout=15)
    return resp

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workspace", required=True)
    parser.add_argument("--key", required=True)
    parser.add_argument("--logtype", default="SentinelExecDesk")
    parser.add_argument("--dry-run", default="true")
    args = parser.parse_args()
    dry_run = str(args.dry_run).lower() in ("1","true","yes")
    sample = {"message":"light-run summary","ts": int(time.time())}
    if dry_run:
        print("[la] Dry-run: would POST payload:", sample)
        return 0
    resp = post_json(args.workspace, args.key, args.logtype, sample)
    print("[la] status", resp.status_code, resp.text[:400])
    return 0

if __name__ == "__main__":
    sys.exit(main())

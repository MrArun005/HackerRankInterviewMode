#!/usr/bin/env bash
# Exercise agent.py end to end without a model.
#
# Starts a stub endpoint speaking the OpenAI-compatible protocol, points the
# runner at it, sends one agent-mode prompt, and checks that the legitimate
# file was written, the read-only spec was refused, and a ../ path was refused.
#
#   ./tools/test_agent_loop.sh        (server.py must already be running)
set -euo pipefail
cd "$(dirname "$0")/.."

PROBLEM=07-counter-stepper
BACKUP=$(mktemp)
cp "problems/$PROBLEM/src/App.jsx" "$BACKUP"
cleanup() {
  cp "$BACKUP" "problems/$PROBLEM/src/App.jsx"; rm -f "$BACKUP" /tmp/escaped.js
  pkill -f tools/stub_llm.py 2>/dev/null || true
  pkill -f "python3 agent.py" 2>/dev/null || true
}
trap cleanup EXIT

python3 tools/stub_llm.py >/dev/null 2>&1 &
sleep 1
curl -sf -X POST http://localhost:8899/api/switch -H 'Content-Type: application/json' \
     -d "{\"id\":\"$PROBLEM\"}" >/dev/null

AGENT_BASE_URL=http://localhost:11888/v1 AGENT_MODEL=stub AGENT_POLL=1 \
  python3 agent.py >/tmp/agent_loop_test.log 2>&1 &
sleep 2
curl -sf -X POST http://localhost:8899/api/send -H 'Content-Type: application/json' \
     -d '{"mode":"agent","text":"implement the counter"}' >/dev/null
sleep 45

fail=0
grep -q "useState" "problems/$PROBLEM/src/App.jsx" \
  && echo "ok   wrote the intended file" || { echo "FAIL did not write App.jsx"; fail=1; }
grep -q "should never land" "problems/$PROBLEM/src/App.test.jsx" \
  && { echo "FAIL overwrote the read-only spec"; fail=1; } || echo "ok   refused the read-only spec"
[ -f /tmp/escaped.js ] \
  && { echo "FAIL wrote outside the problem directory"; fail=1; } || echo "ok   refused the ../ path"
# the run result is posted into the problem's history, not the runner's log
python3 - <<'PYCHK'
import json, sys
d = json.load(open("state.json"))
msgs = d["problems"]["07-counter-stepper"]["messages"]
last = msgs[-1]["text"] if msgs else ""
print("ok   ran the suite and reported it" if "7 / 7 passing" in last
      else "FAIL no suite result in the reply")
sys.exit(0 if "7 / 7 passing" in last else 1)
PYCHK
[ $? -eq 0 ] || fail=1

exit $fail

#!/usr/bin/env python3
"""Append a Claude reply to a problem's history and clear its pending flag.

Usage:  say.py [plan|agent] [--problem <id-or-prefix>] < body.md
Default problem is whatever the UI currently has open.
"""
import fcntl, json, os, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")
LOCKF = os.path.join(HERE, ".state.lock")
PROBLEMS = os.path.join(HERE, "problems")
MODES = ("plan", "agent")

argv = sys.argv[1:]
want = None
if "--problem" in argv:
    i = argv.index("--problem")
    want = argv[i + 1] if i + 1 < len(argv) else None
    del argv[i:i + 2]
words = [a for a in argv if not a.startswith("-")]

mode = words[0] if words else "plan"
if mode not in MODES:
    sys.exit("say.py: mode must be one of %s, got %r" % (", ".join(MODES), mode))

text = sys.stdin.read().rstrip()
if not text:
    sys.exit("say.py: nothing on stdin")

ids = sorted(d for d in os.listdir(PROBLEMS)
             if os.path.isdir(os.path.join(PROBLEMS, d)) and not d.startswith("."))

lk = open(LOCKF, "w")
fcntl.flock(lk, fcntl.LOCK_EX)
try:
    with open(STATE, encoding="utf-8") as f:
        s = json.load(f)
    s.setdefault("problems", {})

    # Default to whichever problem is actually waiting on a reply. Using
    # "current" instead would misfile the answer if the UI switched problems
    # between the prompt arriving and this reply being written.
    waiting = [i for i, v in s["problems"].items() if v.get("pending")]
    pid = waiting[0] if len(waiting) == 1 else s.get("current")
    if want:
        hits = [i for i in ids if i == want or i.startswith(want)]
        if len(hits) != 1:
            sys.exit("say.py: %r matched %d problems (%s)" % (want, len(hits), ", ".join(ids)))
        pid = hits[0]
    if pid not in ids:
        sys.exit("say.py: no current problem; pass --problem")

    slot = s["problems"].setdefault(pid, {"messages": [], "pending": False})
    slot["messages"].append({"role": "claude", "mode": mode, "text": text, "ts": time.time()})
    slot["pending"] = False
    slot["stalled"] = False
    slot.pop("pendingSince", None)

    tmp = STATE + ".tmp"                       # atomic: no partial reads
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(s, f, indent=2)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, STATE)
finally:
    fcntl.flock(lk, fcntl.LOCK_UN)
    lk.close()

print("posted to %s (%d msgs)" % (pid, len(slot["messages"])))

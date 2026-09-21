#!/usr/bin/env python3
"""Print the pending prompt and everything needed to answer it.

Any agent that can run a shell command can operate this harness:

    python3 next.py            # the prompt plus the whole problem, as markdown
    python3 next.py --json     # the same, machine-readable
    python3 next.py --wait     # block until a prompt arrives, then print it

Reply with:

    python3 say.py <plan|agent> --problem <id> < reply.md
"""
import json, os, sys, time

HERE     = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from common import is_readonly            # one copy, shared
STATE    = os.path.join(HERE, "state.json")
PROBLEMS = os.path.join(HERE, "problems")

SKIP_DIRS = {"node_modules", "dist", ".git", "__pycache__"}
CODE_EXT  = {"js", "jsx", "ts", "tsx", "css", "html", "json", "md"}


def read_state():
    try:
        with open(STATE, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return {"problems": {}}




def pending():
    """(problem_id, slot) for the problem waiting on a reply, or None."""
    for pid, slot in read_state().get("problems", {}).items():
        if slot.get("pending") and slot.get("messages"):
            return pid, slot
    return None


def files(pid):
    root, out = os.path.join(PROBLEMS, pid), []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in sorted(filenames):
            if name.rsplit(".", 1)[-1] not in CODE_EXT or name == "result.json":
                continue
            rel = os.path.relpath(os.path.join(dirpath, name), root)
            try:
                body = open(os.path.join(dirpath, name), encoding="utf-8").read()
            except (OSError, UnicodeDecodeError):
                continue
            out.append({"path": rel, "readOnly": is_readonly(rel), "body": body})
    return out


def payload():
    hit = pending()
    if not hit:
        return None
    pid, slot = hit
    last = slot["messages"][-1]
    return {
        "problem": pid,
        "mode": last.get("mode", "plan"),
        "prompt": last["text"],
        "history": [{"role": m["role"], "mode": m.get("mode"), "text": m["text"]}
                    for m in slot["messages"][:-1][-6:]],
        "test": slot.get("test"),
        "files": files(pid),
        "reply_with": "python3 say.py %s --problem %s < reply.md"
                      % (last.get("mode", "plan"), pid),
    }


def as_markdown(p):
    mode = p["mode"].upper()
    rule = ("PLAN MODE — do not change any file. The workspace is read-only on "
            "disk; a write will fail. Produce a plan, and say where the ticket "
            "and the tests disagree."
            if p["mode"] == "plan" else
            "AGENT MODE — write the code. Never modify a file marked READ ONLY.")
    out = ["# %s  ·  problem %s" % (mode, p["problem"]), "", rule, "",
           "## The prompt", "", p["prompt"], ""]
    if p["test"]:
        out += ["## Last test run", "",
                "%d / %d passing" % (p["test"]["passed"], p["test"]["total"]), ""]
    out += ["## Files", ""]
    for f in p["files"]:
        tag = "  (READ ONLY — this is the spec)" if f["readOnly"] else ""
        out += ["### %s%s" % (f["path"], tag), "", "```", f["body"].rstrip(), "```", ""]
    out += ["---", "", "Reply with:", "", "```", p["reply_with"], "```"]
    return "\n".join(out)


def main():
    wait = "--wait" in sys.argv
    while True:
        p = payload()
        if p:
            print(json.dumps(p, indent=2) if "--json" in sys.argv else as_markdown(p))
            return 0
        if not wait:
            print("Nothing pending.", file=sys.stderr)
            return 1
        time.sleep(1.5)


if __name__ == "__main__":
    sys.exit(main())

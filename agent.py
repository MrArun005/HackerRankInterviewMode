#!/usr/bin/env python3
"""Background agent for ai-interview-drill. No cloud, no API key.

Watches state.json for a pending prompt and answers it with a locally running
model. Speaks the OpenAI-compatible /chat/completions shape, so it works with
Ollama, LM Studio, or llama.cpp's server unchanged.

    ollama serve &
    ollama pull qwen2.5-coder:7b
    python3 agent.py

Env:
    AGENT_BASE_URL   default http://localhost:11434/v1
    AGENT_MODEL      default qwen2.5-coder:7b
    AGENT_POLL       default 1.5 (seconds)
"""
import json, os, re, subprocess, sys, time, urllib.error, urllib.request

HERE     = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from common import is_readonly            # one copy, shared
STATE    = os.path.join(HERE, "state.json")
PROBLEMS = os.path.join(HERE, "problems")

BASE_URL = os.environ.get("AGENT_BASE_URL", "http://localhost:11434/v1").rstrip("/")
MODEL    = os.environ.get("AGENT_MODEL", "qwen2.5-coder:7b")
POLL     = float(os.environ.get("AGENT_POLL", "1.5"))

SKIP_DIRS  = {"node_modules", "dist", ".git", "__pycache__"}
CODE_EXT   = {"js", "jsx", "ts", "tsx", "css", "html", "json"}
MAX_CHARS  = 60_000          # keep the context inside a small model's window

SYSTEM = """You are the agent inside a coding-practice harness.

There are two modes and you must respect the one you are given.

PLAN MODE — you may not change any file. The workspace is read-only on disk and
a write will fail. Produce a short plan in markdown. Where the ticket and the
tests disagree, follow the TESTS and say where they disagreed. State any
decision the tests do not pin down, so it can be reviewed before code exists.

AGENT MODE — write the code. Output each file you are changing as a fenced block
whose info string carries its path, and give the COMPLETE file contents, not a
patch or an excerpt:

```jsx path=src/App.jsx
...whole file...
```

Rules that always apply:
- Never modify a file marked READ ONLY. Those are the specification.
- The tests are the spec; the ticket is a hint and is sometimes wrong.
- Prefer the smallest change that makes the tests pass.
- No prose outside the plan or a short summary after the blocks."""

BLOCK_RE = re.compile(r"```[a-zA-Z]*\s+path=([^\s`]+)\s*\n(.*?)```", re.S)


def read_state():
    with open(STATE, encoding="utf-8") as f:
        return json.load(f)




def gather(pid):
    """Ticket plus every code file, read-only ones clearly marked."""
    root, parts, total = os.path.join(PROBLEMS, pid), [], 0
    ticket = os.path.join(root, "ticket.md")
    if os.path.exists(ticket):
        parts.append("## ticket.md\n\n" + open(ticket, encoding="utf-8").read())
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
        for name in sorted(filenames):
            if name.rsplit(".", 1)[-1] not in CODE_EXT:
                continue
            rel = os.path.relpath(os.path.join(dirpath, name), root)
            try:
                body = open(os.path.join(dirpath, name), encoding="utf-8").read()
            except (OSError, UnicodeDecodeError):
                continue
            total += len(body)
            if total > MAX_CHARS:
                parts.append("\n[context truncated]")
                return "\n\n".join(parts)
            tag = "  (READ ONLY - this is the spec)" if is_readonly(rel) else ""
            parts.append("## %s%s\n\n```\n%s\n```" % (rel, tag, body))
    return "\n\n".join(parts)


def ask(messages):
    body = json.dumps({"model": MODEL, "messages": messages,
                       "temperature": 0.2, "stream": False}).encode()
    req = urllib.request.Request(BASE_URL + "/chat/completions", data=body,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=600) as r:
        return json.load(r)["choices"][0]["message"]["content"]


def apply_blocks(pid, text):
    """Write the files the model emitted. Returns (written, skipped, failed)."""
    root = os.path.realpath(os.path.join(PROBLEMS, pid))
    written, skipped, failed = [], [], []
    for rel, body in BLOCK_RE.findall(text):
        rel = rel.strip()
        # Reject rather than sanitise: lstrip("./") would quietly turn
        # ../../../etc/evil.js into etc/evil.js and write it anyway.
        if rel.startswith("/") or os.path.isabs(rel) or ".." in rel.split("/"):
            failed.append((rel, "path escapes the problem directory")); continue
        target = os.path.realpath(os.path.join(root, rel))
        if not target.startswith(root + os.sep):
            failed.append((rel, "path escapes the problem directory")); continue
        if is_readonly(rel):
            skipped.append(rel); continue          # the spec is not ours to edit
        try:
            os.makedirs(os.path.dirname(target), exist_ok=True)
            with open(target, "w", encoding="utf-8") as f:
                f.write(body.rstrip() + "\n")
            written.append(rel)
        except PermissionError:
            failed.append((rel, "read-only: plan mode locks the workspace"))
        except OSError as e:
            failed.append((rel, str(e)))
    return written, skipped, failed


def run_tests(pid):
    try:
        name = json.load(open(os.path.join(PROBLEMS, pid, "package.json")))["name"]
    except (OSError, KeyError, json.JSONDecodeError):
        return None
    subprocess.run(["npm", "test", "--workspace=" + name], cwd=HERE,
                   capture_output=True, text=True, timeout=300)
    try:
        d = json.load(open(os.path.join(PROBLEMS, pid, "result.json")))
    except (OSError, json.JSONDecodeError):
        return None
    fails = [a["title"] for r in d.get("testResults", [])
             for a in r.get("assertionResults", []) if a["status"] != "passed"]
    return d.get("numPassedTests", 0), d.get("numTotalTests", 0), fails


def say(pid, mode, text):
    subprocess.run([sys.executable, os.path.join(HERE, "say.py"), mode,
                    "--problem", pid], input=text, text=True, cwd=HERE)


def handle(pid, slot):
    mode = slot["messages"][-1].get("mode", "plan")
    prompt = slot["messages"][-1]["text"]
    print("\n>>> %s (%s): %s" % (mode.upper(), pid, prompt[:70]), flush=True)

    history = [{"role": "user" if m["role"] == "user" else "assistant",
                "text": m["text"]} for m in slot["messages"][-6:-1]]
    messages = [{"role": "system", "content": SYSTEM},
                {"role": "user", "content":
                 "MODE: %s\n\n# Project\n\n%s" % (mode.upper(), gather(pid))}]
    messages += [{"role": h["role"], "content": h["text"]} for h in history]
    messages.append({"role": "user", "content": prompt})

    try:
        reply = ask(messages)
    except urllib.error.URLError as e:
        say(pid, mode, "Could not reach the model at `%s`.\n\n```\n%s\n```\n\n"
                       "Start it with `ollama serve`, or point `AGENT_BASE_URL` "
                       "somewhere else." % (BASE_URL, e))
        return
    except Exception as e:                                   # noqa: BLE001
        say(pid, mode, "The model call failed: `%s`" % e)
        return

    if mode != "agent":
        say(pid, "plan", reply)
        return

    written, skipped, failed = apply_blocks(pid, reply)
    prose = re.sub(r"\n{3,}", "\n\n", BLOCK_RE.sub("", reply)).strip()
    out = [prose] if prose else []

    if written:
        out.append("**Wrote:** " + ", ".join("`%s`" % w for w in written))
        res = run_tests(pid)
        if res:
            passed, total, fails = res
            out.append("**Tests: %d / %d passing**" % (passed, total))
            if fails:
                out.append("\n".join("- ✗ %s" % f for f in fails[:8]))
    else:
        out.append("_No file blocks in the reply — nothing was written._")
    if skipped:
        out.append("_Skipped (read-only spec): %s_" % ", ".join(skipped))
    if failed:
        out.append("**Failed:** " + "; ".join("`%s` — %s" % f for f in failed))

    say(pid, "agent", "\n\n".join(out))


def main():
    print("\n  ai-interview-drill runner")
    print("  model %s  via  %s" % (MODEL, BASE_URL))
    try:
        urllib.request.urlopen(BASE_URL.replace("/v1", "") + "/api/tags", timeout=3)
        print("  backend reachable\n", flush=True)
    except Exception:                                        # noqa: BLE001
        print("  backend NOT reachable yet — will keep trying\n", flush=True)

    seen = None
    while True:
        try:
            s = read_state()
            for pid, slot in s.get("problems", {}).items():
                if slot.get("pending") and slot.get("messages"):
                    sig = (pid, len(slot["messages"]))
                    if sig != seen:
                        seen = sig
                        handle(pid, slot)
        except (OSError, json.JSONDecodeError):
            pass
        except KeyboardInterrupt:
            print("\n  stopped"); return
        time.sleep(POLL)


if __name__ == "__main__":
    main()

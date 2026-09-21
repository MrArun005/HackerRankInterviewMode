#!/usr/bin/env python3
"""Shared harness helpers.

These lived in four copies across server.py, say.py, next.py and agent.py and
had already drifted - the read-only rule knew about setupTests.js but not
setupTests.ts, so a TypeScript problem's spec was writable. One copy now.
"""
import fcntl, json, os

HERE     = os.path.dirname(os.path.abspath(__file__))
STATE    = os.path.join(HERE, "state.json")
LOCKF    = os.path.join(HERE, ".state.lock")
PROBLEMS = os.path.join(HERE, "problems")

IGNORE_DIRS  = {"node_modules", "dist", "out", ".next", ".git", "__pycache__", ".vite"}
IGNORE_FILES = {"result.json", "package-lock.json", ".DS_Store"}
TEXT_EXT     = {"js", "jsx", "ts", "tsx", "css", "html", "json", "md", "txt", "svg"}


def is_readonly(rel):
    """The spec and its setup are the specification, whatever the extension."""
    base = os.path.basename(rel)
    return ".test." in base or base.startswith("setupTests.")


class state_lock:
    """Cross-process advisory lock. Every writer takes the same one."""

    def __enter__(self):
        self.fh = open(LOCKF, "w")
        fcntl.flock(self.fh, fcntl.LOCK_EX)
        return self

    def __exit__(self, *exc):
        fcntl.flock(self.fh, fcntl.LOCK_UN)
        self.fh.close()
        return False


def write_state(s):
    """Atomic: a reader never sees a partial file."""
    tmp = STATE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(s, f, indent=2)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, STATE)


def problem_ids():
    try:
        return sorted(d for d in os.listdir(PROBLEMS)
                      if os.path.isdir(os.path.join(PROBLEMS, d)) and not d.startswith("."))
    except FileNotFoundError:
        return []

#!/usr/bin/env python3
"""Agent-editor backend. stdlib only. Run: python3 server.py

One workspace per problem under problems/<id>/{app.html,meta.json,ticket.md}.
Chat history is kept per problem, so switching problems switches the session.
"""
import fcntl, json, os, re, subprocess, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
STATE = os.path.join(HERE, "state.json")
LOCKF = os.path.join(HERE, ".state.lock")
INBOX = os.path.join(HERE, "inbox.log")
PROBLEMS = os.path.join(HERE, "problems")
PORT = 8899

MODES = ("plan", "agent")
PENDING_TTL = 300          # a turn nobody answered stops blocking the composer
# Only these Host values are served, so a page on another origin cannot
# DNS-rebind a domain it controls to 127.0.0.1 and talk to this server.
ALLOWED_HOSTS = {"localhost:%d" % PORT, "127.0.0.1:%d" % PORT, "[::1]:%d" % PORT}


class state_lock:
    """Cross-process advisory lock. say.py takes the same one."""

    def __enter__(self):
        self.fh = open(LOCKF, "w")
        fcntl.flock(self.fh, fcntl.LOCK_EX)
        return self

    def __exit__(self, *exc):
        fcntl.flock(self.fh, fcntl.LOCK_UN)
        self.fh.close()
        return False


def problem_ids():
    try:
        return sorted(d for d in os.listdir(PROBLEMS)
                      if os.path.isdir(os.path.join(PROBLEMS, d)) and not d.startswith("."))
    except FileNotFoundError:
        return []


def title_of(pid):
    try:
        with open(os.path.join(PROBLEMS, pid, "meta.json"), encoding="utf-8") as f:
            return json.load(f).get("title") or pid
    except (FileNotFoundError, json.JSONDecodeError):
        return pid


def app_path(pid):
    return os.path.join(PROBLEMS, pid, "app.html")


def blank():
    ids = problem_ids()
    return {"current": ids[0] if ids else "",
            "problems": {i: {"messages": [], "pending": False} for i in ids}}


def expire_pending(s):
    """Clear a turn that never got a reply, so the composer is never dead forever.
    Returns True if anything changed and the caller should write."""
    now, changed = time.time(), False
    for slot in (s.get("problems") or {}).values():
        if slot.get("pending") and now - slot.get("pendingSince", now) > PENDING_TTL:
            slot["pending"] = False
            slot["stalled"] = True
            changed = True
    return changed


def read_state():
    """Never raise: a missing or half-written state.json rebuilds instead of 500ing."""
    try:
        with open(STATE, encoding="utf-8") as f:
            s = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError, UnicodeDecodeError):
        s = blank()
        write_state(s)
    s.setdefault("problems", {})
    ids = problem_ids()
    for i in ids:                                  # a new folder shows up with empty history
        s["problems"].setdefault(i, {"messages": [], "pending": False})
    for i, v in s["problems"].items():
        if not isinstance(v.get("messages"), list):
            v["messages"] = []
        v.setdefault("pending", False)
    if s.get("current") not in s["problems"]:
        s["current"] = ids[0] if ids else ""
    return s


def write_state(s):
    """Atomic: a reader never sees a partial file."""
    tmp = STATE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(s, f, indent=2)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, STATE)


def file_version(pid):
    """Derived from the problem's app.html mtime, so nothing has to be bumped."""
    try:
        return os.stat(app_path(pid)).st_mtime_ns // 1_000_000
    except (FileNotFoundError, OSError):
        return 0


def git(*args):
    """Run a git command inside the harness repo. Returns "" on any failure -
    the editor must keep working when git is missing or the repo is fresh."""
    try:
        r = subprocess.run(("git",) + args, cwd=HERE, capture_output=True,
                           text=True, timeout=10)
        return r.stdout if r.returncode == 0 else ""
    except (OSError, subprocess.SubprocessError):
        return ""


def diff_for(pid):
    """Uncommitted changes if there are any, otherwise the last commit that
    touched this problem. 'What changed' means the newest change either way."""
    rel = "problems/%s" % pid
    working = git("diff", "--", rel)
    if working.strip():
        return {"kind": "uncommitted", "label": "Uncommitted changes",
                "diff": working, "subject": ""}
    sha = git("log", "-1", "--format=%h", "--", rel).strip()
    if not sha:
        return {"kind": "none", "label": "No changes yet", "diff": "", "subject": ""}
    subject = git("log", "-1", "--format=%s", sha).strip()
    return {"kind": "commit", "label": "Last commit  " + sha,
            "diff": git("show", "--format=", sha, "--", rel), "subject": subject}


def log_for(pid):
    out = git("log", "-12", "--format=%h\x1f%s\x1f%cr", "--", "problems/%s" % pid)
    rows = []
    for line in out.splitlines():
        parts = line.split("\x1f")
        if len(parts) == 3:
            rows.append({"sha": parts[0], "subject": parts[1], "when": parts[2]})
    return rows


def meta_of(pid):
    try:
        with open(os.path.join(PROBLEMS, pid, "meta.json"), encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError):
        return {}


def kind_of(pid):
    """'vite' problems are real npm projects built to dist/; 'single' problems
    are the one-file harness that runs its own tests in the browser."""
    return meta_of(pid).get("kind", "single")


def pkg_name(pid):
    try:
        with open(os.path.join(PROBLEMS, pid, "package.json"), encoding="utf-8") as f:
            return json.load(f).get("name", "")
    except (OSError, json.JSONDecodeError):
        return ""


def npm(pid, *args, timeout=240):
    """Run npm for one workspace from the repo root. Returns (ok, output)."""
    name = pkg_name(pid)
    if not name:
        return False, "no package.json for %s" % pid
    try:
        r = subprocess.run(("npm",) + args + ("--workspace=" + name,),
                           cwd=HERE, capture_output=True, text=True, timeout=timeout)
        return r.returncode == 0, (r.stdout or "") + (r.stderr or "")
    except FileNotFoundError:
        return False, "npm not found on PATH"
    except subprocess.SubprocessError as e:
        return False, "npm failed: %s" % e


ANSI_RE = re.compile(r"\x1b\[[0-9;]*m|\[\d{1,3}m")


def short_failure(raw):
    """The assertion, without testing-library's DOM dump. The full text is kept
    separately so the UI can reveal it on demand."""
    if not raw:
        return ""
    head = raw.split("\n\nIgnored nodes")[0].split("\n\nThis could be")[0]
    line = " ".join(l.strip() for l in head.strip().splitlines() if l.strip())
    return line[:220]


def vitest_summary(pid):
    """Read the JSON reporter output. npm exits non-zero on failures, so the
    file - not the exit code - is the source of truth."""
    path = os.path.join(PROBLEMS, pid, "result.json")
    try:
        with open(path, encoding="utf-8") as f:
            d = json.load(f)
    except (OSError, json.JSONDecodeError):
        return None
    cases = []
    for r in d.get("testResults", []):
        for a in r.get("assertionResults", []):
            raw = ANSI_RE.sub("", "\n".join(a.get("failureMessages", [])))
            cases.append({"title": a.get("title", ""), "status": a.get("status", ""),
                          "message": short_failure(raw), "detail": raw[:4000]})
    return {"passed": d.get("numPassedTests", 0), "total": d.get("numTotalTests", 0),
            "cases": cases, "ts": time.time()}


IGNORE_DIRS  = {"node_modules", "dist", ".git", "__pycache__", ".vite"}
IGNORE_FILES = {"result.json", "package-lock.json", ".DS_Store"}
TEXT_EXT = {"js", "jsx", "ts", "tsx", "css", "html", "json", "md", "txt", "svg"}


def is_readonly_path(rel):
    """The spec is read-only. Everything else in the project is fair game."""
    base = os.path.basename(rel)
    return ".test." in base or base == "setupTests.js"


def build_tree(root, rel=""):
    """Nested dirs-then-files listing, for the explorer."""
    here = os.path.join(root, rel)
    try:
        names = sorted(os.listdir(here))
    except OSError:
        return []
    dirs, files = [], []
    for name in names:
        if name.startswith(".") or name in IGNORE_FILES or name in IGNORE_DIRS:
            continue
        child = os.path.join(rel, name) if rel else name
        full = os.path.join(root, child)
        if os.path.isdir(full):
            kids = build_tree(root, child)
            if kids:
                dirs.append({"name": name, "type": "dir", "path": child, "children": kids})
        elif name.rsplit(".", 1)[-1] in TEXT_EXT:
            try:
                n = sum(1 for _ in open(full, encoding="utf-8", errors="replace"))
            except OSError:
                n = 0
            files.append({"name": name, "type": "file", "path": child,
                          "lines": n, "readOnly": is_readonly_path(child)})
    return dirs + files


def safe_join(pid, rel):
    """Resolve a repo-relative path inside one problem, refusing escapes."""
    base = os.path.realpath(os.path.join(PROBLEMS, pid))
    target = os.path.realpath(os.path.join(base, rel))
    if target != base and not target.startswith(base + os.sep):
        return None
    return target


def s_cur():
    with state_lock():
        return read_state()["current"]


def set_writable(pid, writable):
    """Plan mode is guarded, not advised: the workspace file is chmod'd 0444 so
    an agent that tries to edit during a plan turn gets PermissionError instead
    of a polite reminder it can talk itself out of."""
    try:
        os.chmod(app_path(pid), 0o644 if writable else 0o444)
        return True
    except OSError:
        return False


def is_writable(pid):
    try:
        return bool(os.stat(app_path(pid)).st_mode & 0o200)
    except OSError:
        return False


def regions(src):
    """Split the workspace file on its banner comments so the Source tab can
    jump to a section instead of scrolling past 200 lines of CSS."""
    lines = src.split("\n")
    marks = []
    for i, l in enumerate(lines):
        if l.strip().startswith("/* ===") and i + 1 < len(lines):
            title = lines[i + 1].strip()
            if title and not title.startswith("="):
                marks.append((i, title))
    out = []
    for n, (i, title) in enumerate(marks):
        start = i + 3                              # skip the 3 banner lines
        end = marks[n + 1][0] if n + 1 < len(marks) else len(lines)
        while end > start and not lines[end - 1].strip():
            end -= 1
        out.append({"name": title, "start": start, "end": end})
    return out


def read_text(path):
    try:
        with open(path, encoding="utf-8") as f:
            return f.read()
    except (FileNotFoundError, UnicodeDecodeError):
        return ""


def send_bytes(h, body, ctype, code=200):
    h.send_response(code)
    h.send_header("Content-Type", ctype)
    h.send_header("Cache-Control", "no-store")
    h.send_header("Content-Length", str(len(body)))
    h.end_headers()
    h.wfile.write(body)


def send_file(h, path, ctype):
    try:
        send_bytes(h, open(path, "rb").read(), ctype)
    except FileNotFoundError:
        h.send_error(404)


def send_json(h, obj, code=200):
    send_bytes(h, json.dumps(obj).encode(), "application/json", code)


class H(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, fmt, *a):
        if "/api/state" not in self.path:
            print("  %s %s" % (self.command, self.path), flush=True)

    def host_ok(self):
        if (self.headers.get("Host") or "").lower() in ALLOWED_HOSTS:
            return True
        self.send_error(403, "bad Host")
        return False

    def body(self):
        n = int(self.headers.get("Content-Length", 0))
        try:
            return json.loads(self.rfile.read(n) or b"{}")
        except json.JSONDecodeError:
            return None

    def do_GET(self):
        if not self.host_ok():
            return
        p = self.path.split("?")[0]

        if p == "/favicon.ico":
            return send_bytes(self, b"", "image/x-icon", 204)
        if p in ("/", "/index.html"):
            return send_file(self, os.path.join(HERE, "ui.html"), "text/html; charset=utf-8")
        if p.startswith("/vendor/") and p.endswith(".js") and "/" not in p[8:]:
            try:
                body = open(os.path.join(HERE, "vendor", p[8:]), "rb").read()
            except FileNotFoundError:
                return self.send_error(404)
            self.send_response(200)
            self.send_header("Content-Type", "application/javascript")
            # the preview iframe is sandboxed to an opaque origin ("null"), so any
            # asset it may fetch with CORS semantics needs this to load at all
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "max-age=3600")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            return self.wfile.write(body)

        with state_lock():
            s = read_state()
            if expire_pending(s):
                write_state(s)
        cur = s["current"]

        if p == "/app.html":
            # Typed into the address bar or restored by the browser, this page is
            # the preview without its shell - no chat, no tabs, no switcher. Send
            # a top-level request back to "/"; the iframe (Sec-Fetch-Dest: iframe)
            # and ?raw=1 still get the file itself.
            dest = (self.headers.get("Sec-Fetch-Dest") or "").lower()
            if dest == "document" and "raw=1" not in (self.path.split("?", 1) + [""])[1]:
                self.send_response(302)
                self.send_header("Location", "/")
                self.send_header("Content-Length", "0")
                self.end_headers()
                return
            return send_file(self, app_path(cur), "text/html; charset=utf-8")
        if p.startswith("/preview/"):
            rest = p[len("/preview/"):]
            pid, _, rel = rest.partition("/")
            if pid not in problem_ids():
                return self.send_error(404)
            rel = rel or "index.html"
            base = os.path.realpath(os.path.join(PROBLEMS, pid, "dist"))
            target = os.path.realpath(os.path.join(base, rel))
            if not target.startswith(base + os.sep) and target != base:
                return self.send_error(403)           # no ../ escapes
            ctype = {"html": "text/html; charset=utf-8", "js": "text/javascript",
                     "css": "text/css", "svg": "image/svg+xml", "json": "application/json",
                     "map": "application/json"}.get(target.rsplit(".", 1)[-1], "application/octet-stream")
            # The preview iframe is sandboxed without allow-same-origin, so its
            # origin is "null"; vite marks module scripts crossorigin, and a
            # crossorigin fetch from an opaque origin needs this header.
            try:
                body = open(target, "rb").read()
            except FileNotFoundError:
                return self.send_error(404)
            self.send_response(200)
            self.send_header("Content-Type", ctype)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            return self.wfile.write(body)

        if p == "/api/state":
            slot = s["problems"].get(cur, {"messages": [], "pending": False})
            return send_json(self, {
                "current": cur,
                "file": ("problems/%s/src/" % cur) if kind_of(cur) == "vite"
                        else ("problems/%s/app.html" % cur),
                "fileVersion": file_version(cur),
                "locked": not is_writable(cur),
                "kind": kind_of(cur),
                "built": os.path.exists(os.path.join(PROBLEMS, cur, "dist", "index.html")),
                "test": slot.get("test"),
                "reviews": slot.get("reviews", []),
                "messages": slot["messages"],
                "pending": slot["pending"],
                "stalled": slot.get("stalled", False),
                "problems": [{"id": i, "title": title_of(i),
                              "count": len(s["problems"][i]["messages"])}
                             for i in problem_ids()],
            })
        if p == "/api/files":
            return send_json(self, {
                "root": "problems/%s" % cur,
                "kind": kind_of(cur),
                "tree": build_tree(os.path.join(PROBLEMS, cur)),
            })

        if p == "/api/file":
            rel = ""
            if "path=" in self.path:
                from urllib.parse import unquote
                rel = unquote((self.path.split("path=", 1)[1]).split("&")[0])
            target = safe_join(cur, rel)
            if not target or not os.path.isfile(target):
                return send_json(self, {"error": "not found"}, 404)
            return send_json(self, {
                "path": rel,
                "source": read_text(target),
                "readOnly": is_readonly_path(rel),
                "lang": rel.rsplit(".", 1)[-1],
            })

        if p == "/api/source":
            if kind_of(cur) == "vite":
                src, regs, line = [], [], 0
                root = os.path.join(PROBLEMS, cur, "src")
                for name in sorted(os.listdir(root)) if os.path.isdir(root) else []:
                    if name.startswith(".") or not name.split(".")[-1] in (
                            "js", "jsx", "ts", "tsx", "css", "json"):
                        continue
                    body = read_text(os.path.join(root, name))
                    n = len(body.split("\n"))
                    label = "src/" + name + ("  READ ONLY" if ".test." in name else "")
                    regs.append({"name": label, "start": line, "end": line + n})
                    src.append(body)
                    line += n
                return send_json(self, {"source": "\n".join(src), "regions": regs})
            src = read_text(app_path(cur))
            return send_json(self, {"source": src, "regions": regions(src)})
        if p == "/api/diff":
            sha = (self.path.split("sha=", 1) + [""])[1].split("&")[0] if "sha=" in self.path else ""
            if sha:
                if not sha.isalnum():
                    return send_json(self, {"error": "bad sha"}, 400)
                rel = "problems/%s" % cur
                return send_json(self, {
                    "kind": "commit", "label": "Commit  " + sha,
                    "subject": git("log", "-1", "--format=%s", sha).strip(),
                    "diff": git("show", "--format=", sha, "--", rel),
                    "log": log_for(cur)})
            d = diff_for(cur)
            d["log"] = log_for(cur)
            return send_json(self, d)
        if p == "/api/ticket":
            return send_json(self, {"ticket": read_text(os.path.join(PROBLEMS, cur, "ticket.md"))})
        self.send_error(404)

    def do_POST(self):
        if not self.host_ok():
            return
        msg = self.body()
        if msg is None:
            return send_json(self, {"error": "bad json"}, 400)

        if self.path == "/api/unstick":
            with state_lock():
                s = read_state()
                slot = s["problems"].setdefault(
                    s["current"], {"messages": [], "pending": False})
                slot["pending"] = False
                slot["stalled"] = True
                slot.pop("pendingSince", None)
                write_state(s)
            print("\n--- unstuck %s ---\n" % s["current"], flush=True)
            return send_json(self, {"ok": True})

        if self.path == "/api/build":
            ok, out = npm(s_cur(), "run", "build")
            return send_json(self, {"ok": ok, "output": out[-4000:]})

        if self.path == "/api/run":
            pid = s_cur()
            npm(pid, "test")                 # exit code is 1 on failures; ignore it
            summary = vitest_summary(pid)
            if summary is None:
                return send_json(self, {"ok": False, "error": "no result.json produced"}, 500)
            with state_lock():
                st = read_state()
                slot = st["problems"].setdefault(pid, {"messages": [], "pending": False})
                slot["test"] = summary
                write_state(st)
            return send_json(self, {"ok": True, **summary})

        if self.path == "/api/testresult":
            try:
                passed, total = int(msg.get("passed", 0)), int(msg.get("total", 0))
            except (TypeError, ValueError):
                return send_json(self, {"error": "bad numbers"}, 400)
            with state_lock():
                s = read_state()
                slot = s["problems"].setdefault(
                    s["current"], {"messages": [], "pending": False})
                slot["test"] = {"passed": passed, "total": total, "ts": time.time()}
                write_state(s)
            return send_json(self, {"ok": True})

        if self.path == "/api/review":
            verdict = msg.get("verdict")
            if verdict not in ("ship", "hold"):
                return send_json(self, {"error": "verdict must be ship or hold"}, 400)
            note = (msg.get("note") or "").strip()
            with state_lock():
                s = read_state()
                cur = s["current"]
                slot = s["problems"].setdefault(cur, {"messages": [], "pending": False})
                sha = git("log", "-1", "--format=%h", "--", "problems/%s" % cur).strip()
                entry = {"verdict": verdict, "note": note, "sha": sha,
                         "test": slot.get("test"), "ts": time.time()}
                slot.setdefault("reviews", []).append(entry)
                slot["messages"].append({
                    "role": "review", "mode": verdict, "ts": time.time(),
                    "text": ("**Shipped**" if verdict == "ship" else "**Sent back**")
                            + (" at `%s`" % sha if sha else "")
                            + (("\n\n" + note) if note else "")})
                write_state(s)
            print("\n--- review: %s (%s) ---\n" % (verdict, cur), flush=True)
            return send_json(self, {"ok": True})

        if self.path == "/api/switch":
            pid = msg.get("id")
            if pid not in problem_ids():
                return send_json(self, {"error": "unknown problem"}, 400)
            with state_lock():
                s = read_state()
                s["current"] = pid
                write_state(s)
            print("\n--- switched to %s ---\n" % pid, flush=True)
            return send_json(self, {"ok": True, "current": pid})

        if self.path != "/api/send":
            return self.send_error(404)

        text = (msg.get("text") or "").strip()
        mode = msg.get("mode", "plan")
        if mode not in MODES:                      # never let an arbitrary string reach the UI
            mode = "plan"
        if not text:
            return send_json(self, {"error": "empty"}, 400)

        with state_lock():
            s = read_state()
            cur = s["current"]
            slot = s["problems"].setdefault(cur, {"messages": [], "pending": False})
            slot["messages"].append({"role": "user", "mode": mode, "text": text, "ts": time.time()})
            slot["pending"] = True
            slot["pendingSince"] = time.time()
            slot["stalled"] = False
            write_state(s)
            with open(INBOX, "a", encoding="utf-8") as f:
                f.write("[%s] (%s) %s\n" % (mode.upper(), cur, text.replace("\n", " \\n ")))
        set_writable(cur, mode == "agent")
        print("\n>>> %s (%s)%s: %s\n" % (
            mode.upper(), cur, "  [workspace locked]" if mode == "plan" else "", text), flush=True)
        return send_json(self, {"ok": True})


if __name__ == "__main__":
    open(INBOX, "a").close()
    with state_lock():
        read_state()
    print("\n  agent editor  ->  http://localhost:%d" % PORT)
    print("  problems: %s\n" % ", ".join(problem_ids()), flush=True)
    ThreadingHTTPServer(("127.0.0.1", PORT), H).serve_forever()

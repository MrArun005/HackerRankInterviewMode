# agent-drill

A local harness for practising **AI-assisted coding interviews** — the format where
you don't type the solution, you direct an agent to write it and are judged on how
well you direct and review.

It runs entirely on your machine: a Python stdlib server, a browser UI, and a folder
of problems. No account, no service, no telemetry.

![The editor: chat on the left, per-case test results on the right](docs/tests.png)


## Why

The interview format changed before the practice material did. In an AI-assisted
pad, the coding is the easy half. What actually separates people is judgement:

- noticing the ticket and the tests disagree, and knowing the tests win
- making the agent state a decision **before** it writes code
- spotting the bug the suite structurally cannot catch
- refusing to call it done because the tests are green

You can't drill that against a chat window, because a chat window has no oracle.
This has one: every problem ships with a read-only test suite that decides when
you're finished.

## The loop

```
plan  →  review the plan  →  agent  →  run  →  review the diff  →  ship / send back
```

Four things enforce it rather than suggest it:

| | |
|---|---|
| **Guarded plan mode** | In plan mode the workspace file is `chmod 444`. An agent that tries to edit gets `PermissionError`, not a reminder it can talk itself out of. |
| **Diff tab** | Git-backed. Uncommitted changes, or the last commit touching this problem, with a history rail. You review the change, not the file. |
| **Review gate** | Three standing questions, then Ship / Send back. **Ship is disabled until the suite is green**, and verdicts are recorded against the commit sha. |
| **Read-only specs** | `App.test.jsx` is marked RO in the explorer and is the spec. The ticket is a hint, and is sometimes wrong on purpose. |

![File explorer with the spec marked read-only](docs/source.png)

## Problems

Two formats, both supported:

- **Single-file** — one `app.html` with React from a CDN and an in-browser test
  harness. Zero install, instant.
- **Vite** — a real npm project: Vite 5, Vitest 2, testing-library, multi-file
  `src/`. Built to `dist/` and served by the harness; tests run through
  `vitest --reporter=json` and render per-case in the Tests pane.

Shipped problems:

| | | |
|---|---|---|
| 01 | Task Manager | single-file · filters, counter, pluralisation |
| 02 | Employee Directory | single-file · async, pagination, empty vs no-match |
| 03 | Directory (Vite) | multi-file · hook + components, 9 tests |
| 04 | Debounced Search | multi-file · debounce, cancellation, **stale-response race** |

Each ships with a deliberate trap. Problem 02's ticket specifies an error message
the tests contradict; problem 04's ticket says nothing about concurrent requests,
and the test that matters is exactly about that.

## Quick start

```bash
git clone <this repo> && cd agent-drill
npm install          # one shared node_modules for every Vite problem
python3 server.py    # → http://localhost:8899
```

Python 3.8+ and Node 20.19+ (or 22.12+). The shell itself has no Python
dependencies — `http.server`, `json`, `fcntl`, `subprocess`.

## Running the agent

The harness is the rig; the agent is whatever you point at it. Two ways.

**A local model — no API key, nothing leaves the machine.** `agent.py` watches
for a pending prompt and answers it, speaking the OpenAI-compatible
`/chat/completions` shape, so Ollama, LM Studio and llama.cpp's server all work
unchanged.

```bash
ollama serve &                     # or LM Studio, or llama-server
ollama pull qwen2.5-coder:7b
python3 agent.py                   # third terminal, alongside server.py
```

> **Status:** `agent.py`'s prompt handling, block parser and write guards are
> unit-tested, but it has not yet been exercised end to end against a live
> local model. Treat it as untested until that box is ticked. The harness
> itself does not depend on it — see "Or drive it yourself" below.

```bash
AGENT_BASE_URL=http://localhost:11434/v1   # default
AGENT_MODEL=qwen2.5-coder:7b               # default
AGENT_POLL=1.5                             # seconds
```

Sizing: a 7B at Q4 needs roughly 5 GB of RAM. On a 16 GB machine a 14B coder
model is noticeably better at this.

In **agent** mode the model returns whole files in fenced blocks tagged with a
path, and the runner writes them, then runs the suite and reports the result
back into the chat:

````
```jsx path=src/App.jsx
...whole file...
```
````

It refuses to write a READ ONLY spec file, refuses any path containing `..` or
an absolute path, and in plan mode the `chmod 444` guard makes the write fail
anyway — three independent checks, because a model that is wrong about code will
occasionally be wrong about paths.

**Or drive it yourself.** Nothing requires `agent.py`. Any assistant that can
read `state.json` and shell out to `say.py` can be the agent — that is how the
harness was built in the first place.

## A small local model is a feature here

A 7B model will not solve these problems cleanly. It will produce plausible React
with a stale dependency array, an index used as a key, a missing guard.

That is the point. The skill being drilled is **reviewing agent output**, and a
weaker agent generates more of the defects worth catching. Use a frontier model
when you want the answer; use a small local one when you want the practice.

## Adding a problem

Drop a folder into `problems/`. It appears in the switcher on the next poll — no
code change, no restart.

```
problems/05-your-problem/
  meta.json      {"title": "Your Problem", "kind": "vite"}
  ticket.md      what the candidate reads
  package.json   name it p05-…, and npm install at the root
  src/           your stubs + a read-only *.test.jsx
```

For a single-file problem, use `{"kind": "single"}` and one `app.html` with
`/* === … === */` banner comments — the Source tab uses them as regions.

## How it's wired

```
server.py    stdlib HTTP on 127.0.0.1 with a Host allowlist, flock'd atomic
             state writes, git + npm shelling out, path-escape guards
ui.html      one file: chat, explorer, diff, tests, review gate, theming
say.py       how the agent posts a reply into a problem's history
state.json   per-problem message history, test results, review verdicts
problems/    one folder per problem
```

The preview iframe is sandboxed without `allow-same-origin`, so it has an opaque
origin: it can't reach the server directly and reports its results by posting up
to the parent. Vite's `crossorigin` module scripts need CORS headers on
`/preview/*` for the same reason.

## Not built, on purpose

Session playback, activity timelines, screen observation, PDF reports. Those exist
so an interviewer can audit a candidate afterwards. Practising alone, they're
theatre.

## Credit

The format is modelled on HackerRank's AI-assisted interviews and CodePair.
Not affiliated with or endorsed by HackerRank; no HackerRank content is included.
Every problem here is original.

## Licence

MIT

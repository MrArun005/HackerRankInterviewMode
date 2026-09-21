# agent-drill

A local harness for practising **AI-assisted coding interviews** — the format where
you don't type the solution, you direct an agent to write it and are judged on how
well you direct and review.

It runs entirely on your machine: a Python stdlib server, a browser UI, and a folder
of problems. No account, no service, no telemetry.



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

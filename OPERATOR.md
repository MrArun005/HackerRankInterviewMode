# Operating the harness

The harness doesn't care what drives it. Anything that can run a shell command
can be the agent: Claude Code, Cursor, Aider, Copilot CLI, a script against an
API, a local model, or a person typing by hand.

There is no SDK and no API key. The contract is three commands.

## The contract

```bash
python3 next.py --wait      # 1. block until a prompt arrives, then print it
                            # 2. do what it says
python3 say.py <mode> --problem <id> < reply.md   # 3. reply
```

`next.py` prints the mode, the prompt, the recent history, the last test result,
and every file in the problem with read-only ones marked. It ends by telling you
the exact reply command, problem id already filled in. `--json` gives the same
thing machine-readable.

That's the whole protocol. Everything else — the UI, the diff, the review gate,
the metrics — is bookkeeping the harness does around it.

## The two modes

**`plan`** — change nothing. The workspace is `chmod 444` while a plan prompt is
open, so a write raises `PermissionError`. Don't work around it; the point is
that planning turns stay planning turns. Produce a plan, and say where the ticket
and the tests disagree.

**`agent`** — write the code. Never touch a file marked READ ONLY; those are the
spec. Then run the tests:

```bash
npm test --workspace=<pkg>     # vite problems
```

or hit **Run tests** in the UI, and report the real result. The review gate keeps
Ship disabled until the suite is green, so there is nothing to gain by claiming
otherwise.

## Driving it from a coding agent

Paste this as the agent's standing instruction:

> You are the agent for the drill harness in this directory.
>
> Loop: run `python3 next.py --wait`. Do what the prompt asks, honouring the mode
> it prints. Reply with the `python3 say.py …` command it gives you, passing your
> answer on stdin as markdown.
>
> In `plan` mode change no files. In `agent` mode write the code, never touch a
> file marked READ ONLY, run the tests, and include the real pass/fail counts in
> your reply. If the tests fail, paste the actual failure text rather than
> describing it.
>
> Then loop again.

Some agents can watch instead of poll — `inbox.log` gets one line per prompt, so
`tail -f inbox.log` works as a wake-up signal.

## Driving it from a local model

`agent.py` does the above loop for you against any OpenAI-compatible endpoint
(Ollama, LM Studio, llama.cpp). It is one option, not the intended path — see
the README.

## Files an operator touches

| | |
|---|---|
| `next.py` | read the pending prompt and its context |
| `say.py` | post a reply into the problem's history |
| `state.json` | the raw truth: per-problem messages, test runs, review verdicts |
| `inbox.log` | one line per prompt, for `tail -f` |
| `problems/<id>/` | the problem itself |

Nothing else is part of the contract, so the UI and server can change without
breaking your operator.

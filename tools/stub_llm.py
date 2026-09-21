#!/usr/bin/env python3
"""A fake OpenAI-compatible endpoint. Speaks the same wire protocol a local
model would, so agent.py's whole loop can be exercised without a model."""
import json
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

REPLY = '''Implementing the counter.

```jsx path=src/App.jsx
import { useState } from "react";
const MIN = 0, MAX = 100;

export default function App() {
  const [count, setCount] = useState(0);
  const [step, setStep] = useState(1);
  const clamp = (v) => Math.min(MAX, Math.max(MIN, v));

  return (
    <div className="card">
      <p data-testid="count">{count}</p>
      <button data-testid="dec" onClick={() => setCount((v) => clamp(v - step))}>-</button>
      <button data-testid="inc" onClick={() => setCount((v) => clamp(v + step))}>+</button>
      <select data-testid="step" value={step} onChange={(e) => setStep(Number(e.target.value))}>
        <option value="1">1</option><option value="5">5</option><option value="10">10</option>
      </select>
      <button data-testid="reset" onClick={() => { setCount(0); setStep(1); }}>Reset</button>
    </div>
  );
}
```

Also trying to overwrite the spec, which must be refused:

```jsx path=src/App.test.jsx
// should never land
```

And a path escape, which must also be refused:

```js path=../../../tmp/escaped.js
// should never land
```
'''


class H(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    def log_message(self, *a): pass

    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        self.rfile.read(n)
        body = json.dumps({"choices": [{"message": {"role": "assistant", "content": REPLY}}]}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        body = b'{"models":[]}'
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


ThreadingHTTPServer(("127.0.0.1", 11888), H).serve_forever()

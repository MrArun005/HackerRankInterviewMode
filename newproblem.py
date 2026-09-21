#!/usr/bin/env python3
"""Scaffold a Vite problem so authoring one is spec-writing, not boilerplate.

    python3 newproblem.py 06 optimistic-approvals "Optimistic Approvals" hard
    npm install                      # picks up the new workspace
    # then write src/App.test.jsx (the spec) and stub the rest

Everything except the spec and the ticket is generated.
"""
import json, os, sys

HERE     = os.path.dirname(os.path.abspath(__file__))
PROBLEMS = os.path.join(HERE, "problems")
LEVELS   = ("easy", "medium", "hard")

TEMPLATE = {
"vite.config.js": '''import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: { outDir: "dist", emptyOutDir: true },
  test: { environment: "jsdom", globals: true, setupFiles: "./src/setupTests.js" },
});
''',
"index.html": '''<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>%(title)s</title></head>
  <body><div id="root"></div><script type="module" src="/src/main.jsx"></script></body>
</html>
''',
"src/setupTests.js": '''import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";
afterEach(cleanup);
''',
"src/main.jsx": '''import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(<App />);
''',
"src/App.jsx": '''// YOUR CODE
export default function App() {
  return <p>Not implemented.</p>;
}
''',
"src/App.test.jsx": '''/* READ ONLY - the spec. Do not modify. */
import { describe, it, expect } from "vitest";

describe("%(title)s", () => {
  it("has a spec", () => { expect(false).toBe(true); });
});
''',
"ticket.md": '''# %(title)s

Describe the task here.

**Required data-testids:** …

**Read only:** `src/App.test.jsx`, `src/setupTests.js`
''',
}

PKG = {
  "private": True, "type": "module",
  "scripts": {"build": "vite build",
              "test": "vitest run --reporter=json --outputFile=result.json"},
  "dependencies": {"react": "^18.3.1", "react-dom": "^18.3.1"},
  "devDependencies": {
      "@vitejs/plugin-react": "^4.3.4", "@testing-library/react": "^16.1.0",
      "@testing-library/dom": "^10.4.0", "jsdom": "^25.0.1",
      "vite": "^5.4.11", "vitest": "^2.1.9"},
}


def main():
    if len(sys.argv) < 5:
        sys.exit(__doc__)
    num, slug, title, level = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4].lower()
    if level not in LEVELS:
        sys.exit("difficulty must be one of %s" % ", ".join(LEVELS))

    pid  = "%s-%s" % (num, slug)
    root = os.path.join(PROBLEMS, pid)
    if os.path.exists(root):
        sys.exit("%s already exists" % pid)

    os.makedirs(os.path.join(root, "src"))
    for rel, body in TEMPLATE.items():
        path = os.path.join(root, rel)
        with open(path, "w", encoding="utf-8") as f:
            f.write(body % {"title": title})

    pkg = dict(PKG, name="p%s-%s" % (num, slug))
    json.dump(pkg, open(os.path.join(root, "package.json"), "w"), indent=2)
    json.dump({"title": title, "difficulty": level, "kind": "vite"},
              open(os.path.join(root, "meta.json"), "w"), indent=2)

    shared = os.path.join(PROBLEMS, "04-debounced-search", "src", "styles.css")
    if os.path.exists(shared):
        with open(shared, encoding="utf-8") as a, \
             open(os.path.join(root, "src", "styles.css"), "w", encoding="utf-8") as b:
            b.write(a.read())

    print("created problems/%s  (%s)" % (pid, level))
    print("next: write src/App.test.jsx, stub the source, then `npm install`")


if __name__ == "__main__":
    main()

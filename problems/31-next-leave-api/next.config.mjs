// Static export: the harness serves the built output, it does not run a Node
// server. Route handlers are still plain functions, so they test directly.
export default { output: "export", distDir: "out", images: { unoptimized: true } };

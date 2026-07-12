import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const port = Number(process.env.PORT || 4174);
const root = process.cwd();
const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".sql": "text/plain; charset=utf-8"
};

createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  let file = decodeURIComponent(url.pathname);
  if (file === "/") file = "/index.html";
  const path = normalize(join(root, file));
  if (!path.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  try {
    const body = await readFile(path);
    res.writeHead(200, { "Content-Type": types[extname(path)] || "application/octet-stream" });
    res.end(body);
  } catch {
    const body = await readFile(join(root, "index.html"));
    res.writeHead(200, { "Content-Type": types[".html"] });
    res.end(body);
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Camp Ops running at http://127.0.0.1:${port}`);
});

import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname } from "node:path";

const out = "dist";
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await mkdir(`${out}/server`, { recursive: true });
await mkdir(`${out}/.openai`, { recursive: true });

const entries = [
  "index.html",
  "styles.css",
  "task-layout.css",
  "manifest.json",
  "sw.js",
  "supabase-schema.sql",
  "js"
];

for (const entry of entries) {
  if (existsSync(entry)) {
    await cp(entry, `${out}/${entry}`, { recursive: true });
  }
}

await cp(".openai/hosting.json", `${out}/.openai/hosting.json`);

const assetFiles = [
  "index.html",
  "styles.css",
  "task-layout.css",
  "manifest.json",
  "sw.js",
  "supabase-schema.sql",
  "js/config.js",
  "js/data.js",
  "js/store.js",
  "js/views/common.js",
  "js/views/dashboard.js",
  "js/views/tasks.js",
  "js/views/requests.js",
  "js/views/supplies.js",
  "js/views/clock.js",
  "js/views/schedule.js",
  "js/views/employees.js",
  "js/views/users.js",
  "js/app-main.js"
];

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".sql": "text/plain; charset=utf-8"
};

const assets = {};
for (const file of assetFiles) {
  assets[`/${file}`] = {
    body: await readFile(file, "utf8"),
    type: types[extname(file)] || "text/plain; charset=utf-8"
  };
}
assets["/"] = assets["/index.html"];

const server = `const assets = ${JSON.stringify(assets)};

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const asset = assets[url.pathname] || assets["/index.html"];
    return new Response(asset.body, {
      headers: {
        "content-type": asset.type,
        "cache-control": url.pathname === "/" || url.pathname === "/index.html"
          ? "no-store"
          : "public, max-age=300"
      }
    });
  }
};
`;

await writeFile(`${out}/server/index.js`, server);

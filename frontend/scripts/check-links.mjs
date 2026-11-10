// Check that every source link on the History page answers (HTTP < 400). Run: npm run links
import { HISTORY } from "../src/history.ts";

// Hosts that refuse automated clients (checked by hand): reported, not failed.
const BLOCKS_BOTS = ["www.ams.org"];
const all = [...new Set(HISTORY.flatMap((c) => c.sources.map((s) => s.url)))];
const skipped = all.filter((u) => BLOCKS_BOTS.includes(new URL(u).host));
const urls = all.filter((u) => !skipped.includes(u));
const bad = [];
await Promise.all(
  urls.map(async (url) => {
    for (const method of ["HEAD", "GET"]) {
      try {
        const res = await fetch(url, { method, redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "User-Agent": "formalizer-link-check" } });
        if (res.status < 400) return;
        if (method === "GET") bad.push(`${res.status} ${url}`);
      } catch (e) {
        if (method === "GET") bad.push(`ERR ${url} (${e.message})`);
      }
    }
  }),
);
console.log(`${urls.length - bad.length}/${urls.length} links answer` + (skipped.length ? ` (${skipped.length} not checkable: ${skipped.join(", ")})` : ""));
for (const b of bad.sort()) console.log("  " + b);
process.exit(bad.length ? 1 : 0);

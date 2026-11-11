/** Snippets in lean/Formalizer/Pages/*.lean: `-- snippet: <name>` up to the next `-- snippet:` or `-- end` line. */

export function parseSnippets(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  let name: string | null = null;
  let lines: string[] = [];
  const close = () => {
    if (name) out[name] = lines.join("\n").replace(/^\n+|\s+$/g, "");
    name = null;
    lines = [];
  };
  for (const line of text.split("\n")) {
    const m = /^\s*-- snippet:\s*([\w-]+)\s*$/.exec(line);
    if (m) {
      close();
      name = m[1];
    } else if (/^\s*-- end\s*$/.test(line)) close();
    else if (name) lines.push(line);
  }
  close();
  return out;
}

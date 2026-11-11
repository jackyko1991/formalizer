// The Formalizer agent skill in every format, from one source: plugins/formalizer/skills/formalizer/SKILL.md.
//
//     node scripts/agent_skill.mjs [out]      (default out: frontend/public/generated)
//
// writes <out>/agent/:
//     SKILL.md               Claude Code skill (also installed by the plugin marketplace in .claude-plugin/)
//     AGENTS.md              the same instructions for Codex, OpenCode and other agents that read AGENTS.md
//     GEMINI.md              the same for Gemini CLI
//     formalizer-skill.zip   formalizer/SKILL.md, to upload in Claude Desktop / claude.ai (Customize › Skills)
//
// Run before every dev server and build (frontend/package.json), so the site always serves the current skill.
// Node only (zlib), no packages: a zip with one deflated file and a fixed timestamp, so the bytes are reproducible.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, deflateRawSync } from "node:zlib";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(ROOT, "plugins", "formalizer", "skills", "formalizer", "SKILL.md");
const SITE = "https://jackyko1991.github.io/formalizer/#/agents/skills";

/** SKILL.md without its YAML frontmatter. */
export function body(skill) {
  if (skill.startsWith("---")) skill = skill.split("---").slice(2).join("---");
  return skill.replace(/^\n+/, "");
}

/** A zip holding one file (deflated), dated 2026-01-01 00:00. */
export function zipOne(name, data) {
  const nameBuf = Buffer.from(name, "utf8");
  const packed = deflateRawSync(data);
  const crc = crc32(data);
  const time = 0;
  const date = ((2026 - 1980) << 9) | (1 << 5) | 1;
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50, 0);
  local.writeUInt16LE(20, 4); // version needed
  local.writeUInt16LE(0x0800, 6); // UTF-8 names
  local.writeUInt16LE(8, 8); // deflate
  local.writeUInt16LE(time, 10);
  local.writeUInt16LE(date, 12);
  local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(packed.length, 18);
  local.writeUInt32LE(data.length, 22);
  local.writeUInt16LE(nameBuf.length, 26);
  const central = Buffer.alloc(46);
  central.writeUInt32LE(0x02014b50, 0);
  central.writeUInt16LE(20, 4);
  central.writeUInt16LE(20, 6);
  central.writeUInt16LE(0x0800, 8);
  central.writeUInt16LE(8, 10);
  central.writeUInt16LE(time, 12);
  central.writeUInt16LE(date, 14);
  central.writeUInt32LE(crc, 16);
  central.writeUInt32LE(packed.length, 20);
  central.writeUInt32LE(data.length, 24);
  central.writeUInt16LE(nameBuf.length, 28);
  central.writeUInt32LE(0, 42); // offset of the local header
  const centralStart = local.length + nameBuf.length + packed.length;
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(1, 8);
  end.writeUInt16LE(1, 10);
  end.writeUInt32LE(central.length + nameBuf.length, 12);
  end.writeUInt32LE(centralStart, 16);
  return Buffer.concat([local, nameBuf, packed, central, nameBuf, end]);
}

export function files() {
  const skill = readFileSync(SOURCE);
  const note = `<!-- Formalizer agent instructions, generated from SKILL.md; see ${SITE} -->\n\n`;
  const rest = Buffer.from(note + body(skill.toString("utf8")));
  return { "SKILL.md": skill, "AGENTS.md": rest, "GEMINI.md": rest, "formalizer-skill.zip": zipOne("formalizer/SKILL.md", skill) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = join(resolve(process.argv[2] ?? join(ROOT, "frontend", "public", "generated")), "agent");
  mkdirSync(target, { recursive: true });
  for (const [name, data] of Object.entries(files())) {
    const path = join(target, name);
    if (!existsSync(path) || !readFileSync(path).equals(data)) writeFileSync(path, data);
  }
  console.log(`wrote ${target}`);
}

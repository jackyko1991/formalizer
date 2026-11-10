# Formalizer

**Formal mathematics in Lean 4, learned by doing**, for people who are not (yet) mathematicians: from a two-line
hello world to the Navier–Stokes Comparator challenges. A sibling of
[Tensorizer](https://github.com/jackyko1991/tensorizer) (physics as tensor code).

Site: <https://jackyko1991.github.io/formalizer/> (English and Traditional Chinese).

## The idea

In Tensorizer a problem's tests are written first and the runner checks the code. In Formalizer **the statement is
the test and Lean's kernel is the grader**: a problem is a fixed Lean statement with `sorry` where the proof goes,
and a solution counts only when [Comparator](https://github.com/leanprover/comparator) confirms it proves exactly
that statement with the standard axioms (`propext`, `Quot.sound`, `Classical.choice`).

## Status

| Part | Status |
|---|---|
| Concept ▸ History (Automath to the 2026 Lean certificates), en + zh-Hant | ready |
| Problems: hello world, tutorial levels L1–L3, the Navier–Stokes and Euler challenges, 30 research challenges from openai/math | in progress |
| Local Lean runner (Docker, Mathlib prebuilt; Lite and Full images), goal view, proof dependency graph | in progress |
| Concept, Coding Skills, Further reading, AI agent (Skills, MCP) | in progress |

Lean runs **on your own computer** (a Docker runner, or a Lean toolchain for developers); the site never sends
your proofs to a hosted server.

## Develop

```sh
git clone --recurse-submodules git@github.com:jackyko1991/formalizer.git
cd formalizer/frontend && npm install && npm run dev
npm test          # content and translation checks
npm run links     # every History source answers
```

The shared layer `vendor/learnkit` is a **private** submodule: a clone without access to it can't build the site.

## Credits and licence

Code: Apache-2.0 (see `LICENSE`). Problem statements come from
[openai/NavierStokesAndEuler](https://github.com/openai/NavierStokesAndEuler),
[openai/math](https://github.com/openai/math) and
[Google DeepMind's Formal Conjectures](https://github.com/google-deepmind/formal-conjectures), under their own
licences (see `NOTICE`).

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

The checker is checked too. Every check runs a row of **independent checkers**, test-driven: the frozen statement is
the test, the checkers are the test runner, and a proof goes from red to green only when they all agree.

| Checker | Tier | Runs on | Catches |
|---|---|---|---|
| Static scan | Lite (free) | any OS, no Lean needed | `sorry`, `axiom`, `native_decide`, `unsafe`…, notation or instances that change the statement |
| Kernel + axioms | Lite | any OS | a step Lean's kernel rejects; axioms beyond the standard three |
| Statement match | Lite | any OS | a solution that proves a different statement (the elaborated types and the definitions they use are compared with the challenge's, so `^` quietly meaning 37 is caught) |
| leanchecker | Lite, opt-in | any OS | environment hacking: replays the compiled declarations in a fresh process |
| Comparator (`--paranoid`) | Full (Research, paid) | Linux / WSL / cloud runner | the whole judge in a sandbox: challenge vs solution, axioms, kernel replay |
| nanoda | Full | Linux / WSL / cloud runner | a bug in Lean's kernel: a second kernel, written independently in Rust |
| Lean4Lean | Full | Linux / WSL / cloud runner | a kernel written in Lean (derived from the C++ one, so not fully independent) |

Every problem's reference proof passes at least the static scan; every Lite problem passes all three default Lite
checkers (tested in `tests/test_checkers.py`). On Windows the Full checkers report "not available on this OS".

## Status

| Part | Status |
|---|---|
| Concept: from statement to proof, the Feynman technique, Lean maths, how Lean checks, **checking the checker**, limits of proofs, AI provers, **AI + human: the Riemann case**, **six views on an unreadable proof** (with the 3Blue1Brown video), History; en + zh-Hant, illustrated | ready |
| Coding Skills: tactics, finding lemmas, **Mathlib map** (search a theorem, its module and its dependency graph down to the axioms, in 3D), structuring a proof, errors, verifying | ready |
| Problems: tutorial L1–L3, geometry (with Pythagoras as a Lite vector lemma and as Mathlib's Euclidean theorem), linear algebra, research showcase, **IMO problems** ported from compfiles (read-only on Lite, runnable on Full), **When Lean says no** (Buzzard's careless FLT, Fermat's 2^32 + 1, the "all horses are one colour" induction) | ready |
| Independent checkers (Lite in Problems; Lite + Full picker in Research) | Lite ready; Full adapters tested with stand-ins |
| Local Lean runner (Lite: core Lean; Full: Mathlib), goal view, proof dependency graph | in progress |
| Further reading, AI agent (Skills, MCP) | in progress |

Lean runs **on your own computer** (a Docker runner, or a Lean toolchain for developers); the site never sends
your proofs to a hosted server.

## Run locally

The problems need a Lean runner on your computer. Install Lean's installer [elan](https://lean-lang.org/install/)
and [pixi](https://pixi.sh), then:

```sh
git clone https://github.com/jackyko1991/formalizer && cd formalizer
pixi run lean-build   # builds the Lean project and the REPL (the first time takes a while)
pixi run runner       # the runner on http://localhost:8790
pixi run dev          # developing: the runner and the site together, http://localhost:5180
```

On Windows the runner is the Lite one (core Lean) with the Lite checkers. The Full runner (Mathlib) and the Full
checkers run on Linux, WSL or the cloud runner: start it with `FORMALIZER_RUNNER=full`, and point the checkers at their
programs with `FORMALIZER_COMPARATOR_BIN`, `FORMALIZER_NANODA_BIN`, `FORMALIZER_LEAN4LEAN_BIN` if they are not on
`PATH` (`/api/health` lists which checkers this runner has, and why the others are missing).

Then open https://jackyko1991.github.io/formalizer/: the chip at the top right turns green when the site finds the
runner. Nothing is sent anywhere else.

### With an AI agent

The runner is also an MCP server at `http://localhost:8790/mcp` (tools `runner_status`, `list_problems`,
`get_problem`, `check_proof`), and the skill in `plugins/formalizer/` teaches an agent the Formalizer way:

```sh
claude mcp add --transport http formalizer http://localhost:8790/mcp
claude plugin marketplace add jackyko1991/formalizer && claude plugin install formalizer@formalizer
```

Other agents (Codex, OpenCode, VS Code, Claude Desktop): see the site's AI agent ▸ MCP and Skills pages.

## Develop

```sh
git clone --recurse-submodules git@github.com:jackyko1991/formalizer.git
cd formalizer/frontend && npm install && npm run dev
npm test          # content and translation checks
npm run links     # every History source answers
```

The shared layer `vendor/learnkit` is a **private** submodule: a clone without access to it can't build the site.
A clone made without `--recurse-submodules` has an empty `vendor/learnkit` and a blank page; `pixi run dev` checks it
out for you, or run `git submodule update --init`. learnkit also holds the sites' shared type
(`web/src/fonts.css`: Noto Sans for text, Source Code Pro for code).

```sh
pixi run test     # backend, problems and checkers; the Lean tests run when elan's lake is on PATH
FORMALIZER_MATHLIB=~/mathproj pixi run test   # also compile the Full (Mathlib) problems, in a Lake project with Mathlib
python scripts/mathlib_graph/generate.py      # regenerate the Mathlib map's data (Lean + Mathlib in WSL, ~7 min)
python scripts/problem_maps/generate.py       # regenerate every problem's two-layer map (Lite Lean here, Mathlib in WSL)
```

## CI setup (once, by the owner)

The Pages workflow fetches learnkit with a read-only deploy key:

```sh
ssh-keygen -t ed25519 -N "" -C "formalizer-ci (read-only)" -f /tmp/learnkit_deploy
gh repo deploy-key add /tmp/learnkit_deploy.pub --repo jackyko1991/learnkit --title "formalizer-ci (read-only)"
gh secret set LEARNKIT_DEPLOY_KEY --repo jackyko1991/formalizer < /tmp/learnkit_deploy
rm /tmp/learnkit_deploy /tmp/learnkit_deploy.pub
```

Then Settings ▸ Pages ▸ Source: **GitHub Actions**, and re-run the workflow.

## Credits and licence

Code: Apache-2.0 (see `LICENSE`). Problem statements come from
[openai/NavierStokesAndEuler](https://github.com/openai/NavierStokesAndEuler),
[openai/math](https://github.com/openai/math) and
[Google DeepMind's Formal Conjectures](https://github.com/google-deepmind/formal-conjectures), under their own
licences (see `NOTICE`). The IMO problems and their proofs are ported from
[compfiles](https://github.com/dwrensha/compfiles) (Apache-2.0; authors named on each problem and in `NOTICE`). The
Six views page embeds 3Blue1Brown's video from YouTube; quotes link to their moment in it.

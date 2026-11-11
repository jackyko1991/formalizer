import Lean

/-!
# The dependency graph of a proof

`#dep_graph t₁ t₂ …` prints (as one info message starting with `formalizer-depgraph `) a JSON graph of what the
theorems `tᵢ` depend on, for the problem page:

* nodes for the reader's own declarations (theorems and definitions written in this file), each `proved`, `sorry`
  (its own proof uses `sorry`) or `def`;
* the library lemmas they cite **directly** (`Nat.add_comm`): Lean's and Mathlib's libraries are black boxes, never
  walked into;
* the axioms at the leaves (`propext`, `Quot.sound`, `Classical.choice`, `sorryAx`).

Strict pruning keeps it readable: compiler-generated helpers (`_proof_N`, `match_N`, equation lemmas, `_auxLemma`)
are credited to the declaration they belong to, and library definitions, types and instances (the plumbing behind
`+` or `decide`) are only counted (`hidden`). A budget caps the library nodes (`more`).

The runner imports this module in every Lean worker and appends `#dep_graph` to each check (backend/app.py).
-/

open Lean Elab Command

namespace Formalizer.DepGraph

/-- Library nodes reported at most (the runner prunes further: it keeps the ones the reader's code names); the rest
are counted in `more`. -/
def budget : Nat := 300

/-- Suffixes Lean adds to generated helpers of a declaration. -/
def auxSuffixes : List String :=
  ["eq_def", "induct", "brecOn", "below", "rec", "casesOn", "recOn", "noConfusion", "noConfusionType",
    "binductionOn", "ibelow", "mutual_induct", "fun_cases", "injEq", "inj", "sizeOf_spec", "eq_unfold"]

def isAuxPart (s : String) : Bool :=
  s.startsWith "_" || s.startsWith "match_" || s.startsWith "proof_" ||
    (s.startsWith "eq_" && (s.drop 3).all Char.isDigit) || auxSuffixes.contains s

/-- The declaration a generated helper belongs to: `sumTo.eq_2 ↦ sumTo`, `gauss._proof_1 ↦ gauss`. -/
partial def owner : Name → Name
  | n@(.str p s) => if isAuxPart s then owner p else if p.isInternal then owner p else n
  | n@(.num p _) => if p.isAnonymous then n else owner p
  | n => n

/-- Written in this file (not imported). -/
def isLocal (env : Environment) (n : Name) : Bool :=
  env.contains n && (env.getModuleIdxFor? n).isNone

/-- What a constant's type and value mention. -/
def mentions (ci : ConstantInfo) : Array Name :=
  let v := match ci.value? (allowOpaque := true) with
    | some e => e.getUsedConstants
    | none => #[]
  ci.type.getUsedConstants ++ v

structure Deps where
  locals : Array Name := #[]
  library : Array Name := #[]
  axioms : Array Name := #[]
  hidden : Nat := 0

/-- The visible dependencies of the local declaration `root`, looking through its own generated helpers. -/
partial def depsOf (env : Environment) (root : Name) : Deps := Id.run do
  let mut out : Deps := {}
  let mut seen : NameSet := {}
  let mut todo : Array Name := #[root]
  while h : todo.size > 0 do
    let c := todo[todo.size - 1]
    todo := todo.pop
    if seen.contains c then continue
    seen := seen.insert c
    let some ci := env.find? c | continue
    for d in mentions ci do
      let o := owner d
      if seen.contains d then continue
      -- a helper Lean generated for a local declaration (`sumTo.eq_2`) counts as that declaration
      if !isLocal env d && o != d && isLocal env o then
        if o == root then todo := todo.push d
        else if !out.locals.contains o then out := { out with locals := out.locals.push o }
        continue
      if isLocal env d then
        if o == root || d.isInternal || o != d && !env.contains o then
          todo := todo.push d -- a helper of this declaration (or of none): look inside it
        else if !out.locals.contains o then
          out := { out with locals := out.locals.push o }
      else
        match env.find? d with
        | some (.axiomInfo _) => if !out.axioms.contains d then out := { out with axioms := out.axioms.push d }
        | some (.thmInfo _) =>
          if o != d && env.contains o && (env.find? o matches some (.thmInfo _)) then
            if !out.library.contains o then out := { out with library := out.library.push o }
          else if d.isInternal then
            todo := todo.push d
          else if !out.library.contains d then
            out := { out with library := out.library.push d }
        | _ => out := { out with hidden := out.hidden + 1 }
  return out

def node (id kind status : String) : Json :=
  Json.mkObj [("id", id), ("kind", kind), ("status", status)]

def edge (src dst : Name) : Json :=
  Json.mkObj [("from", toString src), ("to", toString dst)]

syntax (name := depGraph) "#dep_graph" (ppSpace ident)+ : command

@[command_elab depGraph] def elabDepGraph : CommandElab := fun stx => do
  let env ← getEnv
  let roots := stx[1].getArgs.map (·.getId) |>.filter env.contains
  -- walk the reader's declarations from the roots
  let mut locals : Array Name := #[]
  let mut todo := roots
  let mut deps : Std.HashMap Name Deps := {}
  while h : todo.size > 0 do
    let n := todo[todo.size - 1]
    todo := todo.pop
    if deps.contains n then continue
    let d := depsOf env n
    deps := deps.insert n d
    locals := locals.push n
    todo := todo ++ d.locals
  let mut nodes : Array Json := #[]
  let mut edges : Array Json := #[]
  let mut library : Array Name := #[]
  let mut axioms : Array Name := #[]
  let mut hidden := 0
  let mut more := 0
  for n in locals do
    let d := deps.getD n {}
    let kind := match env.find? n with
      | some (.thmInfo _) => "theorem"
      | _ => "def"
    let status := if d.axioms.contains ``sorryAx then "sorry" else if kind == "def" then "def" else "proved"
    nodes := nodes.push (node (toString n) kind status)
    hidden := hidden + d.hidden
    for l in d.locals do edges := edges.push (edge n l)
    for l in d.library do
      if library.contains l then
        edges := edges.push (edge n l)
      else if library.size < budget then
        library := library.push l
        edges := edges.push (edge n l)
      else
        more := more + 1
    for a in d.axioms do
      edges := edges.push (edge n a)
      if !axioms.contains a then axioms := axioms.push a
  for l in library do
    nodes := nodes.push (node (toString l) "library" "library")
    for a in ← collectAxioms l do
      edges := edges.push (edge l a)
      if !axioms.contains a then axioms := axioms.push a
  for a in axioms do
    nodes := nodes.push (node (toString a) "axiom" (if a == ``sorryAx then "sorry" else "axiom"))
  let graph := Json.mkObj
    [("roots", toJson (roots.map toString)), ("nodes", Json.arr nodes), ("edges", Json.arr edges),
      ("hidden", toJson hidden), ("more", toJson more)]
  logInfo m!"formalizer-depgraph {graph.compress}"

end Formalizer.DepGraph

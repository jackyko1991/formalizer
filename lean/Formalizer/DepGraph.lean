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

/-- `#decl_status` prints (as one info message starting with `formalizer-decls `) every declaration written in this
file, for the research workspace's blueprint: its kind, the line it starts on, whether its own proof uses `sorry`,
every axiom it rests on (through the other declarations too), and the local declarations it uses. -/
syntax (name := declStatus) "#decl_status" : command

@[command_elab declStatus] def elabDeclStatus : CommandElab := fun _ => do
  let env ← getEnv
  let names := env.constants.foldStage2 (fun acc n _ => if owner n == n && !n.isInternal then acc.push n else acc) #[]
  let mut out : Array (Nat × Json) := #[]
  for n in names do
    let some ci := env.find? n | continue
    let kind := match ci with
      | .thmInfo _ => "theorem"
      | .defnInfo _ | .opaqueInfo _ => "def"
      | .axiomInfo _ => "axiom"
      | .inductInfo _ => "inductive"
      | _ => ""
    if kind.isEmpty then continue
    -- generated declarations (projections, instances Lean derives) have no range in the source: skip them
    let some ranges ← findDeclarationRanges? n | continue
    let d := depsOf env n
    let axioms ← collectAxioms n
    out := out.push (ranges.range.pos.line, Json.mkObj
      [("name", toJson (toString n)), ("kind", toJson kind), ("line", toJson ranges.range.pos.line),
        ("endLine", toJson ranges.range.endPos.line), ("sorry", toJson (d.axioms.contains ``sorryAx)),
        ("axioms", toJson (axioms.map toString)), ("uses", toJson (d.locals.map toString))])
  let sorted := out.qsort (fun a b => a.1 < b.1) |>.map (·.2)
  logInfo m!"formalizer-decls {(Json.arr sorted).compress}"

/-! ## What a statement rests on

`#statement_graph t₁ t₂ …` prints (as one info message starting with `formalizer-statement-graph `) what the
*statements* of the theorems `tᵢ` rest on: the dependency closure of their types (not their proofs), down to the
axioms. Every other declaration in the closure contributes its type and its value (a definition's meaning, a lemma's
proof), and an inductive type the types of its constructors, as in the Mathlib map (scripts/mathlib_graph/Gen.lean).

Folded like the Mathlib map: auxiliary declarations (`match_1`, `_proof_2`, `eq_1`, `brecOn`, …) and instances are
not nodes (whatever they use is used directly by whoever used them), and constructors and recursors stand for their
type. The closure (thousands of declarations under Mathlib's ℝ) is then pruned to at most `statementBudget` nodes,
like generate.py: the roots, the names in the statements, the reader's own declarations, a shortest path to each
axiom, a path to a few landmarks (ℕ, ℤ, ℝ, lists, sets, quotients…), then the nearest declarations, most used first.

Each node: `id`, `kind` (theorem · def · type · class · structure · axiom · opaque · quot), `module` (`""` for the
reader's own file), `depth` (steps from the nearest root), `own` (written in this file), `hidden` (its dependencies
left out). The graph also says how large the whole closure was (`closure`) and every axiom in it (`axioms`).
-/

/-- Nodes drawn at most. -/
def statementBudget : Nat := 120

/-- Declarations walked at most (Mathlib's ℝ alone reaches a few thousand); past it the closure is `truncated`. -/
def closureCap : Nat := 20000

/-- Components of generated helper declarations (anywhere in the name: `Nat.brecOn.go` is one too). -/
def helperParts : List String :=
  ["below", "brecOn", "binductionOn", "casesOn", "recOn", "noConfusion", "noConfusionType", "ibelow", "ctorIdx",
    "toCtorIdx", "sizeOf_spec", "eq_def", "induct", "mutual_induct", "induct_unfolding", "fun_cases", "eq_unfold",
    "proof_irrel_heq", "injEq", "ctorElim", "ctorElimType"]

def isDigits (s : String) : Bool := !s.isEmpty && s.all Char.isDigit

/-- A generated helper: a numeric or `_`-prefixed component, `match_n`, `proof_n`, `eq_n`, or a helper part. -/
def isHelper (n : Name) : Bool :=
  n.components.any fun c =>
    match c with
    | .str _ s =>
      s.startsWith "_" || (s.startsWith "match_" && isDigits (String.ofList (s.toList.drop 6)))
        || (s.startsWith "proof_" && isDigits (String.ofList (s.toList.drop 6)))
        || (s.startsWith "eq_" && isDigits (String.ofList (s.toList.drop 3))) || helperParts.contains s
    | .num _ _ => true
    | .anonymous => false

/-- Constructors and recursors stand for their inductive type. -/
def canon (env : Environment) (n : Name) : Name :=
  match env.find? n with
  | some (.ctorInfo c) => c.induct
  | some (.recInfo _) => n.getPrefix
  | _ => n

def shown (env : Environment) (n : Name) : Bool :=
  !isHelper n && !Meta.isInstanceCore env n

def allUses (env : Environment) (ci : ConstantInfo) : Array Name := Id.run do
  let mut out := ci.type.getUsedConstants
  if let some v := ci.value? (allowOpaque := true) then out := out ++ v.getUsedConstants
  if let .inductInfo i := ci then
    for c in i.ctors do
      if let some cc := env.find? c then out := out ++ cc.type.getUsedConstants
  return out

/-- What each folded declaration stands for (a reference, so the table is updated in place, never copied). -/
abbrev Memo := IO.Ref (Std.HashMap Name (Array Name))

/-- The shown declarations among `names`, looking through folded ones. -/
partial def shownDeps (env : Environment) (memo : Memo) (self : Name) (names : Array Name) : IO (Array Name) := do
  let mut out : Array Name := #[]
  let mut seen : Std.HashSet Name := {}
  for d0 in names do
    let d := canon env d0
    if d == self || seen.contains d then continue
    seen := seen.insert d
    if shown env d then
      out := out.push d
    else
      for e in ← foldedDeps d do
        if e != self && !seen.contains e then
          seen := seen.insert e
          out := out.push e
  return out
where
  /-- What a folded declaration (helper, instance) stands for. -/
  foldedDeps (n : Name) : IO (Array Name) := do
    if let some r := (← memo.get)[n]? then return r
    memo.modify (·.insert n #[]) -- cycle guard
    let some ci := env.find? n | return #[]
    let r ← shownDeps env memo n (allUses env ci)
    memo.modify (·.insert n r)
    return r

/-- What a shown declaration uses (its type and value; a root theorem: its type only). -/
def usesOf (env : Environment) (memo : Memo) (root : Bool) (n : Name) : IO (Array Name) := do
  let some ci := env.find? n | return #[]
  shownDeps env memo n (if root then ci.type.getUsedConstants else allUses env ci)

def declKind (env : Environment) (n : Name) : String :=
  match env.find? n with
  | some (.axiomInfo _) => "axiom"
  | some (.thmInfo _) => "theorem"
  | some (.quotInfo _) => "quot"
  | some (.opaqueInfo _) => "opaque"
  | some (.inductInfo _) => if isClass env n then "class" else if isStructure env n then "structure" else "type"
  | some (.defnInfo _) => if isClass env n then "class" else "def"
  | _ => "other"

/-- Kept, when the closure reaches them, with a path from a root (as in scripts/mathlib_graph/generate.py). -/
def landmarks : List Name :=
  [``Nat, ``Int, `Rat, `Real, `Complex, `CauSeq, `CauSeq.Completion.Cauchy, ``Quotient, ``Quot, ``Setoid, ``Eq,
    ``funext, `Set, `Finset, `Multiset, ``List, ``Fin, `ZMod, `Nat.Prime, `Polynomial, `Matrix, `Filter,
    `EuclideanSpace, `Real.sqrt, `Real.pi, ``Exists, ``Or, ``Not, ``Iff, ``And, ``Decidable, ``Bool]

syntax (name := statementGraph) "#statement_graph" (ppSpace ident)+ : command

@[command_elab statementGraph] def elabStatementGraph : CommandElab := fun stx => do
  let env ← getEnv
  let roots := stx[1].getArgs.map (·.getId) |>.filter env.contains
  -- breadth first from the roots: every declaration the statements rest on, its depth and the step it came from
  let memo : Memo ← IO.mkRef {}
  let mut uses : Std.HashMap Name (Array Name) := {}
  let mut depth : Std.HashMap Name Nat := {}
  let mut parent : Std.HashMap Name Name := {}
  let mut order : Array Name := #[]
  for r in roots do
    if !depth.contains r then
      depth := depth.insert r 0
      order := order.push r
  let mut i := 0
  let mut truncated := false
  while h : i < order.size do
    let n := order[i]
    i := i + 1
    let ds ← usesOf env memo (roots.contains n) n
    uses := uses.insert n ds
    let dn := depth.getD n 0
    for d in ds do
      if depth.contains d then continue
      if order.size ≥ closureCap then
        truncated := true
        continue
      depth := depth.insert d (dn + 1)
      parent := parent.insert d n
      order := order.push d
  -- in-closure in-degree: how many declarations of the closure use each one
  let mut used : Std.HashMap Name Nat := {}
  for n in order do
    for d in uses.getD n #[] do
      used := used.insert d (used.getD d 0 + 1)
  -- prune: roots, the statements' names, own declarations, a path to each axiom and landmark, then the nearest
  let mut keep : Std.HashSet Name := {}
  let mut kept : Array Name := #[]
  let pathTo := fun (v : Name) => Id.run do
    let mut p : Array Name := #[v]
    let mut c := v
    while true do
      match parent.get? c with
      | some q => p := p.push q; c := q
      | none => break
    return p
  let axioms := order.filter fun n => declKind env n == "axiom"
  let own := order.filter (isLocal env)
  let named := order.filter fun n => depth.getD n 0 == 1
  let mut wanted : Array Name := roots ++ axioms ++ own
  for l in landmarks do
    if depth.contains l then wanted := wanted.push l
  for n in named do
    if kept.size ≥ statementBudget * 2 / 5 then break
    if !keep.contains n then
      keep := keep.insert n
      kept := kept.push n
  for w in wanted do
    if kept.size ≥ statementBudget * 3 / 5 && !(axioms.contains w || own.contains w || roots.contains w) then
      continue
    for v in (pathTo w).reverse do
      if !keep.contains v then
        keep := keep.insert v
        kept := kept.push v
  let caps := fun (d : Nat) => if d == 1 then 34 else if d == 2 then 30 else if d == 3 then 20 else 12
  let mut taken : Std.HashMap Nat Nat := {}
  for v in kept do
    let d := depth.getD v 0
    taken := taken.insert d (taken.getD d 0 + 1)
  let candidates := order.qsort fun a b =>
    let da := depth.getD a 0
    let db := depth.getD b 0
    da < db || da == db && (used.getD a 0 > used.getD b 0 || used.getD a 0 == used.getD b 0 && a.toString < b.toString)
  for v in candidates do
    if kept.size ≥ statementBudget then break
    if keep.contains v then continue
    let d := depth.getD v 0
    if taken.getD d 0 ≥ caps d then continue
    -- only below something already drawn, so the picture stays connected
    let some p := parent.get? v | continue
    if !keep.contains p then continue
    keep := keep.insert v
    kept := kept.push v
    taken := taken.insert d (taken.getD d 0 + 1)
  let mut nodes : Array Json := #[]
  let mut edges : Array Json := #[]
  for v in kept do
    let ds := uses.getD v #[]
    let mut hiddenDeps := 0
    for d in ds do
      if keep.contains d then edges := edges.push (edge v d) else hiddenDeps := hiddenDeps + 1
    let module := match env.getModuleIdxFor? v with
      | some j => toString (env.header.moduleNames[j.toNat]?.getD .anonymous)
      | none => ""
    nodes := nodes.push (Json.mkObj
      [("id", toString v), ("kind", declKind env v), ("module", module), ("depth", toJson (depth.getD v 0)),
        ("own", toJson (isLocal env v)), ("hidden", toJson hiddenDeps)])
  let graph := Json.mkObj
    [("roots", toJson (roots.map toString)), ("nodes", Json.arr nodes), ("edges", Json.arr edges),
      ("closure", toJson order.size), ("truncated", toJson truncated),
      ("axioms", toJson (axioms.map toString))]
  logInfo m!"formalizer-statement-graph {graph.compress}"

end Formalizer.DepGraph

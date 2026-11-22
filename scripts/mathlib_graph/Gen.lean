/-
Formalizer · Mathlib map: the Lean side of the generator (run by generate.py, which documents the command).

It walks the declarations of the loaded environment (all of Mathlib) and writes raw JSON for generate.py to prune:

* FZ_MODE=graph   reads FZ_NAMES (one declaration per line) and writes FZ_OUT/raw_graph.json: the union of the
                  dependency closures of those roots, over "visible" declarations only (see `visible`), as
                  `{mods, nodes: [[name, kind, modIdx]], adj: [[i…]], roots: [[name, idx, closureSize]], missing}`.
* FZ_MODE=info    reads FZ_NAMES and writes FZ_OUT/raw_info.json: `{name: {sig, doc, line}}` (the statement as Lean
                  prints it with `ppSignature`, the docstring, the line of the declaration in its file).
* FZ_MODE=modules writes FZ_OUT/raw_modules.json: every module with its direct imports and how many visible
                  theorems / definitions it declares.

A dependency of `c` is every constant that occurs in its type or its value (proof term), plus, for an inductive type,
in the types of its constructors (`Expr.getUsedConstants`). Constructors and recursors stand for their type. Auxiliary
declarations (`match_1`, `_proof_2`, `eq_1`, `casesOn`, `brecOn`, …) and instances are *collapsed*: they are not
nodes, and whatever they use is used directly by whoever used them.
-/
import Mathlib

open Lean Meta

namespace FzGraph

/-- Components of auto-generated helper declarations (anywhere in the name: `Nat.brecOn.go` is one too). -/
def auxParts : List String :=
  ["below", "brecOn", "binductionOn", "casesOn", "recOn", "noConfusion", "noConfusionType", "ibelow", "ctorIdx",
   "toCtorIdx", "sizeOf_spec", "eq_def", "induct", "mutual_induct", "induct_unfolding", "fun_cases", "eq_unfold",
   "proof_irrel_heq", "injEq", "ctorElim", "ctorElimType"]

def isDigits (s : String) : Bool := !s.isEmpty && s.all Char.isDigit

/-- An auto-generated helper: a numeric or `_`-prefixed component, `match_n`, `proof_n`, `eq_n`, or a helper part. -/
def isAux (n : Name) : Bool :=
  let bad := n.components.any fun c =>
    match c with
    | .str _ s =>
      s.startsWith "_" || (s.startsWith "match_" && isDigits (String.ofList (s.toList.drop 6)))
        || (s.startsWith "proof_" && isDigits (String.ofList (s.toList.drop 6)))
        || (s.startsWith "eq_" && isDigits (String.ofList (s.toList.drop 3))) || auxParts.contains s
    | .num _ _ => true
    | .anonymous => false
  bad

/-- Constructors and recursors stand for their inductive type. -/
def canon (env : Environment) (n : Name) : Name :=
  match env.find? n with
  | some (.ctorInfo c) => c.induct
  | some (.recInfo _) => n.getPrefix
  | _ => n

def visible (env : Environment) (n : Name) : Bool :=
  !isAux n && !isInstanceCore env n

def directUses (env : Environment) (ci : ConstantInfo) : Array Name := Id.run do
  let mut out := ci.type.getUsedConstants
  if let some v := ci.value? (allowOpaque := true) then out := out ++ v.getUsedConstants
  if let .inductInfo i := ci then
    for c in i.ctors do
      if let some cc := env.find? c then out := out ++ cc.type.getUsedConstants
  return out

/-- The visible declarations `n` uses, looking through collapsed ones (memoised). -/
partial def vdeps (env : Environment) (memo : IO.Ref (Std.HashMap Name (Array Name))) (n : Name) : IO (Array Name) := do
  if let some r := (← memo.get)[n]? then return r
  memo.modify (·.insert n #[]) -- cycle guard
  let some ci := env.find? n | return #[]
  let mut out : Std.HashSet Name := {}
  for d0 in directUses env ci do
    let d := canon env d0
    if d == n then continue
    if visible env d then out := out.insert d
    else
      for e in ← vdeps env memo d do
        if e != n then out := out.insert e
  let r := out.toArray
  memo.modify (·.insert n r)
  return r

def kindOf (env : Environment) (n : Name) : String :=
  match env.find? n with
  | some (.axiomInfo _) => "axiom"
  | some (.thmInfo _) => "thm"
  | some (.quotInfo _) => "quot"
  | some (.opaqueInfo _) => "opaque"
  | some (.inductInfo _) => if isClass env n then "class" else if isStructure env n then "structure" else "inductive"
  | some (.defnInfo _) => if isClass env n then "class" else "def"
  | _ => "other"

def modIdx (env : Environment) (n : Name) : Int :=
  match env.getModuleIdxFor? n with
  | some i => (i.toNat : Int)
  | none => -1

def readNames (path : String) : IO (Array Name) := do
  let lines ← IO.FS.lines path
  return lines.filterMap fun l => let t := l.trimAscii.toString; if t.isEmpty then none else some t.toName

def modsJson (env : Environment) : Json :=
  Json.arr (env.header.moduleNames.map fun m => Json.str m.toString)

def graph (out : String) (names : Array Name) : CoreM Unit := do
  let env ← getEnv
  let memo ← IO.mkRef ({} : Std.HashMap Name (Array Name))
  let mut index : Std.HashMap Name Nat := {}
  let mut order : Array Name := #[]
  let mut roots : Array Json := #[]
  let mut missing : Array Json := #[]
  for root in names do
    if (env.find? root).isNone then
      missing := missing.push (Json.str root.toString)
      continue
    let mut seen : Std.HashSet Name := {}
    seen := seen.insert root
    let mut queue : Array Name := #[root]
    let mut i := 0
    while i < queue.size do
      let n := queue[i]!
      i := i + 1
      if !index.contains n then
        index := index.insert n order.size
        order := order.push n
      for d in ← vdeps env memo n do
        if !seen.contains d then
          seen := seen.insert d
          queue := queue.push d
    roots := roots.push (Json.arr #[Json.str root.toString, Json.num (index[root]!), Json.num seen.size])
    IO.eprintln s!"{root}: {seen.size} declarations"
  let nodes := order.map fun n => Json.arr #[Json.str n.toString, Json.str (kindOf env n), Json.num (modIdx env n)]
  let mut adj : Array Json := #[]
  for n in order do
    let ds ← vdeps env memo n
    adj := adj.push (Json.arr (ds.filterMap fun d => (index[d]?).map fun (j : Nat) => Json.num j))
  let j := Json.mkObj [("mods", modsJson env), ("nodes", Json.arr nodes), ("adj", Json.arr adj),
    ("roots", Json.arr roots), ("missing", Json.arr missing)]
  IO.FS.writeFile (out ++ "/raw_graph.json") j.compress

def info (out : String) (names : Array Name) : MetaM Unit := do
  let env ← getEnv
  let mut fields : Array (String × Json) := #[]
  for n in names do
    if (env.find? n).isNone then continue
    let sig ← try
        pure (toString (← PrettyPrinter.ppSignature n).fmt)
      catch _ => pure ""
    let doc := (← findDocString? env n).getD ""
    let line := match ← findDeclarationRanges? n with
      | some r => r.range.pos.line
      | none => 0
    fields := fields.push (n.toString, Json.mkObj [("sig", Json.str sig), ("doc", Json.str doc), ("line", Json.num line)])
  IO.FS.writeFile (out ++ "/raw_info.json") (Json.mkObj fields.toList).compress

def modules (out : String) : CoreM Unit := do
  let env ← getEnv
  let k := env.header.moduleNames.size
  let mut thms : Array Nat := Array.replicate k 0
  let mut defs : Array Nat := Array.replicate k 0
  for (n, ci) in env.constants.map₁.toList do
    if isAux n || isInstanceCore env n then continue
    let some i := env.getModuleIdxFor? n | continue
    let i := i.toNat
    match ci with
    | .thmInfo _ => thms := thms.modify i (· + 1)
    | .defnInfo _ | .inductInfo _ | .opaqueInfo _ | .axiomInfo _ => defs := defs.modify i (· + 1)
    | _ => pure ()
  let mut mods : Array Json := #[]
  for i in [0:k] do
    let imps := env.header.moduleData[i]!.imports.map fun im => Json.str im.module.toString
    mods := mods.push (Json.arr #[Json.str env.header.moduleNames[i]!.toString, Json.arr imps, Json.num thms[i]!,
      Json.num defs[i]!])
  IO.FS.writeFile (out ++ "/raw_modules.json") (Json.arr mods).compress

def main : MetaM Unit := do
  let mode := (← IO.getEnv "FZ_MODE").getD "graph"
  let out := (← IO.getEnv "FZ_OUT").getD "."
  let names ← match ← IO.getEnv "FZ_NAMES" with
    | some p => readNames p
    | none => pure #[]
  match mode with
  | "graph" => graph out names
  | "info" => info out names
  | "modules" => modules out
  | m => throwError "unknown FZ_MODE {m}"

end FzGraph

#eval FzGraph.main

/**
 * The natural-language mirror of every problem outside the tutorial track: one proof, two languages.
 *
 * The natural-language proof and the Lean proof are mirrors of each other; neither alone is the complete proof, the
 * cross-linked pair is. Per problem: the statement read as a mathematician would, piece by piece, each piece with the
 * exact text of the problem's start file that says it in Lean (in order); and the proof as a mathematician writes it,
 * each step mapped to the lines of the reference solution (1-based, inclusive, in order) with those lines trimmed as
 * anchors. The natural language says exactly what the Lean says: ℕ, ℤ or ℝ, ≤ or <, edge cases such as n = 0, and
 * Lean's junk values where they matter. In the research showcase a key lemma may be open in the start file: the step
 * that states or uses it says so. In the pitfalls, the steps say where the classical claim or argument breaks.
 *
 * `goal` (Lean's goal right before the step) is given for the Lite problems only, each one captured from Lean
 * v4.34.1 with `trace_state` inserted before the step's first line; the Full (Mathlib) problems have none.
 * Tutorial problems keep their mirror in tutorialGuide.ts (GUIDE); `mirrorFor` serves both.
 * tests/proofMirror.test.ts checks every piece and anchor against problems/*.json.
 */
import { GUIDE, type MirrorPiece, type PaperStep } from "./tutorialGuide.ts";

export interface ProblemMirror {
  /** the statement in natural language, piece by piece, each piece with its exact Lean text (in order) */
  statementMirror: MirrorPiece[];
  /** the natural-language proof, step by step, each step mapped to solution lines */
  paper: PaperStep[];
}

export const MIRRORS: Record<string, ProblemMirror> = {
  "geo-pythagoras": {
    statementMirror: [
      { human: ["Theorem (pythagoras_3_4_5):", "定理（pythagoras_3_4_5）："], lean: "theorem pythagoras_3_4_5" },
      { human: ["For the natural numbers $3$, $4$, $5$: $3^2 + 4^2 = 5^2$.", "對自然數 $3$、$4$、$5$：$3^2 + 4^2 = 5^2$。"], lean: ": 3 ^ 2 + 4 ^ 2 = 5 ^ 2" },
    ],
    paper: [
      {
        text: ["We check that the sides $3$, $4$, $5$ satisfy Pythagoras' relation $a^2 + b^2 = c^2$.", "我們檢查邊長 $3$、$4$、$5$ 滿足畢氏關係 $a^2 + b^2 = c^2$。"],
        lines: [1, 1],
        lean: ["theorem pythagoras_3_4_5 : 3 ^ 2 + 4 ^ 2 = 5 ^ 2 := by"],
      },
      {
        text: ["$3^2 + 4^2 = 9 + 16 = 25 = 5^2$: a computation.", "$3^2 + 4^2 = 9 + 16 = 25 = 5^2$：直接計算。"],
        lines: [2, 2],
        lean: ["decide"],
        goal: "⊢ 3 ^ 2 + 4 ^ 2 = 5 ^ 2",
      },
    ],
  },
  "geo-distance": {
    statementMirror: [
      { human: ["A point has two integer coordinates $x$ and $y$.", "一個點有兩個整數座標 $x$ 與 $y$。"], lean: "structure Point where\n  x : Int\n  y : Int" },
      { human: ["Its squared distance to $q$ is $d^2(p, q) = (p_x - q_x)^2 + (p_y - q_y)^2$, an integer: no square root is taken.", "$p$ 到 $q$ 的距離平方是 $d^2(p, q) = (p_x - q_x)^2 + (p_y - q_y)^2$，是一個整數：不開平方根。"], lean: "def dist2 (p q : Point) : Int :=\n  (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y)" },
      { human: ["Theorem (dist_1_2_to_4_6):", "定理（dist_1_2_to_4_6）："], lean: "theorem dist_1_2_to_4_6" },
      { human: ["The squared distance from $(1, 2)$ to $(4, 6)$ is $25$, so the two points are $5$ apart.", "從 $(1, 2)$ 到 $(4, 6)$ 的距離平方是 $25$，所以兩點相距 $5$。"], lean: ": dist2 ⟨1, 2⟩ ⟨4, 6⟩ = 25" },
    ],
    paper: [
      {
        text: ["Points have integer coordinates; by Pythagoras on the horizontal and vertical differences, the squared distance is $d^2(p, q) = (p_x - q_x)^2 + (p_y - q_y)^2$.", "點有整數座標；對水平差與垂直差用畢氏定理，距離平方是 $d^2(p, q) = (p_x - q_x)^2 + (p_y - q_y)^2$。"],
        lines: [1, 6],
        lean: ["structure Point where", "x : Int", "y : Int", "def dist2 (p q : Point) : Int :=", "(p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y)"],
      },
      {
        text: ["We show $d^2((1, 2), (4, 6)) = 25$.", "我們證明 $d^2((1, 2), (4, 6)) = 25$。"],
        lines: [8, 8],
        lean: ["theorem dist_1_2_to_4_6 : dist2 ⟨1, 2⟩ ⟨4, 6⟩ = 25 := by"],
      },
      {
        text: ["By the definition, $d^2((1, 2), (4, 6)) = (1 - 4)^2 + (2 - 6)^2$,", "依定義，$d^2((1, 2), (4, 6)) = (1 - 4)^2 + (2 - 6)^2$，"],
        lines: [9, 9],
        lean: ["unfold dist2"],
        goal: "⊢ dist2 { x := 1, y := 2 } { x := 4, y := 6 } = 25",
      },
      {
        text: ["$= (-3)^2 + (-4)^2 = 9 + 16 = 25$.", "$= (-3)^2 + (-4)^2 = 9 + 16 = 25$。"],
        lines: [10, 10],
        lean: ["decide"],
        goal: "⊢ ({ x := 1, y := 2 }.x - { x := 4, y := 6 }.x) * ({ x := 1, y := 2 }.x - { x := 4, y := 6 }.x) +\n      ({ x := 1, y := 2 }.y - { x := 4, y := 6 }.y) * ({ x := 1, y := 2 }.y - { x := 4, y := 6 }.y) =\n    25",
      },
    ],
  },
  "geo-perpendicular": {
    statementMirror: [
      { human: ["A vector has two integer components $x$ and $y$.", "一個向量有兩個整數分量 $x$ 與 $y$。"], lean: "structure Vec where\n  x : Int\n  y : Int" },
      { human: ["The dot product is $u \\cdot v = u_x v_x + u_y v_y$.", "內積是 $u \\cdot v = u_x v_x + u_y v_y$。"], lean: "def dot (u v : Vec) : Int :=\n  u.x * v.x + u.y * v.y" },
      { human: ["Theorem (quarter_turn_perp):", "定理（quarter_turn_perp）："], lean: "theorem quarter_turn_perp" },
      { human: ["$(3, 4) \\cdot (-4, 3) = 0$: the two arrows are perpendicular.", "$(3, 4) \\cdot (-4, 3) = 0$：兩支箭頭互相垂直。"], lean: ": dot ⟨3, 4⟩ ⟨-4, 3⟩ = 0" },
    ],
    paper: [
      {
        text: ["Vectors have integer components, and $u \\cdot v = u_x v_x + u_y v_y$; two nonzero vectors are perpendicular exactly when $u \\cdot v = 0$.", "向量有整數分量，$u \\cdot v = u_x v_x + u_y v_y$；兩個非零向量互相垂直，恰好在 $u \\cdot v = 0$ 的時候。"],
        lines: [1, 6],
        lean: ["structure Vec where", "x : Int", "y : Int", "def dot (u v : Vec) : Int :=", "u.x * v.x + u.y * v.y"],
      },
      {
        text: ["We show $(3, 4) \\cdot (-4, 3) = 0$.", "我們證明 $(3, 4) \\cdot (-4, 3) = 0$。"],
        lines: [8, 8],
        lean: ["theorem quarter_turn_perp : dot ⟨3, 4⟩ ⟨-4, 3⟩ = 0 := by"],
      },
      {
        text: ["By the definition, the dot product is $3 \\cdot (-4) + 4 \\cdot 3$,", "依定義，內積是 $3 \\cdot (-4) + 4 \\cdot 3$，"],
        lines: [9, 9],
        lean: ["unfold dot"],
        goal: "⊢ dot { x := 3, y := 4 } { x := -4, y := 3 } = 0",
      },
      {
        text: ["$= -12 + 12 = 0$.", "$= -12 + 12 = 0$。"],
        lines: [10, 10],
        lean: ["decide"],
        goal: "⊢ { x := 3, y := 4 }.x * { x := -4, y := 3 }.x + { x := 3, y := 4 }.y * { x := -4, y := 3 }.y = 0",
      },
    ],
  },
  "geo-collinear": {
    statementMirror: [
      { human: ["A point has two integer coordinates $x$ and $y$.", "一個點有兩個整數座標 $x$ 與 $y$。"], lean: "structure Point where\n  x : Int\n  y : Int" },
      { human: ["$p$, $q$, $r$ are collinear means: $(q_x - p_x)(r_y - p_y) - (q_y - p_y)(r_x - p_x) = 0$, i.e. twice the signed area of the triangle $pqr$ is $0$.", "$p$、$q$、$r$ 共線的意思是：$(q_x - p_x)(r_y - p_y) - (q_y - p_y)(r_x - p_x) = 0$，也就是三角形 $pqr$ 帶正負號面積的兩倍是 $0$。"], lean: "def collinear (p q r : Point) : Prop :=\n  (q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x) = 0" },
      { human: ["Theorem (on_line_y_eq_2x_sub_1):", "定理（on_line_y_eq_2x_sub_1）："], lean: "theorem on_line_y_eq_2x_sub_1" },
      { human: ["$(1, 1)$, $(2, 3)$, $(4, 7)$ are collinear.", "$(1, 1)$、$(2, 3)$、$(4, 7)$ 共線。"], lean: ": collinear ⟨1, 1⟩ ⟨2, 3⟩ ⟨4, 7⟩" },
    ],
    paper: [
      {
        text: ["Collinearity of $p$, $q$, $r$ is the statement that $(q_x - p_x)(r_y - p_y) - (q_y - p_y)(r_x - p_x) = 0$ (the triangle $pqr$ is flat).", "$p$、$q$、$r$ 共線，是指 $(q_x - p_x)(r_y - p_y) - (q_y - p_y)(r_x - p_x) = 0$ 這個陳述（三角形 $pqr$ 是扁的）。"],
        lines: [1, 6],
        lean: ["structure Point where", "x : Int", "y : Int", "def collinear (p q r : Point) : Prop :=", "(q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x) = 0"],
      },
      {
        text: ["We show $(1, 1)$, $(2, 3)$, $(4, 7)$ are collinear.", "我們證明 $(1, 1)$、$(2, 3)$、$(4, 7)$ 共線。"],
        lines: [8, 8],
        lean: ["theorem on_line_y_eq_2x_sub_1 : collinear ⟨1, 1⟩ ⟨2, 3⟩ ⟨4, 7⟩ := by"],
      },
      {
        text: ["By the definition, this says $(2 - 1)(7 - 1) - (3 - 1)(4 - 1) = 0$,", "依定義，這是說 $(2 - 1)(7 - 1) - (3 - 1)(4 - 1) = 0$，"],
        lines: [9, 9],
        lean: ["unfold collinear"],
        goal: "⊢ collinear { x := 1, y := 1 } { x := 2, y := 3 } { x := 4, y := 7 }",
      },
      {
        text: ["and indeed $1 \\cdot 6 - 2 \\cdot 3 = 0$. (All three lie on $y = 2x - 1$.)", "確實 $1 \\cdot 6 - 2 \\cdot 3 = 0$。（三點都在 $y = 2x - 1$ 上。）"],
        lines: [10, 10],
        lean: ["rfl"],
        goal: "⊢ ({ x := 2, y := 3 }.x - { x := 1, y := 1 }.x) * ({ x := 4, y := 7 }.y - { x := 1, y := 1 }.y) -\n      ({ x := 2, y := 3 }.y - { x := 1, y := 1 }.y) * ({ x := 4, y := 7 }.x - { x := 1, y := 1 }.x) =\n    0",
      },
    ],
  },
  "geo-dist-symm": {
    statementMirror: [
      { human: ["A point has two integer coordinates $x$ and $y$.", "一個點有兩個整數座標 $x$ 與 $y$。"], lean: "structure Point where\n  x : Int\n  y : Int" },
      { human: ["Its squared distance to $q$ is $d^2(p, q) = (p_x - q_x)^2 + (p_y - q_y)^2$, an integer: no square root is taken.", "$p$ 到 $q$ 的距離平方是 $d^2(p, q) = (p_x - q_x)^2 + (p_y - q_y)^2$，是一個整數：不開平方根。"], lean: "def dist2 (p q : Point) : Int :=\n  (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y)" },
      { human: ["Theorem (dist2_symm):", "定理（dist2_symm）："], lean: "theorem dist2_symm" },
      { human: ["for any points $p$ and $q$,", "對任意兩點 $p$ 與 $q$，"], lean: "(p q : Point)" },
      { human: ["$d^2(p, q) = d^2(q, p)$.", "$d^2(p, q) = d^2(q, p)$。"], lean: ": dist2 p q = dist2 q p" },
    ],
    paper: [
      {
        text: ["Points have integer coordinates and $d^2(p, q) = (p_x - q_x)^2 + (p_y - q_y)^2$.", "點有整數座標，$d^2(p, q) = (p_x - q_x)^2 + (p_y - q_y)^2$。"],
        lines: [1, 6],
        lean: ["structure Point where", "x : Int", "y : Int", "def dist2 (p q : Point) : Int :=", "(p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y)"],
      },
      {
        text: ["Let $p$, $q$ be any points; we show $d^2(p, q) = d^2(q, p)$.", "設 $p$、$q$ 為任意兩點；我們證明 $d^2(p, q) = d^2(q, p)$。"],
        lines: [8, 8],
        lean: ["theorem dist2_symm (p q : Point) : dist2 p q = dist2 q p := by"],
      },
      {
        text: ["Written out, the claim is $(p_x - q_x)^2 + (p_y - q_y)^2 = (q_x - p_x)^2 + (q_y - p_y)^2$.", "寫開來，要證的是 $(p_x - q_x)^2 + (p_y - q_y)^2 = (q_x - p_x)^2 + (q_y - p_y)^2$。"],
        lines: [9, 9],
        lean: ["unfold dist2"],
        goal: "p q : Point\n⊢ dist2 p q = dist2 q p",
      },
      {
        text: ["Each square is unchanged when the sign inside flips: $(a - b)^2 = a^2 - 2ab + b^2 = (b - a)^2$. Expanding both sides gives the same polynomial.", "平方裡的正負號翻過來不影響平方：$(a - b)^2 = a^2 - 2ab + b^2 = (b - a)^2$。兩邊展開後是同一個多項式。"],
        lines: [10, 10],
        lean: ["grind"],
        goal: "p q : Point\n⊢ (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y) = (q.x - p.x) * (q.x - p.x) + (q.y - p.y) * (q.y - p.y)",
      },
    ],
  },
  "geo-pythagoras-vectors": {
    statementMirror: [
      { human: ["For integer vectors $a = (a_1, a_2)$, $b = (b_1, b_2)$: $a \\cdot b = a_1 b_1 + a_2 b_2$,", "對整數向量 $a = (a_1, a_2)$、$b = (b_1, b_2)$：$a \\cdot b = a_1 b_1 + a_2 b_2$，"], lean: "def dot (a b : Int × Int) : Int := a.1 * b.1 + a.2 * b.2" },
      { human: ["and the squared length is $\\|a\\|^2 = a \\cdot a$.", "長度平方是 $\\|a\\|^2 = a \\cdot a$。"], lean: "def normSq (a : Int × Int) : Int := dot a a" },
      { human: ["Theorem (pythagoras_vectors):", "定理（pythagoras_vectors）："], lean: "theorem pythagoras_vectors" },
      { human: ["Let $a$, $b$ be integer vectors", "設 $a$、$b$ 為整數向量，"], lean: "(a b : Int × Int)" },
      { human: ["that are perpendicular: $a \\cdot b = 0$.", "且互相垂直：$a \\cdot b = 0$。"], lean: "(h : dot a b = 0)" },
      { human: ["Then $\\|a + b\\|^2 = \\|a\\|^2 + \\|b\\|^2$ (with $a + b = (a_1 + b_1, a_2 + b_2)$).", "則 $\\|a + b\\|^2 = \\|a\\|^2 + \\|b\\|^2$（其中 $a + b = (a_1 + b_1, a_2 + b_2)$）。"], lean: "normSq (a.1 + b.1, a.2 + b.2) = normSq a + normSq b" },
    ],
    paper: [
      {
        text: ["For integer vectors, $a \\cdot b = a_1 b_1 + a_2 b_2$ and $\\|a\\|^2 = a \\cdot a = a_1^2 + a_2^2$.", "對整數向量，$a \\cdot b = a_1 b_1 + a_2 b_2$，$\\|a\\|^2 = a \\cdot a = a_1^2 + a_2^2$。"],
        lines: [1, 5],
        lean: ["/-- the dot product of two integer vectors, written with their components -/", "def dot (a b : Int × Int) : Int := a.1 * b.1 + a.2 * b.2", "/-- the squared length ‖a‖² = a · a -/", "def normSq (a : Int × Int) : Int := dot a a"],
      },
      {
        text: ["Suppose $a \\cdot b = 0$; we show $\\|a + b\\|^2 = \\|a\\|^2 + \\|b\\|^2$.", "假設 $a \\cdot b = 0$；我們證明 $\\|a + b\\|^2 = \\|a\\|^2 + \\|b\\|^2$。"],
        lines: [7, 8],
        lean: ["theorem pythagoras_vectors (a b : Int × Int) (h : dot a b = 0) :", "normSq (a.1 + b.1, a.2 + b.2) = normSq a + normSq b := by"],
      },
      {
        text: ["In components: the hypothesis is $a_1 b_1 + a_2 b_2 = 0$, and the claim is $(a_1 + b_1)^2 + (a_2 + b_2)^2 = a_1^2 + a_2^2 + b_1^2 + b_2^2$.", "寫成分量：假設是 $a_1 b_1 + a_2 b_2 = 0$，要證的是 $(a_1 + b_1)^2 + (a_2 + b_2)^2 = a_1^2 + a_2^2 + b_1^2 + b_2^2$。"],
        lines: [9, 9],
        lean: ["unfold normSq dot at *"],
        goal: "a b : Int × Int\nh : dot a b = 0\n⊢ normSq (a.fst + b.fst, a.snd + b.snd) = normSq a + normSq b",
      },
      {
        text: ["Expanding, the left side is the right side plus $2(a_1 b_1 + a_2 b_2)$, which is $0$ by the hypothesis.", "展開後，左邊等於右邊加上 $2(a_1 b_1 + a_2 b_2)$，而由假設它是 $0$。"],
        lines: [10, 10],
        lean: ["grind"],
        goal: "a b : Int × Int\nh : a.fst * b.fst + a.snd * b.snd = 0\n⊢ (a.fst + b.fst, a.snd + b.snd).fst * (a.fst + b.fst, a.snd + b.snd).fst +\n      (a.fst + b.fst, a.snd + b.snd).snd * (a.fst + b.fst, a.snd + b.snd).snd =\n    a.fst * a.fst + a.snd * a.snd + (b.fst * b.fst + b.snd * b.snd)",
      },
    ],
  },
  "geo-shift": {
    statementMirror: [
      { human: ["A point has two integer coordinates $x$ and $y$.", "一個點有兩個整數座標 $x$ 與 $y$。"], lean: "structure Point where\n  x : Int\n  y : Int" },
      { human: ["Its squared distance to $q$ is $d^2(p, q) = (p_x - q_x)^2 + (p_y - q_y)^2$, an integer: no square root is taken.", "$p$ 到 $q$ 的距離平方是 $d^2(p, q) = (p_x - q_x)^2 + (p_y - q_y)^2$，是一個整數：不開平方根。"], lean: "def dist2 (p q : Point) : Int :=\n  (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y)" },
      { human: ["Sliding $p$ by $a$ to the right and $b$ up gives the point $(p_x + a, p_y + b)$.", "把 $p$ 往右移 $a$、往上移 $b$，得到點 $(p_x + a, p_y + b)$。"], lean: "def shift (p : Point) (a b : Int) : Point :=\n  ⟨p.x + a, p.y + b⟩" },
      { human: ["Theorem (dist2_shift):", "定理（dist2_shift）："], lean: "theorem dist2_shift" },
      { human: ["For any points $p$, $q$ and integers $a$, $b$,", "對任意兩點 $p$、$q$ 與整數 $a$、$b$，"], lean: "(p q : Point) (a b : Int)" },
      { human: ["sliding both by the same $(a, b)$ keeps their squared distance.", "把兩點都移動同樣的 $(a, b)$，距離平方不變。"], lean: "dist2 (shift p a b) (shift q a b) = dist2 p q" },
    ],
    paper: [
      {
        text: ["Points have integer coordinates, $d^2(p, q) = (p_x - q_x)^2 + (p_y - q_y)^2$, and the shift by $(a, b)$ sends $p$ to $(p_x + a, p_y + b)$.", "點有整數座標，$d^2(p, q) = (p_x - q_x)^2 + (p_y - q_y)^2$，移動 $(a, b)$ 把 $p$ 送到 $(p_x + a, p_y + b)$。"],
        lines: [1, 9],
        lean: ["structure Point where", "x : Int", "y : Int", "def dist2 (p q : Point) : Int :=", "(p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y)", "def shift (p : Point) (a b : Int) : Point :=", "⟨p.x + a, p.y + b⟩"],
      },
      {
        text: ["Let $p$, $q$ be points and $a$, $b$ integers; we show the shifted points are as far apart as $p$ and $q$.", "設 $p$、$q$ 為點，$a$、$b$ 為整數；我們證明移動後的兩點與 $p$、$q$ 一樣遠。"],
        lines: [11, 12],
        lean: ["theorem dist2_shift (p q : Point) (a b : Int) :", "dist2 (shift p a b) (shift q a b) = dist2 p q := by"],
      },
      {
        text: ["Written out, the left side is $((p_x + a) - (q_x + a))^2 + ((p_y + b) - (q_y + b))^2$.", "寫開來，左邊是 $((p_x + a) - (q_x + a))^2 + ((p_y + b) - (q_y + b))^2$。"],
        lines: [13, 13],
        lean: ["unfold dist2 shift"],
        goal: "p q : Point\na b : Int\n⊢ dist2 (shift p a b) (shift q a b) = dist2 p q",
      },
      {
        text: ["The differences do not change: $(p_x + a) - (q_x + a) = p_x - q_x$ and $(p_y + b) - (q_y + b) = p_y - q_y$.", "差不會改變：$(p_x + a) - (q_x + a) = p_x - q_x$，$(p_y + b) - (q_y + b) = p_y - q_y$。"],
        lines: [14, 15],
        lean: ["have hx : p.x + a - (q.x + a) = p.x - q.x := by omega", "have hy : p.y + b - (q.y + b) = p.y - q.y := by omega"],
        goal: "p q : Point\na b : Int\n⊢ ({ x := p.x + a, y := p.y + b }.x - { x := q.x + a, y := q.y + b }.x) *\n        ({ x := p.x + a, y := p.y + b }.x - { x := q.x + a, y := q.y + b }.x) +\n      ({ x := p.x + a, y := p.y + b }.y - { x := q.x + a, y := q.y + b }.y) *\n        ({ x := p.x + a, y := p.y + b }.y - { x := q.x + a, y := q.y + b }.y) =\n    (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y)",
      },
      {
        text: ["Substituting them, both sides are $(p_x - q_x)^2 + (p_y - q_y)^2$.", "把它們代進去，兩邊都是 $(p_x - q_x)^2 + (p_y - q_y)^2$。"],
        lines: [16, 16],
        lean: ["rw [hx, hy]"],
        goal: "p q : Point\na b : Int\nhx : p.x + a - (q.x + a) = p.x - q.x\nhy : p.y + b - (q.y + b) = p.y - q.y\n⊢ ({ x := p.x + a, y := p.y + b }.x - { x := q.x + a, y := q.y + b }.x) *\n        ({ x := p.x + a, y := p.y + b }.x - { x := q.x + a, y := q.y + b }.x) +\n      ({ x := p.x + a, y := p.y + b }.y - { x := q.x + a, y := q.y + b }.y) *\n        ({ x := p.x + a, y := p.y + b }.y - { x := q.x + a, y := q.y + b }.y) =\n    (p.x - q.x) * (p.x - q.x) + (p.y - q.y) * (p.y - q.y)",
      },
    ],
  },
  "geo-pythagoras-euclid": {
    statementMirror: [
      { human: ["Theorem (pythagoras_euclid):", "定理（pythagoras_euclid）："], lean: "theorem pythagoras_euclid" },
      { human: ["In a Euclidean affine space $P$ of any dimension, whose translations form a real inner product space $V$,", "在任意維度的歐氏仿射空間 $P$ 中（它的平移構成實內積空間 $V$），"], lean: "{V P : Type*} [NormedAddCommGroup V] [InnerProductSpace ℝ V]\n    [MetricSpace P] [NormedAddTorsor V P]" },
      { human: ["let $A$, $B$, $C$ be points", "設 $A$、$B$、$C$ 為點，"], lean: "(A B C : P)" },
      { human: ["with a right angle at $B$: $\\angle ABC = \\pi/2$ (the unoriented angle, in $[0, \\pi]$; by Mathlib's convention it is also $\\pi/2$ when $A = B$ or $C = B$, and then the claim holds trivially).", "且在 $B$ 是直角：$\\angle ABC = \\pi/2$（不帶方向的角，介於 $0$ 與 $\\pi$ 之間；依 Mathlib 的約定，$A = B$ 或 $C = B$ 時它也是 $\\pi/2$，那時結論顯然成立）。"], lean: "(h : ∠ A B C = Real.pi / 2)" },
      { human: ["Then $AC^2 = AB^2 + CB^2$.", "則 $AC^2 = AB^2 + CB^2$。"], lean: "dist A C * dist A C = dist A B * dist A B + dist C B * dist C B" },
    ],
    paper: [
      {
        text: ["Let $A$, $B$, $C$ be points of a Euclidean space with $\\angle ABC = \\pi/2$; we show $AC^2 = AB^2 + CB^2$.", "設 $A$、$B$、$C$ 為歐氏空間中的點，$\\angle ABC = \\pi/2$；我們證明 $AC^2 = AB^2 + CB^2$。"],
        lines: [6, 8],
        lean: ["theorem pythagoras_euclid {V P : Type*} [NormedAddCommGroup V] [InnerProductSpace ℝ V]", "[MetricSpace P] [NormedAddTorsor V P] (A B C : P) (h : ∠ A B C = Real.pi / 2) :", "dist A C * dist A C = dist A B * dist A B + dist C B * dist C B := by"],
      },
      {
        text: ["Put $u = A - B$ and $v = C - B$. Then $AC^2 = \\|u - v\\|^2 = \\|u\\|^2 + \\|v\\|^2 - 2\\langle u, v\\rangle$, so $AC^2 = AB^2 + CB^2$ holds exactly when $\\langle u, v\\rangle = 0$, that is, when $\\angle ABC = \\pi/2$. Mathlib has this equivalence as a theorem; rewriting with it turns the claim into the angle condition.", "令 $u = A - B$、$v = C - B$。則 $AC^2 = \\|u - v\\|^2 = \\|u\\|^2 + \\|v\\|^2 - 2\\langle u, v\\rangle$，所以 $AC^2 = AB^2 + CB^2$ 恰好在 $\\langle u, v\\rangle = 0$ 時成立，也就是 $\\angle ABC = \\pi/2$。Mathlib 把這個等價寫成定理；用它改寫，要證的就變成角的條件。"],
        lines: [9, 9],
        lean: ["rw [dist_sq_eq_dist_sq_add_dist_sq_iff_angle_eq_pi_div_two]"],
      },
      {
        text: ["And that is the hypothesis.", "而這正是假設。"],
        lines: [10, 10],
        lean: ["exact h"],
      },
    ],
  },
  "la-det-identity": {
    statementMirror: [
      { human: ["A $2 \\times 2$ matrix $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$ has four integer entries.", "$2 \\times 2$ 矩陣 $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$ 有四個整數元素。"], lean: "structure Mat2 where\n  a : Int\n  b : Int\n  c : Int\n  d : Int" },
      { human: ["Its determinant is $\\det A = ad - bc$.", "它的行列式是 $\\det A = ad - bc$。"], lean: "def Mat2.det (A : Mat2) : Int := A.a * A.d - A.b * A.c" },
      { human: ["The identity matrix is $I = \\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}$.", "單位矩陣是 $I = \\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}$。"], lean: "def Mat2.identity : Mat2 := ⟨1, 0, 0, 1⟩" },
      { human: ["Theorem (det_identity):", "定理（det_identity）："], lean: "theorem det_identity" },
      { human: ["$\\det I = 1$.", "$\\det I = 1$。"], lean: ": Mat2.identity.det = 1" },
    ],
    paper: [
      {
        text: ["A $2 \\times 2$ integer matrix has $\\det = ad - bc$, and $I = \\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}$.", "$2 \\times 2$ 整數矩陣的行列式是 $ad - bc$，而 $I = \\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}$。"],
        lines: [1, 9],
        lean: ["structure Mat2 where", "a : Int", "b : Int", "c : Int", "d : Int", "def Mat2.det (A : Mat2) : Int := A.a * A.d - A.b * A.c", "def Mat2.identity : Mat2 := ⟨1, 0, 0, 1⟩"],
      },
      {
        text: ["We show $\\det I = 1$.", "我們證明 $\\det I = 1$。"],
        lines: [11, 11],
        lean: ["theorem det_identity : Mat2.identity.det = 1 := by"],
      },
      {
        text: ["$\\det I = 1 \\cdot 1 - 0 \\cdot 0 = 1$: a computation.", "$\\det I = 1 \\cdot 1 - 0 \\cdot 0 = 1$：直接計算。"],
        lines: [12, 12],
        lean: ["rfl"],
        goal: "⊢ Mat2.identity.det = 1",
      },
    ],
  },
  "la-vec-add-comm": {
    statementMirror: [
      { human: ["A plane vector has two integer components $x$, $y$.", "平面向量有兩個整數分量 $x$、$y$。"], lean: "structure Vec2 where\n  x : Int\n  y : Int" },
      { human: ["Vectors add componentwise: $u + v = (u_x + v_x, u_y + v_y)$.", "向量逐分量相加：$u + v = (u_x + v_x, u_y + v_y)$。"], lean: "def Vec2.add (u v : Vec2) : Vec2 := ⟨u.x + v.x, u.y + v.y⟩" },
      { human: ["Theorem (vec_add_comm):", "定理（vec_add_comm）："], lean: "theorem vec_add_comm" },
      { human: ["For any vectors $u$, $v$,", "對任意向量 $u$、$v$，"], lean: "(u v : Vec2)" },
      { human: ["$u + v = v + u$.", "$u + v = v + u$。"], lean: ": u.add v = v.add u" },
    ],
    paper: [
      {
        text: ["Plane vectors have integer components and add componentwise.", "平面向量有整數分量，逐分量相加。"],
        lines: [1, 5],
        lean: ["structure Vec2 where", "x : Int", "y : Int", "def Vec2.add (u v : Vec2) : Vec2 := ⟨u.x + v.x, u.y + v.y⟩"],
      },
      {
        text: ["Let $u$, $v$ be vectors; we show $u + v = v + u$.", "設 $u$、$v$ 為向量；我們證明 $u + v = v + u$。"],
        lines: [7, 7],
        lean: ["theorem vec_add_comm (u v : Vec2) : u.add v = v.add u := by"],
      },
      {
        text: ["Componentwise, the claim is $(u_x + v_x, u_y + v_y) = (v_x + u_x, v_y + u_y)$.", "逐分量來看，要證的是 $(u_x + v_x, u_y + v_y) = (v_x + u_x, v_y + u_y)$。"],
        lines: [8, 8],
        lean: ["simp only [Vec2.add]"],
        goal: "u v : Vec2\n⊢ u.add v = v.add u",
      },
      {
        text: ["Integer addition is commutative: $u_x + v_x = v_x + u_x$,", "整數加法可交換：$u_x + v_x = v_x + u_x$，"],
        lines: [9, 9],
        lean: ["rw [Int.add_comm u.x v.x]"],
        goal: "u v : Vec2\n⊢ { x := u.x + v.x, y := u.y + v.y } = { x := v.x + u.x, y := v.y + u.y }",
      },
      {
        text: ["and $u_y + v_y = v_y + u_y$. Now both sides are the same pair.", "而 $u_y + v_y = v_y + u_y$。兩邊成了同一對數。"],
        lines: [10, 10],
        lean: ["rw [Int.add_comm u.y v.y]"],
        goal: "u v : Vec2\n⊢ { x := v.x + u.x, y := u.y + v.y } = { x := v.x + u.x, y := v.y + u.y }",
      },
    ],
  },
  "la-smul-distrib": {
    statementMirror: [
      { human: ["A plane vector has two integer components $x$, $y$.", "平面向量有兩個整數分量 $x$、$y$。"], lean: "structure Vec2 where\n  x : Int\n  y : Int" },
      { human: ["Vectors add componentwise: $u + v = (u_x + v_x, u_y + v_y)$.", "向量逐分量相加：$u + v = (u_x + v_x, u_y + v_y)$。"], lean: "def Vec2.add (u v : Vec2) : Vec2 := ⟨u.x + v.x, u.y + v.y⟩" },
      { human: ["Scaling by an integer $k$ multiplies each component: $kv = (kv_x, kv_y)$.", "乘上整數 $k$ 就是每個分量乘 $k$：$kv = (kv_x, kv_y)$。"], lean: "def Vec2.smul (k : Int) (v : Vec2) : Vec2 := ⟨k * v.x, k * v.y⟩" },
      { human: ["Theorem (smul_add_distrib):", "定理（smul_add_distrib）："], lean: "theorem smul_add_distrib" },
      { human: ["For any integer $k$ and vectors $u$, $v$,", "對任意整數 $k$ 與向量 $u$、$v$，"], lean: "(k : Int) (u v : Vec2)" },
      { human: ["$k(u + v) = ku + kv$.", "$k(u + v) = ku + kv$。"], lean: "Vec2.smul k (u.add v) = (Vec2.smul k u).add (Vec2.smul k v)" },
    ],
    paper: [
      {
        text: ["Vectors add componentwise, and $kv = (kv_x, kv_y)$.", "向量逐分量相加，$kv = (kv_x, kv_y)$。"],
        lines: [1, 7],
        lean: ["structure Vec2 where", "x : Int", "y : Int", "def Vec2.add (u v : Vec2) : Vec2 := ⟨u.x + v.x, u.y + v.y⟩", "def Vec2.smul (k : Int) (v : Vec2) : Vec2 := ⟨k * v.x, k * v.y⟩"],
      },
      {
        text: ["Let $k$ be an integer and $u$, $v$ vectors; we show $k(u + v) = ku + kv$.", "設 $k$ 為整數，$u$、$v$ 為向量；我們證明 $k(u + v) = ku + kv$。"],
        lines: [9, 10],
        lean: ["theorem smul_add_distrib (k : Int) (u v : Vec2) :", "Vec2.smul k (u.add v) = (Vec2.smul k u).add (Vec2.smul k v) := by"],
      },
      {
        text: ["Componentwise, the claim is $(k(u_x + v_x), k(u_y + v_y)) = (ku_x + kv_x, ku_y + kv_y)$.", "逐分量來看，要證的是 $(k(u_x + v_x), k(u_y + v_y)) = (ku_x + kv_x, ku_y + kv_y)$。"],
        lines: [11, 11],
        lean: ["simp only [Vec2.smul, Vec2.add]"],
        goal: "k : Int\nu v : Vec2\n⊢ Vec2.smul k (u.add v) = (Vec2.smul k u).add (Vec2.smul k v)",
      },
      {
        text: ["Distributivity $k(a + b) = ka + kb$, once in each component.", "分配律 $k(a + b) = ka + kb$，每個分量用一次。"],
        lines: [12, 12],
        lean: ["rw [Int.mul_add, Int.mul_add]"],
        goal: "k : Int\nu v : Vec2\n⊢ { x := k * (u.x + v.x), y := k * (u.y + v.y) } = { x := k * u.x + k * v.x, y := k * u.y + k * v.y }",
      },
    ],
  },
  "la-mul-identity": {
    statementMirror: [
      { human: ["A $2 \\times 2$ matrix $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$ has four integer entries.", "$2 \\times 2$ 矩陣 $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$ 有四個整數元素。"], lean: "structure Mat2 where\n  a : Int\n  b : Int\n  c : Int\n  d : Int" },
      { human: ["The identity matrix is $I = \\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}$.", "單位矩陣是 $I = \\begin{pmatrix} 1 & 0 \\\\ 0 & 1 \\end{pmatrix}$。"], lean: "def Mat2.identity : Mat2 := ⟨1, 0, 0, 1⟩" },
      { human: ["Matrices multiply row by column: $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}\\begin{pmatrix} e & f \\\\ g & h \\end{pmatrix} = \\begin{pmatrix} ae + bg & af + bh \\\\ ce + dg & cf + dh \\end{pmatrix}$.", "矩陣相乘是列乘行：$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}\\begin{pmatrix} e & f \\\\ g & h \\end{pmatrix} = \\begin{pmatrix} ae + bg & af + bh \\\\ ce + dg & cf + dh \\end{pmatrix}$。"], lean: "def Mat2.mul (A B : Mat2) : Mat2 :=\n  ⟨A.a * B.a + A.b * B.c, A.a * B.b + A.b * B.d,\n   A.c * B.a + A.d * B.c, A.c * B.b + A.d * B.d⟩" },
      { human: ["Theorem (mul_identity):", "定理（mul_identity）："], lean: "theorem mul_identity" },
      { human: ["For every matrix $A$,", "對每個矩陣 $A$，"], lean: "(A : Mat2)" },
      { human: ["$AI = A$.", "$AI = A$。"], lean: ": A.mul Mat2.identity = A" },
    ],
    paper: [
      {
        text: ["$2 \\times 2$ integer matrices, the identity $I$, and the row-by-column product.", "$2 \\times 2$ 整數矩陣、單位矩陣 $I$，以及列乘行的乘法。"],
        lines: [1, 11],
        lean: ["structure Mat2 where", "a : Int", "b : Int", "c : Int", "d : Int", "def Mat2.identity : Mat2 := ⟨1, 0, 0, 1⟩", "def Mat2.mul (A B : Mat2) : Mat2 :=", "⟨A.a * B.a + A.b * B.c, A.a * B.b + A.b * B.d,", "A.c * B.a + A.d * B.c, A.c * B.b + A.d * B.d⟩"],
      },
      {
        text: ["Let $A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$; we show $AI = A$.", "設 $A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$；我們證明 $AI = A$。"],
        lines: [13, 13],
        lean: ["theorem mul_identity (A : Mat2) : A.mul Mat2.identity = A := by"],
      },
      {
        text: ["Row by column, $AI = \\begin{pmatrix} a \\cdot 1 + b \\cdot 0 & a \\cdot 0 + b \\cdot 1 \\\\ c \\cdot 1 + d \\cdot 0 & c \\cdot 0 + d \\cdot 1 \\end{pmatrix}$,", "列乘行，$AI = \\begin{pmatrix} a \\cdot 1 + b \\cdot 0 & a \\cdot 0 + b \\cdot 1 \\\\ c \\cdot 1 + d \\cdot 0 & c \\cdot 0 + d \\cdot 1 \\end{pmatrix}$，"],
        lines: [14, 14],
        lean: ["simp only [Mat2.mul, Mat2.identity]"],
        goal: "A : Mat2\n⊢ A.mul Mat2.identity = A",
      },
      {
        text: ["and with $x \\cdot 1 = x$, $x \\cdot 0 = 0$, $x + 0 = 0 + x = x$ the entries are $a$, $b$, $c$, $d$: the matrix $A$.", "用 $x \\cdot 1 = x$、$x \\cdot 0 = 0$、$x + 0 = 0 + x = x$，元素就是 $a$、$b$、$c$、$d$：也就是矩陣 $A$。"],
        lines: [15, 15],
        lean: ["simp"],
        goal: "A : Mat2\n⊢ { a := A.a * 1 + A.b * 0, b := A.a * 0 + A.b * 1, c := A.c * 1 + A.d * 0, d := A.c * 0 + A.d * 1 } = A",
      },
    ],
  },
  "la-equal-rows-det": {
    statementMirror: [
      { human: ["A $2 \\times 2$ matrix $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$ has four integer entries.", "$2 \\times 2$ 矩陣 $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$ 有四個整數元素。"], lean: "structure Mat2 where\n  a : Int\n  b : Int\n  c : Int\n  d : Int" },
      { human: ["Its determinant is $\\det A = ad - bc$.", "它的行列式是 $\\det A = ad - bc$。"], lean: "def Mat2.det (A : Mat2) : Int := A.a * A.d - A.b * A.c" },
      { human: ["Theorem (det_equal_rows):", "定理（det_equal_rows）："], lean: "theorem det_equal_rows" },
      { human: ["For any integers $a$, $b$,", "對任意整數 $a$、$b$，"], lean: "(a b : Int)" },
      { human: ["the matrix $\\begin{pmatrix} a & b \\\\ a & b \\end{pmatrix}$ with two equal rows has determinant $0$.", "兩列相同的矩陣 $\\begin{pmatrix} a & b \\\\ a & b \\end{pmatrix}$ 行列式為 $0$。"], lean: ": (Mat2.mk a b a b).det = 0" },
    ],
    paper: [
      {
        text: ["$2 \\times 2$ integer matrices with $\\det = ad - bc$.", "$2 \\times 2$ 整數矩陣，行列式 $= ad - bc$。"],
        lines: [1, 7],
        lean: ["structure Mat2 where", "a : Int", "b : Int", "c : Int", "d : Int", "def Mat2.det (A : Mat2) : Int := A.a * A.d - A.b * A.c"],
      },
      {
        text: ["Let $a$, $b$ be integers; we show $\\det \\begin{pmatrix} a & b \\\\ a & b \\end{pmatrix} = 0$.", "設 $a$、$b$ 為整數；我們證明 $\\det \\begin{pmatrix} a & b \\\\ a & b \\end{pmatrix} = 0$。"],
        lines: [9, 9],
        lean: ["theorem det_equal_rows (a b : Int) : (Mat2.mk a b a b).det = 0 := by"],
      },
      {
        text: ["By the definition, the determinant is $ab - ba$.", "依定義，行列式是 $ab - ba$。"],
        lines: [10, 10],
        lean: ["simp only [Mat2.det]"],
        goal: "a b : Int\n⊢ { a := a, b := b, c := a, d := b }.det = 0",
      },
      {
        text: ["Multiplication is commutative, $ab = ba$,", "乘法可交換，$ab = ba$，"],
        lines: [11, 11],
        lean: ["rw [Int.mul_comm a b]"],
        goal: "a b : Int\n⊢ a * b - b * a = 0",
      },
      {
        text: ["so it is $ba - ba = 0$.", "所以它是 $ba - ba = 0$。"],
        lines: [12, 12],
        lean: ["exact Int.sub_self (b * a)"],
        goal: "a b : Int\n⊢ b * a - b * a = 0",
      },
    ],
  },
  "la-det-mul": {
    statementMirror: [
      { human: ["A $2 \\times 2$ matrix $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$ has four integer entries.", "$2 \\times 2$ 矩陣 $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$ 有四個整數元素。"], lean: "structure Mat2 where\n  a : Int\n  b : Int\n  c : Int\n  d : Int" },
      { human: ["Its determinant is $\\det A = ad - bc$.", "它的行列式是 $\\det A = ad - bc$。"], lean: "def Mat2.det (A : Mat2) : Int := A.a * A.d - A.b * A.c" },
      { human: ["Matrices multiply row by column: $\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}\\begin{pmatrix} e & f \\\\ g & h \\end{pmatrix} = \\begin{pmatrix} ae + bg & af + bh \\\\ ce + dg & cf + dh \\end{pmatrix}$.", "矩陣相乘是列乘行：$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}\\begin{pmatrix} e & f \\\\ g & h \\end{pmatrix} = \\begin{pmatrix} ae + bg & af + bh \\\\ ce + dg & cf + dh \\end{pmatrix}$。"], lean: "def Mat2.mul (A B : Mat2) : Mat2 :=\n  ⟨A.a * B.a + A.b * B.c, A.a * B.b + A.b * B.d,\n   A.c * B.a + A.d * B.c, A.c * B.b + A.d * B.d⟩" },
      { human: ["Theorem (det_mul):", "定理（det_mul）："], lean: "theorem det_mul" },
      { human: ["For any matrices $A$, $B$,", "對任意矩陣 $A$、$B$，"], lean: "(A B : Mat2)" },
      { human: ["$\\det(AB) = \\det A \\cdot \\det B$.", "$\\det(AB) = \\det A \\cdot \\det B$。"], lean: ": (A.mul B).det = A.det * B.det" },
    ],
    paper: [
      {
        text: ["$2 \\times 2$ integer matrices, $\\det = ad - bc$, and the row-by-column product.", "$2 \\times 2$ 整數矩陣，行列式 $= ad - bc$，以及列乘行的乘法。"],
        lines: [1, 11],
        lean: ["structure Mat2 where", "a : Int", "b : Int", "c : Int", "d : Int", "def Mat2.det (A : Mat2) : Int := A.a * A.d - A.b * A.c", "def Mat2.mul (A B : Mat2) : Mat2 :=", "⟨A.a * B.a + A.b * B.c, A.a * B.b + A.b * B.d,", "A.c * B.a + A.d * B.c, A.c * B.b + A.d * B.d⟩"],
      },
      {
        text: ["Let $A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$, $B = \\begin{pmatrix} e & f \\\\ g & h \\end{pmatrix}$; we show $\\det(AB) = \\det A \\cdot \\det B$.", "設 $A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$、$B = \\begin{pmatrix} e & f \\\\ g & h \\end{pmatrix}$；我們證明 $\\det(AB) = \\det A \\cdot \\det B$。"],
        lines: [13, 13],
        lean: ["theorem det_mul (A B : Mat2) : (A.mul B).det = A.det * B.det := by"],
      },
      {
        text: ["Written out in the eight entries: $(ae + bg)(cf + dh) - (af + bh)(ce + dg) = (ad - bc)(eh - fg)$.", "用八個元素寫開：$(ae + bg)(cf + dh) - (af + bh)(ce + dg) = (ad - bc)(eh - fg)$。"],
        lines: [14, 14],
        lean: ["simp only [Mat2.mul, Mat2.det]"],
        goal: "A B : Mat2\n⊢ (A.mul B).det = A.det * B.det",
      },
      {
        text: ["Multiply out: the terms $acef$ and $bdgh$ cancel on the left, leaving $adeh + bcfg - adfg - bceh$, which is the expansion of $(ad - bc)(eh - fg)$.", "全部乘開：左邊的 $acef$ 與 $bdgh$ 互相抵消，剩下 $adeh + bcfg - adfg - bceh$，正是 $(ad - bc)(eh - fg)$ 的展開。"],
        lines: [15, 15],
        lean: ["grind"],
        goal: "A B : Mat2\n⊢ (A.a * B.a + A.b * B.c) * (A.c * B.b + A.d * B.d) - (A.a * B.b + A.b * B.d) * (A.c * B.a + A.d * B.c) =\n    (A.a * A.d - A.b * A.c) * (B.a * B.d - B.b * B.c)",
      },
    ],
  },
  "fermat-seven": {
    statementMirror: [
      { human: ["Theorem (fermat_seven):", "定理（fermat_seven）："], lean: "theorem fermat_seven" },
      { human: ["For every natural number $a < 7$,", "對每個自然數 $a < 7$，"], lean: "∀ a, a < 7" },
      { human: ["$a^7 \\bmod 7 = a$, i.e. $a^7 \\equiv a \\pmod 7$ for the residues $a = 0, 1, \\dots, 6$.", "$a^7 \\bmod 7 = a$，也就是對餘數 $a = 0, 1, \\dots, 6$，$a^7 \\equiv a \\pmod 7$。"], lean: "a ^ 7 % 7 = a" },
    ],
    paper: [
      {
        text: ["Fermat's little theorem for $p = 7$, checked on the seven residues $a = 0, \\dots, 6$. (For every integer $a$ it would follow, since $a^7 \\bmod 7$ depends only on $a \\bmod 7$; that step is not formalized here.)", "$p = 7$ 的費馬小定理，在七個餘數 $a = 0, \\dots, 6$ 上檢查。（對每個整數 $a$ 也會成立，因為 $a^7 \\bmod 7$ 只取決於 $a \\bmod 7$；這一步這裡沒有形式化。）"],
        lines: [1, 1],
        lean: ["theorem fermat_seven : ∀ a, a < 7 → a ^ 7 % 7 = a := by"],
      },
      {
        text: ["Compute all seven: $0^7 = 0$, $1^7 = 1$, $2^7 = 128 = 18 \\cdot 7 + 2$, …, $6^7 = 279936 = 39990 \\cdot 7 + 6$; each leaves remainder $a$.", "七個全部算出來：$0^7 = 0$、$1^7 = 1$、$2^7 = 128 = 18 \\cdot 7 + 2$、…、$6^7 = 279936 = 39990 \\cdot 7 + 6$；每個的餘數都是 $a$。"],
        lines: [2, 2],
        lean: ["decide"],
        goal: "⊢ ∀ (a : Nat), a < 7 → a ^ 7 % 7 = a",
      },
    ],
  },
  "collatz-check": {
    statementMirror: [
      { human: ["One Collatz step: $n \\mapsto n/2$ if $n$ is even, $n \\mapsto 3n + 1$ if $n$ is odd.", "考拉茲的一步：$n$ 是偶數時 $n \\mapsto n/2$，奇數時 $n \\mapsto 3n + 1$。"], lean: "def collatzStep (n : Nat) : Nat := if n % 2 = 0 then n / 2 else 3 * n + 1" },
      { human: ["$\\mathrm{reachesOne}(f, n)$: the sequence from $n$ hits $1$ within $f$ steps.", "$\\mathrm{reachesOne}(f, n)$：從 $n$ 出發的數列在 $f$ 步之內碰到 $1$。"], lean: "def reachesOne : Nat → Nat → Bool\n  | 0, n => n == 1\n  | fuel + 1, n => n == 1 || reachesOne fuel (collatzStep n)" },
      { human: ["Theorem (collatz_below_30):", "定理（collatz_below_30）："], lean: "theorem collatz_below_30" },
      { human: ["For every natural number $n$ with $0 < n < 30$,", "對每個滿足 $0 < n < 30$ 的自然數 $n$，"], lean: "∀ n, n < 30 → 0 < n" },
      { human: ["the sequence from $n$ reaches $1$ within $120$ steps.", "從 $n$ 出發的數列在 $120$ 步之內到達 $1$。"], lean: "reachesOne 120 n = true" },
    ],
    paper: [
      {
        text: ["The Collatz step halves even numbers and sends odd $n$ to $3n + 1$; $\\mathrm{reachesOne}(f, n)$ says $1$ appears among $n$ and its next $f$ iterates. ($0$ is even and goes to $0$ forever, so $0$ never reaches $1$: that is why the statement needs $0 < n$.)", "考拉茲的一步把偶數除以 2，把奇數 $n$ 變成 $3n + 1$；$\\mathrm{reachesOne}(f, n)$ 說 $1$ 出現在 $n$ 與接下來的 $f$ 個迭代裡。（$0$ 是偶數，永遠停在 $0$，到不了 $1$：所以陳述需要 $0 < n$。）"],
        lines: [1, 6],
        lean: ["def collatzStep (n : Nat) : Nat := if n % 2 = 0 then n / 2 else 3 * n + 1", "/-- does `n` reach 1 within `fuel` Collatz steps? -/", "def reachesOne : Nat → Nat → Bool", "| 0, n => n == 1", "| fuel + 1, n => n == 1 || reachesOne fuel (collatzStep n)"],
      },
      {
        text: ["Claim: every $n$ with $0 < n < 30$ reaches $1$ within $120$ steps. This is evidence for the Collatz conjecture, not a proof of it: the conjecture is about every $n$, and it is still open.", "主張：每個 $0 < n < 30$ 的 $n$ 都在 $120$ 步之內到達 $1$。這是考拉茲猜想的證據，不是它的證明：猜想談的是每個 $n$，至今仍未解決。"],
        lines: [8, 8],
        lean: ["theorem collatz_below_30 : ∀ n, n < 30 → 0 < n → reachesOne 120 n = true := by"],
      },
      {
        text: ["Run the $29$ sequences. The longest, from $27$, reaches $1$ after $111$ steps, within the $120$ allowed.", "把 $29$ 個數列都跑一遍。最長的是從 $27$ 出發，$111$ 步到達 $1$，在允許的 $120$ 步之內。"],
        lines: [9, 9],
        lean: ["decide"],
        goal: "⊢ ∀ (n : Nat), n < 30 → 0 < n → reachesOne 120 n = true",
      },
    ],
  },
  "fib-coprime": {
    statementMirror: [
      { human: ["The Fibonacci numbers: $F_0 = 0$, $F_1 = 1$, $F_{n+2} = F_n + F_{n+1}$.", "費波那契數：$F_0 = 0$、$F_1 = 1$、$F_{n+2} = F_n + F_{n+1}$。"], lean: "def fib : Nat → Nat\n  | 0 => 0\n  | 1 => 1\n  | n + 2 => fib n + fib (n + 1)" },
      { human: ["The recursion as a fact: $F_{n+2} = F_n + F_{n+1}$ (true by the definition).", "把遞迴寫成事實：$F_{n+2} = F_n + F_{n+1}$（依定義成立）。"], lean: "theorem fib_add_two (n : Nat) : fib (n + 2) = fib n + fib (n + 1) := rfl" },
      { human: ["Key lemma (open in the starting file): $\\gcd(F_{n+1}, F_{n+2}) = \\gcd(F_n, F_{n+1})$.", "關鍵引理（起始檔案中留空）：$\\gcd(F_{n+1}, F_{n+2}) = \\gcd(F_n, F_{n+1})$。"], lean: "theorem gcd_fib_step (n : Nat) : Nat.gcd (fib (n + 1)) (fib (n + 2)) = Nat.gcd (fib n) (fib (n + 1))" },
      { human: ["Theorem (fib_coprime):", "定理（fib_coprime）："], lean: "theorem fib_coprime" },
      { human: ["For every natural number $n$, $\\gcd(F_n, F_{n+1}) = 1$.", "對每個自然數 $n$，$\\gcd(F_n, F_{n+1}) = 1$。"], lean: "(n : Nat) : Nat.gcd (fib n) (fib (n + 1)) = 1" },
    ],
    paper: [
      {
        text: ["Define $F_0 = 0$, $F_1 = 1$, $F_{n+2} = F_n + F_{n+1}$.", "定義 $F_0 = 0$、$F_1 = 1$、$F_{n+2} = F_n + F_{n+1}$。"],
        lines: [1, 4],
        lean: ["def fib : Nat → Nat", "| 0 => 0", "| 1 => 1", "| n + 2 => fib n + fib (n + 1)"],
      },
      {
        text: ["By the definition, $F_{n+2} = F_n + F_{n+1}$.", "依定義，$F_{n+2} = F_n + F_{n+1}$。"],
        lines: [6, 6],
        lean: ["theorem fib_add_two (n : Nat) : fib (n + 2) = fib n + fib (n + 1) := rfl"],
      },
      {
        text: ["Key lemma (the one left open in the starting file): $\\gcd(F_{n+1}, F_{n+2}) = \\gcd(F_n, F_{n+1})$.", "關鍵引理（起始檔案中留空的那一條）：$\\gcd(F_{n+1}, F_{n+2}) = \\gcd(F_n, F_{n+1})$。"],
        lines: [8, 8],
        lean: ["theorem gcd_fib_step (n : Nat) : Nat.gcd (fib (n + 1)) (fib (n + 2)) = Nat.gcd (fib n) (fib (n + 1)) := by"],
      },
      {
        text: ["Write $F_{n+2} = F_n + F_{n+1}$: the left side is $\\gcd(F_{n+1}, F_n + F_{n+1})$.", "把 $F_{n+2}$ 寫成 $F_n + F_{n+1}$：左邊是 $\\gcd(F_{n+1}, F_n + F_{n+1})$。"],
        lines: [9, 9],
        lean: ["rw [fib_add_two]"],
        goal: "n : Nat\n⊢ (fib (n + 1)).gcd (fib (n + 2)) = (fib n).gcd (fib (n + 1))",
      },
      {
        text: ["On the right, swap the arguments: $\\gcd(F_n, F_{n+1}) = \\gcd(F_{n+1}, F_n)$.", "右邊把兩個數交換：$\\gcd(F_n, F_{n+1}) = \\gcd(F_{n+1}, F_n)$。"],
        lines: [10, 10],
        lean: ["rw [Nat.gcd_comm (fib n) (fib (n + 1))]"],
        goal: "n : Nat\n⊢ (fib (n + 1)).gcd (fib n + fib (n + 1)) = (fib n).gcd (fib (n + 1))",
      },
      {
        text: ["Euclid's step: adding a multiple of one argument to the other does not change the gcd, so $\\gcd(F_{n+1}, F_n + F_{n+1}) = \\gcd(F_{n+1}, F_n)$.", "歐幾里得的一步：把一個數的倍數加到另一個數上，最大公因數不變，所以 $\\gcd(F_{n+1}, F_n + F_{n+1}) = \\gcd(F_{n+1}, F_n)$。"],
        lines: [11, 11],
        lean: ["rw [Nat.add_comm, Nat.gcd_add_self_right]"],
        goal: "n : Nat\n⊢ (fib (n + 1)).gcd (fib n + fib (n + 1)) = (fib (n + 1)).gcd (fib n)",
      },
      {
        text: ["Theorem: $\\gcd(F_n, F_{n+1}) = 1$ for every natural number $n$, by induction on $n$.", "定理：對每個自然數 $n$，$\\gcd(F_n, F_{n+1}) = 1$；對 $n$ 做歸納。"],
        lines: [13, 14],
        lean: ["theorem fib_coprime (n : Nat) : Nat.gcd (fib n) (fib (n + 1)) = 1 := by", "induction n with"],
      },
      {
        text: ["$n = 0$: $\\gcd(F_0, F_1) = \\gcd(0, 1) = 1$.", "$n = 0$：$\\gcd(F_0, F_1) = \\gcd(0, 1) = 1$。"],
        lines: [15, 15],
        lean: ["| zero => rfl"],
      },
      {
        text: ["Step: $\\gcd(F_{k+1}, F_{k+2}) = \\gcd(F_k, F_{k+1})$ by the key lemma, which is $1$ by the induction hypothesis.", "推進：由關鍵引理 $\\gcd(F_{k+1}, F_{k+2}) = \\gcd(F_k, F_{k+1})$，而由歸納假設它是 $1$。"],
        lines: [16, 16],
        lean: ["| succ k ih => rw [gcd_fib_step, ih]"],
      },
    ],
  },
  "nicomachus": {
    statementMirror: [
      { human: ["$T_n = 1 + 2 + \\dots + n$: $T_0 = 0$, $T_{n+1} = T_n + (n + 1)$.", "$T_n = 1 + 2 + \\dots + n$：$T_0 = 0$、$T_{n+1} = T_n + (n + 1)$。"], lean: "def triangle : Nat → Nat\n  | 0 => 0\n  | n + 1 => triangle n + (n + 1)" },
      { human: ["$C_n = 1^3 + 2^3 + \\dots + n^3$: $C_0 = 0$, $C_{n+1} = C_n + (n + 1)^3$.", "$C_n = 1^3 + 2^3 + \\dots + n^3$：$C_0 = 0$、$C_{n+1} = C_n + (n + 1)^3$。"], lean: "def cubeSum : Nat → Nat\n  | 0 => 0\n  | n + 1 => cubeSum n + (n + 1) * (n + 1) * (n + 1)" },
      { human: ["Gauss (already proved): $2T_n = n(n + 1)$.", "高斯公式（已證好）：$2T_n = n(n + 1)$。"], lean: "theorem two_triangle (n : Nat) : 2 * triangle n = n * (n + 1)" },
      { human: ["Key lemma (open in the starting file): $T_{n+1}^2 = T_n^2 + (n + 1)^3$.", "關鍵引理（起始檔案中留空）：$T_{n+1}^2 = T_n^2 + (n + 1)^3$。"], lean: "theorem triangle_sq_succ (n : Nat) :\n    triangle (n + 1) * triangle (n + 1) = triangle n * triangle n + (n + 1) * (n + 1) * (n + 1)" },
      { human: ["Theorem (nicomachus):", "定理（nicomachus）："], lean: "theorem nicomachus" },
      { human: ["For every natural number $n$, $1^3 + \\dots + n^3 = (1 + \\dots + n)^2$.", "對每個自然數 $n$，$1^3 + \\dots + n^3 = (1 + \\dots + n)^2$。"], lean: "(n : Nat) : cubeSum n = triangle n * triangle n" },
    ],
    paper: [
      {
        text: ["Let $T_n = 1 + \\dots + n$ and $C_n = 1^3 + \\dots + n^3$, both defined step by step from $T_0 = C_0 = 0$.", "設 $T_n = 1 + \\dots + n$、$C_n = 1^3 + \\dots + n^3$，兩者都從 $T_0 = C_0 = 0$ 一步一步定義。"],
        lines: [1, 7],
        lean: ["def triangle : Nat → Nat", "| 0 => 0", "| n + 1 => triangle n + (n + 1)", "def cubeSum : Nat → Nat", "| 0 => 0", "| n + 1 => cubeSum n + (n + 1) * (n + 1) * (n + 1)"],
      },
      {
        text: ["Gauss's formula, $2T_n = n(n + 1)$ (already proved in the starting file).", "高斯公式 $2T_n = n(n + 1)$（起始檔案中已證好）。"],
        lines: [9, 10],
        lean: ["-- Gauss, already proved: 2 · (1 + 2 + ⋯ + n) = n (n + 1)", "theorem two_triangle (n : Nat) : 2 * triangle n = n * (n + 1) := by"],
      },
      {
        text: ["By induction: $2T_0 = 0$; and $2T_{k+1} = 2T_k + 2(k + 1) = k(k + 1) + 2(k + 1) = (k + 1)(k + 2)$.", "對 $k$ 歸納：$2T_0 = 0$；而 $2T_{k+1} = 2T_k + 2(k + 1) = k(k + 1) + 2(k + 1) = (k + 1)(k + 2)$。"],
        lines: [11, 15],
        lean: ["induction n with", "| zero => rfl", "| succ k ih =>", "simp only [triangle, Nat.mul_add, ih, Nat.add_mul, Nat.mul_one, Nat.one_mul]", "omega"],
      },
      {
        text: ["Key lemma (the one left open in the starting file): the square of a triangular number grows by exactly a cube, $T_{n+1}^2 = T_n^2 + (n + 1)^3$.", "關鍵引理（起始檔案中留空的那一條）：三角形數的平方每一步恰好多一個立方，$T_{n+1}^2 = T_n^2 + (n + 1)^3$。"],
        lines: [17, 18],
        lean: ["theorem triangle_sq_succ (n : Nat) :", "triangle (n + 1) * triangle (n + 1) = triangle n * triangle n + (n + 1) * (n + 1) * (n + 1) := by"],
      },
      {
        text: ["We will use Gauss: $2T_n = n(n + 1)$.", "我們會用到高斯公式：$2T_n = n(n + 1)$。"],
        lines: [19, 19],
        lean: ["have h := two_triangle n"],
        goal: "n : Nat\n⊢ triangle (n + 1) * triangle (n + 1) = triangle n * triangle n + (n + 1) * (n + 1) * (n + 1)",
      },
      {
        text: ["$T_{n+1} = T_n + (n + 1)$; write $t = T_n$, so the claim is $(t + (n + 1))^2 = t^2 + (n + 1)^3$ with $2t = n(n + 1)$.", "$T_{n+1} = T_n + (n + 1)$；記 $t = T_n$，要證的是 $(t + (n + 1))^2 = t^2 + (n + 1)^3$，且 $2t = n(n + 1)$。"],
        lines: [20, 21],
        lean: ["show (triangle n + (n + 1)) * (triangle n + (n + 1)) = _", "generalize triangle n = t at *"],
        goal: "n : Nat\nh : 2 * triangle n = n * (n + 1)\n⊢ triangle (n + 1) * triangle (n + 1) = triangle n * triangle n + (n + 1) * (n + 1) * (n + 1)",
      },
      {
        text: ["Expand the square: $(t + (n + 1))^2 = t^2 + 2t(n + 1) + (n + 1)^2$.", "把平方展開：$(t + (n + 1))^2 = t^2 + 2t(n + 1) + (n + 1)^2$。"],
        lines: [22, 24],
        lean: ["have expand : (t + (n + 1)) * (t + (n + 1)) = t * t + 2 * t * (n + 1) + (n + 1) * (n + 1) := by", "simp only [Nat.add_mul, Nat.mul_add, Nat.two_mul, Nat.mul_one, Nat.one_mul, Nat.mul_comm n t]", "omega"],
        goal: "n t : Nat\nh : 2 * t = n * (n + 1)\n⊢ (t + (n + 1)) * (t + (n + 1)) = t * t + (n + 1) * (n + 1) * (n + 1)",
      },
      {
        text: ["By Gauss, $2t(n + 1) = n(n + 1)(n + 1)$, and $n(n + 1)^2 + (n + 1)^2 = (n + 1)^3$.", "由高斯公式，$2t(n + 1) = n(n + 1)(n + 1)$，而 $n(n + 1)^2 + (n + 1)^2 = (n + 1)^3$。"],
        lines: [25, 25],
        lean: ["rw [expand, h, Nat.mul_assoc n, Nat.mul_assoc (n + 1), Nat.succ_mul n ((n + 1) * (n + 1)), Nat.add_assoc]"],
        goal: "n t : Nat\nh : 2 * t = n * (n + 1)\nexpand : (t + (n + 1)) * (t + (n + 1)) = t * t + 2 * t * (n + 1) + (n + 1) * (n + 1)\n⊢ (t + (n + 1)) * (t + (n + 1)) = t * t + (n + 1) * (n + 1) * (n + 1)",
      },
      {
        text: ["Theorem: $C_n = T_n^2$ for every natural number $n$; assembled from the key lemma.", "定理：對每個自然數 $n$，$C_n = T_n^2$；由關鍵引理組成。"],
        lines: [27, 28],
        lean: ["-- the main theorem, already assembled from the key lemma", "theorem nicomachus (n : Nat) : cubeSum n = triangle n * triangle n := by"],
      },
      {
        text: ["By induction: $C_0 = 0 = T_0^2$; and $C_{k+1} = C_k + (k + 1)^3 = T_k^2 + (k + 1)^3 = T_{k+1}^2$ by the induction hypothesis and the key lemma.", "對 $k$ 歸納：$C_0 = 0 = T_0^2$；而 $C_{k+1} = C_k + (k + 1)^3 = T_k^2 + (k + 1)^3 = T_{k+1}^2$（由歸納假設與關鍵引理）。"],
        lines: [29, 31],
        lean: ["induction n with", "| zero => rfl", "| succ k ih => rw [cubeSum, ih, triangle_sq_succ]"],
      },
    ],
  },
  "imo-1959-p1": {
    statementMirror: [
      { human: ["Theorem (imo1959_p1):", "定理（imo1959_p1）："], lean: "theorem imo1959_p1" },
      { human: ["For every natural number $n$ ($n = 0$ included),", "對每個自然數 $n$（包括 $n = 0$），"], lean: "∀ n : ℕ" },
      { human: ["$21n + 4$ and $14n + 3$ are coprime, i.e. the fraction $\\frac{21n + 4}{14n + 3}$ is irreducible.", "$21n + 4$ 與 $14n + 3$ 互質，也就是分數 $\\frac{21n + 4}{14n + 3}$ 是既約分數。"], lean: "Nat.Coprime (21 * n + 4) (14 * n + 3)" },
    ],
    paper: [
      {
        text: ["Lemma: if $k$ divides both $21n + 4$ and $14n + 3$, then $k \\mid 1$.", "引理：若 $k$ 同時整除 $21n + 4$ 與 $14n + 3$，則 $k \\mid 1$。"],
        lines: [18, 22],
        lean: ["lemma calculation", "(n k : ℕ)", "(h1 : k ∣ 21 * n + 4)", "(h2 : k ∣ 14 * n + 3) :", "k ∣ 1 := by"],
      },
      {
        text: ["Then $k$ divides $2(21n + 4)$ and $3(14n + 3)$.", "那麼 $k$ 整除 $2(21n + 4)$ 與 $3(14n + 3)$。"],
        lines: [23, 24],
        lean: ["have h3 : k ∣ 2 * (21 * n + 4) := h1.mul_left 2", "have h4 : k ∣ 3 * (14 * n + 3) := h2.mul_left 3"],
      },
      {
        text: ["And $3(14n + 3) = 42n + 9 = 2(21n + 4) + 1$.", "而 $3(14n + 3) = 42n + 9 = 2(21n + 4) + 1$。"],
        lines: [25, 25],
        lean: ["have h5 : 3 * (14 * n + 3) = 2 * (21 * n + 4) + 1 := by ring"],
      },
      {
        text: ["So $k$ divides both $2(21n + 4)$ and $2(21n + 4) + 1$, hence $k \\mid 1$. (No subtraction is needed, which matters in $\\mathbb{N}$, where $a - b$ stops at $0$.)", "所以 $k$ 同時整除 $2(21n + 4)$ 與 $2(21n + 4) + 1$，因此 $k \\mid 1$。（不需要減法；這在 $\\mathbb{N}$ 裡很重要，因為那裡的 $a - b$ 會停在 $0$。）"],
        lines: [26, 26],
        lean: ["exact (Nat.dvd_add_right h3).mp (h5 ▸ h4)"],
      },
      {
        text: ["Theorem: for every natural $n$, by the lemma every prime $k$ dividing both $21n + 4$ and $14n + 3$ divides $1$, which no prime does; so they have no common prime factor and are coprime.", "定理：對每個自然數 $n$，由引理，同時整除 $21n + 4$ 與 $14n + 3$ 的質數 $k$ 都整除 $1$，而沒有質數整除 $1$；所以兩者沒有共同的質因數，互質。"],
        lines: [33, 34],
        lean: ["theorem imo1959_p1 : ∀ n : ℕ, Nat.Coprime (21 * n + 4) (14 * n + 3) :=", "fun n => Nat.coprime_of_dvd' <| λ k _ h1 h2 => calculation n k h1 h2"],
      },
    ],
  },
  "imo-1984-p2": {
    statementMirror: [
      { human: ["The answer: $a = 18$,", "答案：$a = 18$，"], lean: "abbrev a : ℤ := 18" },
      { human: ["$b = 1$, as integers.", "$b = 1$，都是整數。"], lean: "abbrev b : ℤ := 1" },
      { human: ["Theorem (imo1984_p2):", "定理（imo1984_p2）："], lean: "theorem imo1984_p2" },
      { human: ["$a$ and $b$ are positive,", "$a$ 與 $b$ 都是正數，"], lean: "(0 < a) ∧ (0 < b)" },
      { human: ["$7 \\nmid ab(a + b)$,", "$7 \\nmid ab(a + b)$，"], lean: "(¬ 7 ∣ a * b * (a + b))" },
      { human: ["and $7^7 \\mid (a + b)^7 - a^7 - b^7$ (in $\\mathbb{Z}$: the usual subtraction).", "且 $7^7 \\mid (a + b)^7 - a^7 - b^7$（在 $\\mathbb{Z}$ 裡：平常的減法）。"], lean: "7^7 ∣ (a + b)^7 - a^7 - b^7" },
    ],
    paper: [
      {
        text: ["Take $a = 18$, $b = 1$. (Why these: $(a + b)^7 - a^7 - b^7 = 7ab(a + b)(a^2 + ab + b^2)^2$, and $18^2 + 18 + 1 = 343 = 7^3$.)", "取 $a = 18$、$b = 1$。（為什麼是它們：$(a + b)^7 - a^7 - b^7 = 7ab(a + b)(a^2 + ab + b^2)^2$，而 $18^2 + 18 + 1 = 343 = 7^3$。）"],
        lines: [20, 21],
        lean: ["abbrev a : ℤ := 18", "abbrev b : ℤ := 1"],
      },
      {
        text: ["We check the four conditions.", "我們檢查四個條件。"],
        lines: [23, 26],
        lean: ["theorem imo1984_p2 :", "(0 < a) ∧ (0 < b) ∧", "(¬ 7 ∣ a * b * (a + b)) ∧", "7^7 ∣ (a + b)^7 - a^7 - b^7 := by"],
      },
      {
        text: ["$18 > 0$ and $1 > 0$; $ab(a + b) = 18 \\cdot 1 \\cdot 19 = 342 = 7 \\cdot 48 + 6$; and $19^7 - 18^7 - 1 = 281651706 = 7^7 \\cdot 342$. All by computation.", "$18 > 0$、$1 > 0$；$ab(a + b) = 18 \\cdot 1 \\cdot 19 = 342 = 7 \\cdot 48 + 6$；而 $19^7 - 18^7 - 1 = 281651706 = 7^7 \\cdot 342$。全部是計算。"],
        lines: [27, 27],
        lean: ["decide"],
      },
    ],
  },
  "imo-1963-p4": {
    statementMirror: [
      { human: ["The answer, for a real parameter $y$: the 5-tuples of reals that are", "答案（$y$ 為實數參數）：實數五元組，它們是"], lean: "abbrev SolutionSet (y : ℝ) : Set (ℝ × ℝ × ℝ × ℝ × ℝ)" },
      { human: ["all zero,", "全部為零，"], lean: "(x₁ = 0 ∧ x₂ = 0 ∧ x₃ = 0 ∧ x₄ = 0 ∧ x₅ = 0)" },
      { human: ["or all equal, when $y = 2$,", "或者在 $y = 2$ 時全部相等，"], lean: "(x₁ = x₂ ∧ x₂ = x₃ ∧ x₃ = x₄ ∧ x₄ = x₅ ∧ y = 2)" },
      { human: ["or, when $y^2 + y - 1 = 0$, of the form $(s,\\ t,\\ yt - s,\\ -yt - ys,\\ ys - t)$ for some reals $s$, $t$.", "或者在 $y^2 + y - 1 = 0$ 時，對某些實數 $s$、$t$ 形如 $(s,\\ t,\\ yt - s,\\ -yt - ys,\\ ys - t)$。"], lean: "(y^2 + y - 1 = 0 ∧ ∃ s t,\n    x₁ = s ∧\n    x₂ = t ∧\n    x₃ = y * t - s ∧\n    x₄ = -(y * t) - y * s ∧\n    x₅ = y * s - t)" },
      { human: ["Theorem (imo1963_p4):", "定理（imo1963_p4）："], lean: "theorem imo1963_p4" },
      { human: ["For all reals $x_1, \\dots, x_5$ and $y$:", "對所有實數 $x_1, \\dots, x_5$ 與 $y$："], lean: "(x₁ x₂ x₃ x₄ x₅ y : ℝ)" },
      { human: ["$(x_1, \\dots, x_5)$ is in the answer set if and only if", "$(x_1, \\dots, x_5)$ 在答案集合裡，若且唯若"], lean: "(x₁, x₂, x₃, x₄, x₅) ∈ SolutionSet y ↔" },
      { human: ["$x_5 + x_2 = yx_1$, $x_1 + x_3 = yx_2$, $x_2 + x_4 = yx_3$, $x_3 + x_5 = yx_4$, $x_4 + x_1 = yx_5$.", "$x_5 + x_2 = yx_1$、$x_1 + x_3 = yx_2$、$x_2 + x_4 = yx_3$、$x_3 + x_5 = yx_4$、$x_4 + x_1 = yx_5$。"], lean: "(x₅ + x₂ = y * x₁ ∧\n     x₁ + x₃ = y * x₂ ∧\n     x₂ + x₄ = y * x₃ ∧\n     x₃ + x₅ = y * x₄ ∧\n     x₄ + x₁ = y * x₅)" },
    ],
    paper: [
      {
        text: ["The answer: all zero; or all equal with $y = 2$; or, if $y^2 + y - 1 = 0$, the two-parameter family $(s, t, yt - s, -yt - ys, ys - t)$.", "答案：全部為零；或 $y = 2$ 且全部相等；或在 $y^2 + y - 1 = 0$ 時，雙參數解族 $(s, t, yt - s, -yt - ys, ys - t)$。"],
        lines: [25, 34],
        lean: ["abbrev SolutionSet (y : ℝ) : Set (ℝ × ℝ × ℝ × ℝ × ℝ) :=", "{(x₁, x₂, x₃, x₄, x₅) |", "(x₁ = 0 ∧ x₂ = 0 ∧ x₃ = 0 ∧ x₄ = 0 ∧ x₅ = 0) ∨", "(x₁ = x₂ ∧ x₂ = x₃ ∧ x₃ = x₄ ∧ x₄ = x₅ ∧ y = 2) ∨", "(y^2 + y - 1 = 0 ∧ ∃ s t,", "x₁ = s ∧", "x₂ = t ∧", "x₃ = y * t - s ∧", "x₄ = -(y * t) - y * s ∧", "x₅ = y * s - t)}"],
      },
      {
        text: ["Claim: a 5-tuple is in the answer set if and only if it solves the five equations.", "主張：一組五元數在答案集合裡，若且唯若它是五條方程的解。"],
        lines: [36, 42],
        lean: ["theorem imo1963_p4 (x₁ x₂ x₃ x₄ x₅ y : ℝ) :", "(x₁, x₂, x₃, x₄, x₅) ∈ SolutionSet y ↔", "(x₅ + x₂ = y * x₁ ∧", "x₁ + x₃ = y * x₂ ∧", "x₂ + x₄ = y * x₃ ∧", "x₃ + x₅ = y * x₄ ∧", "x₄ + x₁ = y * x₅) := by"],
      },
      {
        text: ["Answers solve the system: substitute (for the family, each equation reduces to a multiple of $y^2 + y - 1 = 0$). Conversely, adding the five equations gives $(y - 2)(x_1 + \\dots + x_5) = 0$. If $y = 2$, each $x_i$ is the average of its two neighbours, so a largest $x_i$ forces its neighbours, and then all, to be equal. If $y \\ne 2$, the sum is $0$; with $s = x_1$, $t = x_2$ the equations give $x_3 = yt - s$ and then $x_4$, $x_5$, and the remaining equations hold either when $y^2 + y - 1 = 0$ (the family) or only for $s = t = 0$ (all zero). In Lean, `grind` does this whole case split and algebra by itself.", "答案都是解：代進去檢查（對解族，每條方程都化成 $y^2 + y - 1 = 0$ 的倍數）。反過來，五條方程相加得到 $(y - 2)(x_1 + \\dots + x_5) = 0$。若 $y = 2$，每個 $x_i$ 都是兩個鄰居的平均，所以最大的 $x_i$ 逼得它的鄰居、進而全部都相等。若 $y \\ne 2$，總和為 $0$；令 $s = x_1$、$t = x_2$，方程給出 $x_3 = yt - s$，接著是 $x_4$、$x_5$，而剩下的方程要嘛在 $y^2 + y - 1 = 0$ 時成立（解族），要嘛只在 $s = t = 0$ 時成立（全部為零）。在 Lean 裡，`grind` 自己完成整個分情形與代數運算。"],
        lines: [43, 43],
        lean: ["grind"],
      },
    ],
  },
  "imo-1964-p1": {
    statementMirror: [
      { human: ["The answer to (a): the natural numbers divisible by $3$.", "(a) 的答案：可被 $3$ 整除的自然數。"], lean: "abbrev solution_set : Set ℕ := { n | n % 3 = 0 }" },
      { human: ["Theorem (imo1964_p1a):", "定理（imo1964_p1a）："], lean: "theorem imo1964_p1a" },
      { human: ["(a) For every natural number $n$: $3 \\mid n$ if and only if $2^n \\equiv 1 \\pmod 7$ (that is, $7 \\mid 2^n - 1$).", "(a) 對每個自然數 $n$：$3 \\mid n$ 若且唯若 $2^n \\equiv 1 \\pmod 7$（也就是 $7 \\mid 2^n - 1$）。"], lean: "(n : ℕ) : n ∈ solution_set ↔ 2^n ≡ 1 [MOD 7]" },
      { human: ["Theorem (imo1964_p1b):", "定理（imo1964_p1b）："], lean: "theorem imo1964_p1b" },
      { human: ["(b) For every natural number $n$, $n = 0$ included: $7 \\nmid 2^n + 1$.", "(b) 對每個自然數 $n$（包括 $n = 0$）：$7 \\nmid 2^n + 1$。"], lean: "(n : ℕ) : ¬ 7 ∣ (2^n + 1)" },
    ],
    paper: [
      {
        text: ["Answer to (a): the multiples of $3$ ($0$ included).", "(a) 的答案：$3$ 的倍數（包括 $0$）。"],
        lines: [18, 18],
        lean: ["abbrev solution_set : Set ℕ := { n | n % 3 = 0 }"],
      },
      {
        text: ["(a) We prove both directions of: $3 \\mid n \\iff 2^n \\equiv 1 \\pmod 7$.", "(a) 我們證明 $3 \\mid n \\iff 2^n \\equiv 1 \\pmod 7$ 的兩個方向。"],
        lines: [20, 21],
        lean: ["theorem imo1964_p1a (n : ℕ) : n ∈ solution_set ↔ 2^n ≡ 1 [MOD 7] := by", "constructor"],
      },
      {
        text: ["If $n = 3m$, then $2^n = 8^m \\equiv 1^m = 1 \\pmod 7$.", "若 $n = 3m$，則 $2^n = 8^m \\equiv 1^m = 1 \\pmod 7$。"],
        lines: [22, 26],
        lean: ["· intro hn", "obtain ⟨m, hm⟩ := Nat.dvd_of_mod_eq_zero hn", "change 2^n % 7 = 1", "rw [hm, Nat.pow_mul, Nat.pow_mod]", "norm_num"],
      },
      {
        text: ["Conversely, suppose $2^n \\equiv 1$. Write $n = 3q + r$ with $r = n \\bmod 3$; then $2^n = 8^q \\cdot 2^r \\equiv 2^r \\pmod 7$.", "反過來，假設 $2^n \\equiv 1$。寫 $n = 3q + r$，$r = n \\bmod 3$；則 $2^n = 8^q \\cdot 2^r \\equiv 2^r \\pmod 7$。"],
        lines: [27, 31],
        lean: ["· intro hn", "change n % 3 = 0", "change 2^n % 7 = 1 at hn", "rw [(Nat.div_add_mod' n 3).symm] at hn", "rw [pow_add, pow_mul', Nat.mul_mod, Nat.pow_mod] at hn"],
      },
      {
        text: ["If $r = 0$, $3 \\mid n$. If $r = 1$ or $r = 2$, we would get $2 \\equiv 1$ or $4 \\equiv 1 \\pmod 7$, both false.", "若 $r = 0$，則 $3 \\mid n$。若 $r = 1$ 或 $r = 2$，會得到 $2 \\equiv 1$ 或 $4 \\equiv 1 \\pmod 7$，都不成立。"],
        lines: [32, 35],
        lean: ["mod_cases H : n % 3", "· exact H", "· rw [H] at hn; norm_num at hn", "· rw [H] at hn; norm_num at hn"],
      },
      {
        text: ["(b) For every natural $n$ ($n = 0$ included, $2^0 + 1 = 2$): $7 \\nmid 2^n + 1$. Write $n = 3m + k$, $k \\in \\{0, 1, 2\\}$; since $2^3 \\equiv 1$, $2^n + 1 \\equiv 2, 3, 5 \\pmod 7$.", "(b) 對每個自然數 $n$（包括 $n = 0$，$2^0 + 1 = 2$）：$7 \\nmid 2^n + 1$。寫 $n = 3m + k$，$k \\in \\{0, 1, 2\\}$；因為 $2^3 \\equiv 1$，$2^n + 1 \\equiv 2, 3, 5 \\pmod 7$。"],
        lines: [37, 46],
        lean: ["theorem imo1964_p1b (n : ℕ) : ¬ 7 ∣ (2^n + 1) := by", "/-", "Following https://prase.cz/kalva/imo/isoln/isoln641.html:", "Let n = 3m + k; k = 0, 1, or 2.", "2^3 = 1 (mod 7).", "Hence", "2^3m + 1 = 2 (mod 7),", "2^(3m+1) + 1 = 3 (mod 7), and", "2^(3m + 2) + 1 = 5 (mod 7).", "-/"],
      },
      {
        text: ["Suppose $7 \\mid 2^n + 1$, i.e. $(2^n + 1) \\bmod 7 = 0$. Use $2^3 \\bmod 7 = 1$ and split $n = 3q + r$ by $r = n \\bmod 3$.", "假設 $7 \\mid 2^n + 1$，也就是 $(2^n + 1) \\bmod 7 = 0$。用 $2^3 \\bmod 7 = 1$，並依 $r = n \\bmod 3$ 把 $n$ 寫成 $3q + r$。"],
        lines: [47, 50],
        lean: ["intro h", "apply Nat.mod_eq_zero_of_dvd at h", "have h1: 2 ^ 3 % 7 = 1 := by rfl", "mod_cases h2 : n % 3 <;> rw [← Nat.div_add_mod n 3, h2] at h"],
      },
      {
        text: ["$r = 0$: $2^{3q} + 1 \\equiv 1 + 1 = 2 \\pmod 7$, not $0$.", "$r = 0$：$2^{3q} + 1 \\equiv 1 + 1 = 2 \\pmod 7$，不是 $0$。"],
        lines: [51, 53],
        lean: ["· rw [Nat.zero_mod, add_zero, Nat.add_mod, Nat.pow_mod, pow_mul,", "Nat.pow_mod, h1, one_pow (M := ℕ)] at h", "contradiction"],
      },
      {
        text: ["$r = 1$: $2^{3q + 1} + 1 \\equiv 2 + 1 = 3 \\pmod 7$, not $0$.", "$r = 1$：$2^{3q + 1} + 1 \\equiv 2 + 1 = 3 \\pmod 7$，不是 $0$。"],
        lines: [54, 55],
        lean: ["· rw [Nat.add_mod, pow_add, pow_mul, Nat.mul_mod, Nat.pow_mod, h1, one_pow (M := ℕ)] at h", "contradiction"],
      },
      {
        text: ["$r = 2$: $2^{3q + 2} + 1 \\equiv 4 + 1 = 5 \\pmod 7$, not $0$. Contradiction in every case.", "$r = 2$：$2^{3q + 2} + 1 \\equiv 4 + 1 = 5 \\pmod 7$，不是 $0$。每種情形都矛盾。"],
        lines: [56, 57],
        lean: ["· rw [Nat.add_mod, pow_add, pow_mul, Nat.mul_mod, Nat.pow_mod, h1, one_pow (M := ℕ)] at h", "contradiction"],
      },
      {
        text: ["A second proof of (b), by recursion on $n$: for $n = 0, 1, 2$, $(2^n + 1) \\bmod 7 = 2, 3, 5$.", "(b) 的第二個證明，對 $n$ 遞迴：$n = 0, 1, 2$ 時，$(2^n + 1) \\bmod 7 = 2, 3, 5$。"],
        lines: [59, 62],
        lean: ["/- An alternative proof, heavily golfed. The statement here is slightly modified from", "the original one. -/", "theorem imo_1964_p1b' : ∀ (n : ℕ), (2 ^ n + 1) % 7 ≠ 0", "| 0 | 1 | 2 => by decide"],
      },
      {
        text: ["And $2^{n+3} + 1 = 8 \\cdot 2^n + 1 \\equiv 2^n + 1 \\pmod 7$, so the case $n + 3$ reduces to the case $n$.", "而 $2^{n+3} + 1 = 8 \\cdot 2^n + 1 \\equiv 2^n + 1 \\pmod 7$，所以 $n + 3$ 的情形化成 $n$ 的情形。"],
        lines: [63, 65],
        lean: ["| n + 3 => by", "rw [pow_add, Nat.add_mod, Nat.mul_mod, show 2 ^ 3 % 7 = 1 by rfl]", "simp [imo_1964_p1b' n]"],
      },
    ],
  },
  "imo-1972-p4": {
    statementMirror: [
      { human: ["The answer: the 5-tuples with all entries equal.", "答案：五個數全部相等的五元組。"], lean: "abbrev solution_set : Set (ℝ × ℝ × ℝ × ℝ × ℝ) :=\n  {(a, b, c, d, e) | a = b ∧ b = c ∧ c = d ∧ d = e}" },
      { human: ["Theorem (imo1972_p4):", "定理（imo1972_p4）："], lean: "theorem imo1972_p4" },
      { human: ["For real numbers $a, b, c, d, e$ (that is, $x_1, \\dots, x_5$)", "對實數 $a, b, c, d, e$（也就是 $x_1, \\dots, x_5$）"], lean: "(a b c d e : ℝ)" },
      { human: ["that are all positive:", "且都是正數："], lean: "(h₀ : 0 < a ∧ 0 < b ∧ 0 < c ∧ 0 < d ∧ 0 < e)" },
      { human: ["the five inequalities $(a^2 - ce)(b^2 - ce) \\le 0$, $(b^2 - da)(c^2 - da) \\le 0$, $(c^2 - eb)(d^2 - eb) \\le 0$, $(d^2 - ac)(e^2 - ac) \\le 0$, $(e^2 - bd)(a^2 - bd) \\le 0$ hold", "五個不等式 $(a^2 - ce)(b^2 - ce) \\le 0$、$(b^2 - da)(c^2 - da) \\le 0$、$(c^2 - eb)(d^2 - eb) \\le 0$、$(d^2 - ac)(e^2 - ac) \\le 0$、$(e^2 - bd)(a^2 - bd) \\le 0$ 同時成立，"], lean: "(a^2 - c * e) * (b^2 - c * e) ≤ 0 ∧\n    (b^2 - d * a) * (c^2 - d * a) ≤ 0 ∧\n    (c^2 - e * b) * (d^2 - e * b) ≤ 0 ∧\n    (d^2 - a * c) * (e^2 - a * c) ≤ 0 ∧\n    (e^2 - b * d) * (a^2 - b * d) ≤ 0" },
      { human: ["if and only if $a = b = c = d = e$.", "若且唯若 $a = b = c = d = e$。"], lean: "↔\n      (a, b, c, d, e) ∈ solution_set" },
    ],
    paper: [
      {
        text: ["The answer: all five numbers equal.", "答案：五個數全部相等。"],
        lines: [23, 24],
        lean: ["abbrev solution_set : Set (ℝ × ℝ × ℝ × ℝ × ℝ) :=", "{(a, b, c, d, e) | a = b ∧ b = c ∧ c = d ∧ d = e}"],
      },
      {
        text: ["Claim: for positive reals, the five inequalities hold if and only if $a = b = c = d = e$.", "主張：對正實數，五個不等式同時成立若且唯若 $a = b = c = d = e$。"],
        lines: [26, 33],
        lean: ["theorem imo1972_p4 (a b c d e : ℝ)", "(h₀ : 0 < a ∧ 0 < b ∧ 0 < c ∧ 0 < d ∧ 0 < e):", "(a^2 - c * e) * (b^2 - c * e) ≤ 0 ∧", "(b^2 - d * a) * (c^2 - d * a) ≤ 0 ∧", "(c^2 - e * b) * (d^2 - e * b) ≤ 0 ∧", "(d^2 - a * c) * (e^2 - a * c) ≤ 0 ∧", "(e^2 - b * d) * (a^2 - b * d) ≤ 0 ↔", "(a, b, c, d, e) ∈ solution_set := by"],
      },
      {
        text: ["We prove the two directions.", "我們證明兩個方向。"],
        lines: [34, 35],
        lean: ["rw [solution_set]", "constructor"],
      },
      {
        text: ["Suppose the five inequalities hold. Expanding, twice the sum of their five left sides is exactly the sum of the ten squares $(ab - ad)^2 + (bc - be)^2 + \\dots + (eb - ed)^2$; so that sum of squares is $\\le 0$.", "假設五個不等式成立。展開後，五個左邊的和的兩倍恰好是十個平方的和 $(ab - ad)^2 + (bc - be)^2 + \\dots + (eb - ed)^2$；所以這個平方和 $\\le 0$。"],
        lines: [36, 41],
        lean: ["· rintro h", "have :", "(a * b - a * d) ^ 2 + (b * c - b * e) ^ 2 + (c * d - c * a) ^ 2 +", "(d * e - d * b) ^ 2 + (e * a - e * c) ^ 2 + (a * c - a * e) ^ 2 +", "(b * d - b * a) ^ 2 + (c * e - c * b) ^ 2 + (d * a - d * c) ^ 2 +", "(e * b - e * d) ^ 2 ≤ 0 := by linarith"],
      },
      {
        text: ["A sum of squares that is $\\le 0$ has every square $0$: $a(b - d) = 0$, so $b = d$ (as $a > 0$); likewise $c = e$, $d = a$, $e = b$, $a = c$. Hence $a = b = c = d = e$.", "$\\le 0$ 的平方和，每個平方都是 $0$：$a(b - d) = 0$，所以 $b = d$（因為 $a > 0$）；同理 $c = e$、$d = a$、$e = b$、$a = c$。因此 $a = b = c = d = e$。"],
        lines: [42, 42],
        lean: ["grind (splits := 10) [eq_zero_of_add_nonpos_left, sq_nonneg, sq_eq_zero_iff]"],
      },
      {
        text: ["Conversely, if all five are equal, every factor is $a^2 - a \\cdot a = 0$, and $0 \\le 0$.", "反過來，若五個數全部相等，每個因子都是 $a^2 - a \\cdot a = 0$，而 $0 \\le 0$。"],
        lines: [43, 43],
        lean: ["· simp +contextual [sq]"],
      },
    ],
  },
  "imo-1977-p6": {
    statementMirror: [
      { human: ["Theorem (imo1977_p6):", "定理（imo1977_p6）："], lean: "theorem imo1977_p6" },
      { human: ["Let $f$ map positive integers to positive integers", "設 $f$ 把正整數映到正整數，"], lean: "(f : ℕ+ → ℕ+)" },
      { human: ["with $f(f(n)) < f(n + 1)$ for every positive integer $n$.", "且對每個正整數 $n$，$f(f(n)) < f(n + 1)$。"], lean: "(h : ∀ n, f (f n) < f (n + 1))" },
      { human: ["Then $f(n) = n$ for every positive integer $n$.", "則對每個正整數 $n$，$f(n) = n$。"], lean: "∀ n, f n = n" },
    ],
    paper: [
      {
        text: ["First the same statement for $f : \\mathbb{N} \\to \\mathbb{N}$, with $0$ included: if $f(f(n)) < f(n + 1)$ for all $n$, then $f(n) = n$ for all $n$.", "先對 $f : \\mathbb{N} \\to \\mathbb{N}$（包括 $0$）證明同樣的陳述：若對所有 $n$ 都有 $f(f(n)) < f(n + 1)$，則對所有 $n$，$f(n) = n$。"],
        lines: [23, 23],
        lean: ["theorem imo1977_p6_nat (f : ℕ → ℕ) (h : ∀ n, f (f n) < f (n + 1)) : ∀ n, f n = n := by"],
      },
      {
        text: ["Claim: for all $k$ and $n$, $k \\le n$ implies $k \\le f(n)$. By induction on $k$; $k = 0$ is clear.", "主張：對所有 $k$ 與 $n$，$k \\le n$ 推得 $k \\le f(n)$。對 $k$ 歸納；$k = 0$ 顯然。"],
        lines: [24, 27],
        lean: ["have h' : ∀ k n : ℕ, k ≤ n → k ≤ f n := by", "intro k", "induction k with", "| zero => intros; exact Nat.zero_le _"],
      },
      {
        text: ["Step: let $k + 1 \\le n$. Then $k \\le n - 1$, so $k \\le f(n - 1)$ by the induction hypothesis, and again $k \\le f(f(n - 1))$. The hypothesis at $n - 1$ gives $f(f(n - 1)) < f(n)$, so $k < f(n)$, i.e. $k + 1 \\le f(n)$.", "推進：設 $k + 1 \\le n$。則 $k \\le n - 1$，由歸納假設 $k \\le f(n - 1)$，再用一次得 $k \\le f(f(n - 1))$。在 $n - 1$ 套用條件得 $f(f(n - 1)) < f(n)$，所以 $k < f(n)$，也就是 $k + 1 \\le f(n)$。"],
        lines: [28, 33],
        lean: ["| succ k h_ind =>", "intro n hk", "apply Nat.succ_le_of_lt", "calc", "k ≤ f (f (n - 1)) := h_ind _ (h_ind (n - 1) (le_tsub_of_add_le_right hk))", "_ < f n := tsub_add_cancel_of_le (le_trans (Nat.succ_le_succ (Nat.zero_le _)) hk) ▸ h _"],
      },
      {
        text: ["With $k = n$: $n \\le f(n)$ for every $n$.", "取 $k = n$：對每個 $n$，$n \\le f(n)$。"],
        lines: [34, 34],
        lean: ["have hf : ∀ n, n ≤ f n := fun n => h' n n rfl.le"],
      },
      {
        text: ["So $f$ is strictly increasing: $f(n) \\le f(f(n)) < f(n + 1)$.", "所以 $f$ 嚴格遞增：$f(n) \\le f(f(n)) < f(n + 1)$。"],
        lines: [35, 35],
        lean: ["have hf_mono : StrictMono f := strictMono_nat_of_lt_succ fun _ => lt_of_le_of_lt (hf _) (h _)"],
      },
      {
        text: ["Now $f(f(n)) < f(n + 1)$ and strict monotonicity give $f(n) < n + 1$; with $n \\le f(n)$, $f(n) = n$.", "現在 $f(f(n)) < f(n + 1)$ 加上嚴格遞增，得到 $f(n) < n + 1$；配上 $n \\le f(n)$，$f(n) = n$。"],
        lines: [36, 37],
        lean: ["intro", "exact Nat.eq_of_le_of_lt_succ (hf _) (hf_mono.lt_iff_lt.mp (h _))"],
      },
      {
        text: ["Back to $f$ on the positive integers; fix $n$.", "回到正整數上的 $f$；固定 $n$。"],
        lines: [39, 40],
        lean: ["theorem imo1977_p6 (f : ℕ+ → ℕ+) (h : ∀ n, f (f n) < f (n + 1)) : ∀ n, f n = n := by", "intro n"],
      },
      {
        text: ["Extend $f$ to $\\mathbb{N}$ by $g(0) = 0$ and $g(m) = f(m)$ for $m > 0$, and apply the $\\mathbb{N}$ version to $g$ at $n$; it remains to check $g(g(m)) < g(m + 1)$ for every $m$.", "把 $f$ 延伸到 $\\mathbb{N}$：$g(0) = 0$，$m > 0$ 時 $g(m) = f(m)$；對 $g$ 在 $n$ 套用 $\\mathbb{N}$ 的版本，剩下要檢查對每個 $m$，$g(g(m)) < g(m + 1)$。"],
        lines: [41, 42],
        lean: ["have := by", "refine imo1977_p6_nat (fun m => if 0 < m then f m.toPNat' else 0) ?_ n"],
      },
      {
        text: ["At $m = 0$: $g(g(0)) = g(0) = 0 < g(1) = f(1)$, since $f(1)$ is positive. At $m > 0$: $g(g(m)) = f(f(m)) < f(m + 1) = g(m + 1)$, the hypothesis.", "在 $m = 0$：$g(g(0)) = g(0) = 0 < g(1) = f(1)$，因為 $f(1)$ 是正數。在 $m > 0$：$g(g(m)) = f(f(m)) < f(m + 1) = g(m + 1)$，就是條件本身。"],
        lines: [43, 46],
        lean: ["intro x; cases x", "· simp", "· simp only [Nat.succ_pos, ite_true, PNat.pos, PNat.coe_toPNat', PNat.coe_lt_coe]", "exact h _"],
      },
      {
        text: ["So $f(n) = g(n) = n$.", "所以 $f(n) = g(n) = n$。"],
        lines: [47, 47],
        lean: ["simpa"],
      },
    ],
  },
  "imo-2001-p6": {
    statementMirror: [
      { human: ["Theorem (imo2001_p6):", "定理（imo2001_p6）："], lean: "theorem imo2001_p6" },
      { human: ["Let $a, b, c, d$ be integers", "設 $a, b, c, d$ 為整數，"], lean: "{a b c d : ℤ}" },
      { human: ["with $a > b > c > d > 0$", "滿足 $a > b > c > d > 0$，"], lean: "(hd : 0 < d) (hdc : d < c) (hcb : c < b) (hba : b < a)" },
      { human: ["and $ac + bd = (a + b - c + d)(-a + b + c + d)$.", "且 $ac + bd = (a + b - c + d)(-a + b + c + d)$。"], lean: "(h : a * c + b * d = (a + b - c + d) * (-a + b + c + d))" },
      { human: ["Then $ab + cd$ is not prime (prime as an element of the ring $\\mathbb{Z}$; for a positive integer this is the usual notion).", "則 $ab + cd$ 不是質數（指環 $\\mathbb{Z}$ 中的質元素；對正整數，這就是平常的質數）。"], lean: "¬Prime (a * b + c * d)" },
    ],
    paper: [
      {
        text: ["Let $a > b > c > d > 0$ be integers with $ac + bd = (a + b - c + d)(-a + b + c + d)$; we show $ab + cd$ is not prime.", "設整數 $a > b > c > d > 0$ 滿足 $ac + bd = (a + b - c + d)(-a + b + c + d)$；我們證明 $ab + cd$ 不是質數。"],
        lines: [21, 22],
        lean: ["theorem imo2001_p6 {a b c d : ℤ} (hd : 0 < d) (hdc : d < c) (hcb : c < b) (hba : b < a)", "(h : a * c + b * d = (a + b - c + d) * (-a + b + c + d)) : ¬Prime (a * b + c * d) := by"],
      },
      {
        text: ["Suppose $ab + cd$ is prime.", "假設 $ab + cd$ 是質數。"],
        lines: [23, 23],
        lean: ["intro (h0 : Prime (a * b + c * d))"],
      },
      {
        text: ["All of $a$, $b$, $c$ are positive (they exceed $d > 0$).", "$a$、$b$、$c$ 都是正數（它們都大於 $d > 0$）。"],
        lines: [24, 26],
        lean: ["have ha : 0 < a := by lia", "have hb : 0 < b := by lia", "have hc : 0 < c := by lia"],
      },
      {
        text: ["Key step: $ac + bd \\mid (ab + cd)(ad + bc)$. The hypothesis expands to $a^2 - ac + c^2 = b^2 + bd + d^2$, and with it $(ab + cd)(ad + bc) = (ac + bd)(b^2 + bd + d^2)$.", "關鍵一步：$ac + bd \\mid (ab + cd)(ad + bc)$。假設展開後是 $a^2 - ac + c^2 = b^2 + bd + d^2$，用它可得 $(ab + cd)(ad + bc) = (ac + bd)(b^2 + bd + d^2)$。"],
        lines: [27, 30],
        lean: ["-- the key step is to show that `a*c + b*d` divides the product `(a*b + c*d) * (a*d + b*c)`", "have dvd_mul : a * c + b * d ∣ (a * b + c * d) * (a * d + b * c) := by", "use b ^ 2 + b * d + d ^ 2", "linear_combination b * d * h"],
      },
      {
        text: ["Since $ab + cd$ is prime, either $ab + cd \\mid ac + bd$, or $ac + bd \\mid ad + bc$.", "因為 $ab + cd$ 是質數，所以 $ab + cd \\mid ac + bd$，或者 $ac + bd \\mid ad + bc$。"],
        lines: [31, 33],
        lean: ["-- since `a*b + c*d` is prime (by assumption), it must divide `a*c + b*d` or `a*d + b*c`", "obtain (h1 : a * b + c * d ∣ a * c + b * d) | (h2 : a * c + b * d ∣ a * d + b * c) :=", "h0.left_dvd_or_dvd_right_of_dvd_mul dvd_mul"],
      },
      {
        text: ["Case 1: $ab + cd \\mid ac + bd$ with $ac + bd > 0$, so $ab + cd \\le ac + bd$. But $(ab + cd) - (ac + bd) = (a - d)(b - c) > 0$: a contradiction.", "情形一：$ab + cd \\mid ac + bd$ 且 $ac + bd > 0$，所以 $ab + cd \\le ac + bd$。但 $(ab + cd) - (ac + bd) = (a - d)(b - c) > 0$：矛盾。"],
        lines: [34, 37],
        lean: ["-- in both cases, we derive a contradiction", "· have aux : 0 < a * c + b * d := by positivity", "have : a * b + c * d ≤ a * c + b * d := Int.le_of_dvd aux h1", "nlinarith only [hba, hcb, hdc, h, this]"],
      },
      {
        text: ["Case 2: $ac + bd \\mid ad + bc$ with $ad + bc > 0$, so $ac + bd \\le ad + bc$. But $(ac + bd) - (ad + bc) = (a - b)(c - d) > 0$: a contradiction.", "情形二：$ac + bd \\mid ad + bc$ 且 $ad + bc > 0$，所以 $ac + bd \\le ad + bc$。但 $(ac + bd) - (ad + bc) = (a - b)(c - d) > 0$：矛盾。"],
        lines: [38, 40],
        lean: ["· have aux : 0 < a * d + b * c := by positivity", "have : a * c + b * d ≤ a * d + b * c := Int.le_of_dvd aux h2", "nlinarith only [hba, hdc, h, this]"],
      },
    ],
  },
  "imo-2005-p3": {
    statementMirror: [
      { human: ["Theorem (imo2005_p3):", "定理（imo2005_p3）："], lean: "theorem imo2005_p3" },
      { human: ["For real numbers $x, y, z$", "對實數 $x, y, z$，"], lean: "(x y z : ℝ)" },
      { human: ["that are positive", "且都是正數，"], lean: "(hx : x > 0) (hy : y > 0) (hz : z > 0)" },
      { human: ["with $xyz \\ge 1$:", "滿足 $xyz \\ge 1$："], lean: "(h : x * y * z ≥ 1)" },
      { human: ["$\\frac{x^5 - x^2}{x^5 + y^2 + z^2} + \\frac{y^5 - y^2}{y^5 + z^2 + x^2} + \\frac{z^5 - z^2}{z^5 + x^2 + y^2} \\ge 0$ (every denominator is positive, so Lean's division by zero never occurs).", "$\\frac{x^5 - x^2}{x^5 + y^2 + z^2} + \\frac{y^5 - y^2}{y^5 + z^2 + x^2} + \\frac{z^5 - z^2}{z^5 + x^2 + y^2} \\ge 0$（每個分母都是正的，所以不會碰到 Lean 的除以零）。"], lean: "(x ^ 5 - x ^ 2) / (x ^ 5 + y ^ 2 + z ^ 2) + (y ^ 5 - y ^ 2) / (y ^ 5 + z ^ 2 + x ^ 2) +\n        (z ^ 5 - z ^ 2) / (z ^ 5 + x ^ 2 + y ^ 2) ≥\n      0" },
    ],
    paper: [
      {
        text: ["Key inequality (Boreico): for positive $x, y, z$ with $xyz \\ge 1$, $\\frac{x^5 - x^2}{x^5 + y^2 + z^2} \\ge \\frac{x^2 - yz}{x^2 + y^2 + z^2}$.", "關鍵不等式（Boreico）：對正數 $x, y, z$，若 $xyz \\ge 1$，則 $\\frac{x^5 - x^2}{x^5 + y^2 + z^2} \\ge \\frac{x^2 - yz}{x^2 + y^2 + z^2}$。"],
        lines: [25, 26],
        lean: ["theorem key_insight (x y z : ℝ) (hx : x > 0) (hy : y > 0) (hz : z > 0) (h : x * y * z ≥ 1) :", "(x ^ 5 - x ^ 2) / (x ^ 5 + y ^ 2 + z ^ 2) ≥ (x ^ 2 - y * z) / (x ^ 2 + y ^ 2 + z ^ 2) := by"],
      },
      {
        text: ["Compare with $\\frac{x^5 - x^2}{x^3(x^2 + y^2 + z^2)}$: the difference is $\\frac{(x^3 - 1)^2 x^2 (y^2 + z^2)}{(x^5 + y^2 + z^2)\\, x^3 (x^2 + y^2 + z^2)}$ (clear the denominators and expand).", "和 $\\frac{x^5 - x^2}{x^3(x^2 + y^2 + z^2)}$ 比較：兩者的差是 $\\frac{(x^3 - 1)^2 x^2 (y^2 + z^2)}{(x^5 + y^2 + z^2)\\, x^3 (x^2 + y^2 + z^2)}$（通分後展開）。"],
        lines: [27, 33],
        lean: ["have key :", "(x ^ 5 - x ^ 2) / (x ^ 5 + y ^ 2 + z ^ 2) -", "(x ^ 5 - x ^ 2 * 1) / (x ^ 3 * (x ^ 2 + y ^ 2 + z ^ 2)) =", "(x ^ 3 - 1) ^ 2 * x ^ 2 * (y ^ 2 + z ^ 2) /", "((x ^ 5 + y ^ 2 + z ^ 2) * (x ^ 3 * (x ^ 2 + y ^ 2 + z ^ 2))) := by", "field_simp", "ring"],
      },
      {
        text: ["That difference is $\\ge 0$: a square times positive factors over a positive denominator.", "這個差 $\\ge 0$：一個平方乘上正的因子，除以正的分母。"],
        lines: [34, 36],
        lean: ["have h₅ :", "(x ^ 3 - 1) ^ 2 * x ^ 2 * (y ^ 2 + z ^ 2) /", "((x ^ 5 + y ^ 2 + z ^ 2) * (x ^ 3 * (x ^ 2 + y ^ 2 + z ^ 2))) ≥ 0 := by positivity"],
      },
      {
        text: ["So $\\frac{x^5 - x^2}{x^5 + y^2 + z^2} \\ge \\frac{x^5 - x^2}{x^3(x^2 + y^2 + z^2)}$,", "所以 $\\frac{x^5 - x^2}{x^5 + y^2 + z^2} \\ge \\frac{x^5 - x^2}{x^3(x^2 + y^2 + z^2)}$，"],
        lines: [37, 39],
        lean: ["calc", "(x ^ 5 - x ^ 2) / (x ^ 5 + y ^ 2 + z ^ 2)", "≥ (x ^ 5 - x ^ 2 * 1) / (x ^ 3 * (x ^ 2 + y ^ 2 + z ^ 2)) := by linarith only [key, h₅]"],
      },
      {
        text: ["$\\ge \\frac{x^5 - x^2 \\cdot xyz}{x^3(x^2 + y^2 + z^2)}$, because $xyz \\ge 1$,", "$\\ge \\frac{x^5 - x^2 \\cdot xyz}{x^3(x^2 + y^2 + z^2)}$，因為 $xyz \\ge 1$，"],
        lines: [40, 40],
        lean: ["_ ≥ (x ^ 5 - x ^ 2 * (x * y * z)) / (x ^ 3 * (x ^ 2 + y ^ 2 + z ^ 2)) := by gcongr"],
      },
      {
        text: ["$= \\frac{x^3(x^2 - yz)}{x^3(x^2 + y^2 + z^2)} = \\frac{x^2 - yz}{x^2 + y^2 + z^2}$.", "$= \\frac{x^3(x^2 - yz)}{x^3(x^2 + y^2 + z^2)} = \\frac{x^2 - yz}{x^2 + y^2 + z^2}$。"],
        lines: [41, 41],
        lean: ["_ = (x ^ 2 - y * z) / (x ^ 2 + y ^ 2 + z ^ 2) := by field_simp"],
      },
      {
        text: ["The problem: for positive $x, y, z$ with $xyz \\ge 1$, the sum of the three fractions is $\\ge 0$.", "本題：對正數 $x, y, z$，若 $xyz \\ge 1$，三個分數的和 $\\ge 0$。"],
        lines: [43, 46],
        lean: ["theorem imo2005_p3 (x y z : ℝ) (hx : x > 0) (hy : y > 0) (hz : z > 0) (h : x * y * z ≥ 1) :", "(x ^ 5 - x ^ 2) / (x ^ 5 + y ^ 2 + z ^ 2) + (y ^ 5 - y ^ 2) / (y ^ 5 + z ^ 2 + x ^ 2) +", "(z ^ 5 - z ^ 2) / (z ^ 5 + x ^ 2 + y ^ 2) ≥", "0 := by"],
      },
      {
        text: ["Apply the key inequality to each term, with the variables in cyclic order ($yzx = zxy = xyz \\ge 1$): the sum is at least $\\frac{x^2 - yz}{x^2 + y^2 + z^2} + \\frac{y^2 - zx}{y^2 + z^2 + x^2} + \\frac{z^2 - xy}{z^2 + x^2 + y^2}$.", "對每一項套用關鍵不等式，變數依循環順序（$yzx = zxy = xyz \\ge 1$）：和至少是 $\\frac{x^2 - yz}{x^2 + y^2 + z^2} + \\frac{y^2 - zx}{y^2 + z^2 + x^2} + \\frac{z^2 - xy}{z^2 + x^2 + y^2}$。"],
        lines: [47, 52],
        lean: ["calc", "(x ^ 5 - x ^ 2) / (x ^ 5 + y ^ 2 + z ^ 2) + (y ^ 5 - y ^ 2) / (y ^ 5 + z ^ 2 + x ^ 2) +", "(z ^ 5 - z ^ 2) / (z ^ 5 + x ^ 2 + y ^ 2) ≥", "(x ^ 2 - y * z) / (x ^ 2 + y ^ 2 + z ^ 2) + (y ^ 2 - z * x) / (y ^ 2 + z ^ 2 + x ^ 2) +", "(z ^ 2 - x * y) / (z ^ 2 + x ^ 2 + y ^ 2) := by", "gcongr ?_ + ?_ + ?_ <;> apply key_insight <;> linarith"],
      },
      {
        text: ["The three denominators are equal, and the numerators add up to $x^2 + y^2 + z^2 - xy - yz - zx = \\frac12\\left((x - y)^2 + (y - z)^2 + (z - x)^2\\right)$,", "三個分母相等，分子加起來是 $x^2 + y^2 + z^2 - xy - yz - zx = \\frac12\\left((x - y)^2 + (y - z)^2 + (z - x)^2\\right)$，"],
        lines: [53, 53],
        lean: ["_ = 1 / 2 * ((x - y) ^ 2 + (y - z) ^ 2 + (z - x) ^ 2) / (x ^ 2 + y ^ 2 + z ^ 2) := by ring"],
      },
      {
        text: ["so the bound is $\\ge 0$.", "所以這個下界 $\\ge 0$。"],
        lines: [54, 54],
        lean: ["_ ≥ 0 := by positivity"],
      },
    ],
  },
  "pit-flt-zero": {
    statementMirror: [
      { human: ["Theorem (flt_misstated):", "定理（flt_misstated）："], lean: "theorem flt_misstated" },
      { human: ["It is not true that for all natural numbers $a$, $b$, $c$, $n$ with $n \\ge 3$, $a^n + b^n \\ne c^n$. (Fermat's Last Theorem as typed: without “positive”, and $\\mathbb{N}$ contains $0$.)", "「對所有滿足 $n \\ge 3$ 的自然數 $a$、$b$、$c$、$n$，$a^n + b^n \\ne c^n$」並不成立。（照字面打出的費馬最後定理：少了「正數」，而 $\\mathbb{N}$ 含有 $0$。）"], lean: "¬ ∀ a b c n : Nat, n ≥ 3 → a ^ n + b ^ n ≠ c ^ n" },
      { human: ["Theorem (flt_three_small):", "定理（flt_three_small）："], lean: "theorem flt_three_small" },
      { human: ["For natural numbers $a, b, c < 10$", "對自然數 $a, b, c < 10$，"], lean: "∀ a, a < 10 → ∀ b, b < 10 → ∀ c, c < 10 →" },
      { human: ["that are positive,", "且都是正數，"], lean: "0 < a ∧ 0 < b ∧ 0 < c" },
      { human: ["$a^3 + b^3 \\ne c^3$ (the corrected statement, for $n = 3$ and small numbers only).", "$a^3 + b^3 \\ne c^3$（改正後的陳述，只針對 $n = 3$ 與小的數）。"], lean: "a ^ 3 + b ^ 3 ≠ c ^ 3" },
    ],
    paper: [
      {
        text: ["Fermat's Last Theorem is about positive integers. Typed over $\\mathbb{N}$ without that hypothesis, the statement is false; we prove its negation.", "費馬最後定理談的是正整數。在 $\\mathbb{N}$ 上打成沒有這個條件的陳述，它就是錯的；我們證明它的否定。"],
        lines: [2, 2],
        lean: ["theorem flt_misstated : ¬ ∀ a b c n : Nat, n ≥ 3 → a ^ n + b ^ n ≠ c ^ n := by"],
      },
      {
        text: ["Suppose $a^n + b^n \\ne c^n$ for all natural $a$, $b$, $c$ and all $n \\ge 3$.", "假設對所有自然數 $a$、$b$、$c$ 與所有 $n \\ge 3$，$a^n + b^n \\ne c^n$。"],
        lines: [3, 3],
        lean: ["intro h"],
        goal: "⊢ ¬∀ (a b c n : Nat), n ≥ 3 → a ^ n + b ^ n ≠ c ^ n",
      },
      {
        text: ["Take $a = b = c = 0$, $n = 3$: $3 \\ge 3$, and $0^3 + 0^3 = 0 = 0^3$, a contradiction. This is where the typed claim and Fermat's part: the counterexample uses $0$, which Fermat's theorem excludes.", "取 $a = b = c = 0$、$n = 3$：$3 \\ge 3$，而 $0^3 + 0^3 = 0 = 0^3$，矛盾。打出來的陳述正是在這裡與費馬的定理分道揚鑣：反例用到 $0$，而費馬定理排除了它。"],
        lines: [4, 4],
        lean: ["exact h 0 0 0 3 (by decide) rfl"],
        goal: "h : ∀ (a b c n : Nat), n ≥ 3 → a ^ n + b ^ n ≠ c ^ n\n⊢ False",
      },
      {
        text: ["The fix: put the hypothesis back, $0 < a, b, c$. Here it is only checked for $n = 3$ and $a, b, c < 10$: evidence, not a proof (Wiles's proof is not in this file).", "改正：把條件放回去，$0 < a, b, c$。這裡只在 $n = 3$、$a, b, c < 10$ 上檢查：是證據，不是證明（Wiles 的證明不在這個檔案裡）。"],
        lines: [6, 8],
        lean: ["-- the hypotheses put back (a, b, c positive), checked for n = 3 and a, b, c < 10: evidence, not a proof", "theorem flt_three_small : ∀ a, a < 10 → ∀ b, b < 10 → ∀ c, c < 10 →", "0 < a ∧ 0 < b ∧ 0 < c → a ^ 3 + b ^ 3 ≠ c ^ 3 := by"],
      },
      {
        text: ["Check all $10^3$ triples by computation (those with a $0$ satisfy the claim vacuously, since the hypothesis fails).", "用計算檢查全部 $10^3$ 組（含 $0$ 的組，條件不成立，主張自動成立）。"],
        lines: [9, 9],
        lean: ["decide"],
        goal: "⊢ ∀ (a : Nat), a < 10 → ∀ (b : Nat), b < 10 → ∀ (c : Nat), c < 10 → 0 < a ∧ 0 < b ∧ 0 < c → a ^ 3 + b ^ 3 ≠ c ^ 3",
      },
    ],
  },
  "pit-fermat-641": {
    statementMirror: [
      { human: ["$p$ is prime: $p \\ge 2$ and its only divisors are $1$ and $p$.", "$p$ 是質數：$p \\ge 2$，而且它的因數只有 $1$ 與 $p$。"], lean: "def isPrime (p : Nat) : Prop := 2 ≤ p ∧ ∀ d, d ∣ p → d = 1 ∨ d = p" },
      { human: ["Theorem (euler_641):", "定理（euler_641）："], lean: "theorem euler_641" },
      { human: ["$641$ divides $F_5 = 2^{2^5} + 1 = 2^{32} + 1$.", "$641$ 整除 $F_5 = 2^{2^5} + 1 = 2^{32} + 1$。"], lean: "641 ∣ 2 ^ 2 ^ 5 + 1" },
      { human: ["Theorem (fermat_claim_false):", "定理（fermat_claim_false）："], lean: "theorem fermat_claim_false" },
      { human: ["It is not true that $F_n = 2^{2^n} + 1$ is prime for every natural number $n$.", "「對每個自然數 $n$，$F_n = 2^{2^n} + 1$ 都是質數」並不成立。"], lean: "¬ ∀ n : Nat, isPrime (2 ^ 2 ^ n + 1)" },
    ],
    paper: [
      {
        text: ["A natural number $p$ is prime when $p \\ge 2$ and its only divisors are $1$ and $p$.", "自然數 $p$ 是質數，是指 $p \\ge 2$ 且它的因數只有 $1$ 與 $p$。"],
        lines: [1, 2],
        lean: ["/-- `p` is prime: at least 2, and its only divisors are 1 and itself -/", "def isPrime (p : Nat) : Prop := 2 ≤ p ∧ ∀ d, d ∣ p → d = 1 ∨ d = p"],
      },
      {
        text: ["Euler (1732): $641 \\mid 2^{32} + 1$.", "歐拉（1732）：$641 \\mid 2^{32} + 1$。"],
        lines: [4, 5],
        lean: ["-- Euler (1732): 641 divides the fifth Fermat number 2 ^ 32 + 1", "theorem euler_641 : 641 ∣ 2 ^ 2 ^ 5 + 1 := by"],
      },
      {
        text: ["Indeed $2^{32} + 1 = 4294967297 = 641 \\cdot 6700417$.", "確實 $2^{32} + 1 = 4294967297 = 641 \\cdot 6700417$。"],
        lines: [6, 6],
        lean: ["exact ⟨6700417, by decide⟩"],
        goal: "⊢ 641 ∣ 2 ^ 2 ^ 5 + 1",
      },
      {
        text: ["Fermat's conjecture, that every $F_n = 2^{2^n} + 1$ is prime, is false. It is right for $F_0, \\dots, F_4$; it breaks at $F_5$.", "費馬的猜想「每個 $F_n = 2^{2^n} + 1$ 都是質數」是錯的。它對 $F_0, \\dots, F_4$ 成立；在 $F_5$ 破功。"],
        lines: [8, 9],
        lean: ["-- so the claim \"every 2 ^ (2 ^ n) + 1 is prime\" is false", "theorem fermat_claim_false : ¬ ∀ n : Nat, isPrime (2 ^ 2 ^ n + 1) := by"],
      },
      {
        text: ["Suppose every $F_n$ is prime.", "假設每個 $F_n$ 都是質數。"],
        lines: [10, 10],
        lean: ["intro h"],
        goal: "⊢ ¬∀ (n : Nat), isPrime (2 ^ 2 ^ n + 1)",
      },
      {
        text: ["Then $F_5$ is prime, and $641$ divides it, so $641 = 1$ or $641 = F_5$.", "那麼 $F_5$ 是質數，而 $641$ 整除它，所以 $641 = 1$ 或 $641 = F_5$。"],
        lines: [11, 11],
        lean: ["have h5 := (h 5).2 641 euler_641"],
        goal: "h : ∀ (n : Nat), isPrime (2 ^ 2 ^ n + 1)\n⊢ False",
      },
      {
        text: ["Both are false ($F_5 = 4294967297$): a contradiction. A single computation refutes the conjecture.", "兩者都不成立（$F_5 = 4294967297$）：矛盾。一次計算就推翻了這個猜想。"],
        lines: [12, 13],
        lean: ["revert h5", "decide"],
        goal: "h : ∀ (n : Nat), isPrime (2 ^ 2 ^ n + 1)\nh5 : 641 = 1 ∨ 641 = 2 ^ 2 ^ 5 + 1\n⊢ False",
      },
    ],
  },
  "pit-horses": {
    statementMirror: [
      { human: ["A list of colours is all the same when every entry equals the first one (the empty list counts as all the same).", "一串顏色「全部相同」是指每一項都等於第一項（空串也算全部相同）。"], lean: "def allSame (l : List Nat) : Bool := l.all (· == l.headD 0)" },
      { human: ["“Any $n$ horses have the same colour”: every list of $n$ colours (a horse is its colour, a natural number) is all the same.", "「任意 $n$ 匹馬同色」：每一串 $n$ 個顏色（一匹馬就是它的顏色，一個自然數）都全部相同。"], lean: "def sameColour (n : Nat) : Prop := ∀ l : List Nat, l.length = n → allSame l = true" },
      { human: ["Base case (proved): any one horse has one colour.", "基礎情形（已證明）：任何一匹馬都只有一種顏色。"], lean: "theorem one_horse : sameColour 1" },
      { human: ["Theorem (step_fails):", "定理（step_fails）："], lean: "theorem step_fails" },
      { human: ["It is not true that for every $n$, “any $n$ horses share a colour” implies “any $n + 1$ horses share a colour”.", "「對每個 $n$，任意 $n$ 匹馬同色推得任意 $n + 1$ 匹馬同色」並不成立。"], lean: "¬ ∀ n, sameColour n → sameColour (n + 1)" },
    ],
    paper: [
      {
        text: ["Horses are their colours, natural numbers; “any $n$ horses have the same colour” means every list of $n$ colours is constant.", "馬就是它的顏色，一個自然數；「任意 $n$ 匹馬同色」是說每一串 $n$ 個顏色都是常數。"],
        lines: [1, 5],
        lean: ["/-- every colour in the list equals the first one -/", "def allSame (l : List Nat) : Bool := l.all (· == l.headD 0)", "/-- \"any n horses have the same colour\" (a horse is its colour, a number) -/", "def sameColour (n : Nat) : Prop := ∀ l : List Nat, l.length = n → allSame l = true"],
      },
      {
        text: ["Base case: one horse has one colour.", "基礎情形：一匹馬只有一種顏色。"],
        lines: [7, 8],
        lean: ["-- the base case is fine: one horse has one colour", "theorem one_horse : sameColour 1 := by"],
      },
      {
        text: ["A list of length $1$ is $[a]$, and $a$ equals itself.", "長度為 $1$ 的串是 $[a]$，而 $a$ 等於自己。"],
        lines: [9, 11],
        lean: ["intro l hl", "match l, hl with", "| [a], _ => simp [allSame]"],
        goal: "⊢ sameColour 1",
      },
      {
        text: ["The classical “proof” claims the step: if any $n$ horses share a colour, so do any $n + 1$ (the first $n$ and the last $n$ overlap). We show this step fails for some $n$.", "經典的「證明」宣稱這一步：若任意 $n$ 匹馬同色，則任意 $n + 1$ 匹也同色（前 $n$ 匹與後 $n$ 匹有重疊）。我們證明這一步對某個 $n$ 不成立。"],
        lines: [13, 14],
        lean: ["-- the inductive step \"n horses → n + 1 horses\" does not hold for every n", "theorem step_fails : ¬ ∀ n, sameColour n → sameColour (n + 1) := by"],
      },
      {
        text: ["Suppose the step held for every $n$.", "假設這一步對每個 $n$ 都成立。"],
        lines: [15, 15],
        lean: ["intro h"],
        goal: "⊢ ¬∀ (n : Nat), sameColour n → sameColour (n + 1)",
      },
      {
        text: ["At $n = 1$, with the base case, it gives: any $2$ horses share a colour; in particular the list $[0, 1]$ would be all the same.", "在 $n = 1$，配上基礎情形，它給出：任意 $2$ 匹馬同色；特別是 $[0, 1]$ 這串會全部相同。"],
        lines: [16, 16],
        lean: ["have two := h 1 one_horse [0, 1] rfl"],
        goal: "h : ∀ (n : Nat), sameColour n → sameColour (n + 1)\n⊢ False",
      },
      {
        text: ["But $0 \\ne 1$: a computation, and a contradiction. The classical argument breaks exactly here: for $n + 1 = 2$ the first horse and the last horse have no horse in common, so nothing links their colours.", "但 $0 \\ne 1$：一個計算，矛盾。經典論證正是在這裡斷掉：當 $n + 1 = 2$ 時，第一匹與最後一匹馬沒有共同的馬，沒有任何東西把它們的顏色連起來。"],
        lines: [17, 18],
        lean: ["revert two", "decide"],
        goal: "h : ∀ (n : Nat), sameColour n → sameColour (n + 1)\ntwo : allSame [0, 1] = true\n⊢ False",
      },
    ],
  },
};

/** The mirror of any problem: tutorial problems from GUIDE, the rest from MIRRORS; undefined for an unknown id. */
export function mirrorFor(id: string): ProblemMirror | undefined {
  if (Object.hasOwn(GUIDE, id)) return GUIDE[id];
  if (Object.hasOwn(MIRRORS, id)) return MIRRORS[id];
  return undefined;
}

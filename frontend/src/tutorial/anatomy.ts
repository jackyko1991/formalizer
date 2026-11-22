/** Which problems show the clickable statement (StatementAnatomy) and the mirrors: the tutorial track only, and only
 *  when the start file has the simple `[defs] theorem … := by sorry` shape. Every other problem shows its plain
 *  statement box. Pure, for node tests. */
import { statementParts } from "../tactics.ts";

export const showsAnatomy = (problem: { category: string; start: string }) =>
  problem.category === "tutorial" && statementParts(problem.start) !== null;

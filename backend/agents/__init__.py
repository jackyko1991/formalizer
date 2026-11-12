"""Adapters that let the in-page agent drive different coding agents on one chat's working copy (from Tensorizer).

Every adapter is an async generator `run(...)` yielding the panel's NDJSON events (text, tool, tool_result, check,
question, error, done). `agent.chat` adds the session and the edited files around them, so all agents look the same
to the page.

- claude_code: Claude Code through the Claude Agent SDK (this computer's login, or an API key / OpenRouter).
- codex, opencode, gemini: the OpenAI Codex CLI, OpenCode and the Gemini CLI, run as non-interactive subprocesses
  with JSON output (OpenCode and Gemini remain experimental). They reach `check_proof` through the chat's own MCP
  endpoint (/mcp/<token>, chat_mcp.py) with a token scoped to the chat's working copy.
- scan: which of these CLIs are installed on this computer (and, where cheap to tell, logged in).
"""

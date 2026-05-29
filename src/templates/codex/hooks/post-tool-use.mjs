#!/usr/bin/env node
import { logWrapperDebug, readStdin, repositoryRoot, runSharedHook, writeJson } from "./codewiki-wrapper-lib.mjs";

const payload = readStdin();
const root = repositoryRoot();
const output = runSharedHook(root, "post-verify.mjs", "PostToolUse", payload).trim();

if (process.env.CODEWIKI_HOOK_DEBUG === "1" && output) {
  logWrapperDebug(root, {
    event: "PostToolUse",
    stdoutProduced: true,
    wrapperJson: "true",
    observableContext: "advisory",
    message: "wrapped hook stdout as Codex PostToolUse JSON"
  });
  writeJson({ hookSpecificOutput: { hookEventName: "PostToolUse", additionalContext: output } });
} else {
  logWrapperDebug(root, {
    event: "PostToolUse",
    stdoutProduced: false,
    wrapperJson: "false",
    observableContext: "none",
    message: "returned empty Codex PostToolUse JSON"
  });
  writeJson({});
}

#!/usr/bin/env node
import { logWrapperDebug, readStdin, repositoryRoot, runSharedHook, writeJson } from "./codewiki-wrapper-lib.mjs";

const payload = readStdin();
const root = repositoryRoot();
const output = runSharedHook(root, "post-verify.mjs", "postToolUse", payload).trim();

if (process.env.CODEWIKI_HOOK_DEBUG === "1" && output) {
  logWrapperDebug(root, { event: "postToolUse", stdoutProduced: true, wrapperJson: "true", observableContext: "advisory", message: "wrapped hook stdout as Copilot additionalContext JSON" });
  writeJson({ additionalContext: output });
} else {
  logWrapperDebug(root, { event: "postToolUse", stdoutProduced: false, wrapperJson: "false", observableContext: "none", message: "returned empty Copilot postToolUse JSON" });
  writeJson({});
}

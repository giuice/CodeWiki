#!/usr/bin/env node
import { hasStopHookActive, logWrapperDebug, readStdin, repositoryRoot, runSharedHook, writeJson } from "./codewiki-wrapper-lib.mjs";

const payload = readStdin();
const root = repositoryRoot();

if (hasStopHookActive(payload)) {
  writeJson({});
} else {
  const output = runSharedHook(root, "session-end.mjs", "Stop", payload).trim();

  if (process.env.CODEWIKI_HOOK_DEBUG === "1" && output) {
    logWrapperDebug(root, {
      event: "Stop",
      stdoutProduced: true,
      wrapperJson: "true",
      observableContext: "continuation",
      message: "wrapped hook stdout as Codex Stop block JSON"
    });
    writeJson({ decision: "block", reason: output });
  } else {
    logWrapperDebug(root, {
      event: "Stop",
      stdoutProduced: false,
      wrapperJson: "false",
      observableContext: "none",
      message: "returned empty Codex Stop JSON"
    });
    writeJson({});
  }
}

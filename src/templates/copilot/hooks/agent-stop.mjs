#!/usr/bin/env node
import { hasFollowupMarker, logWrapperDebug, readStdin, repositoryRoot, runSharedHook, writeJson } from "./codewiki-wrapper-lib.mjs";

const payload = readStdin();
const root = repositoryRoot();

if (hasFollowupMarker(payload)) {
  writeJson({ decision: "allow" });
} else {
  const output = runSharedHook(root, "session-end.mjs", "agentStop", payload, { passInput: false }).trim();

  if (process.env.CODEWIKI_HOOK_DEBUG === "1" && output) {
    logWrapperDebug(root, { event: "agentStop", stdoutProduced: true, wrapperJson: "true", observableContext: "continuation", message: "wrapped hook stdout as Copilot agentStop block JSON" });
    writeJson({ decision: "block", reason: `CODEWIKI_TRIGGERED_FOLLOWUP\n${output}` });
  } else {
    logWrapperDebug(root, { event: "agentStop", stdoutProduced: false, wrapperJson: "false", observableContext: "none", message: "returned allow decision for Copilot agentStop" });
    writeJson({ decision: "allow" });
  }
}

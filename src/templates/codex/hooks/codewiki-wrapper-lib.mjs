import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

export function readStdin() {
  if (process.stdin.isTTY) return "";
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}

export function repositoryRoot() {
  const result = spawnSync("git", ["rev-parse", "--show-toplevel"], { encoding: "utf8", windowsHide: true });
  return result.status === 0 && result.stdout.trim() ? result.stdout.trim() : process.cwd();
}

export function runSharedHook(root, hookName, eventName, payload, options = {}) {
  const passInput = options.passInput !== false;
  const result = spawnSync(process.execPath, [path.join(root, ".codewiki", "hooks", hookName)], {
    cwd: root,
    encoding: "utf8",
    env: {
      ...process.env,
      CODEWIKI_HOOK_HOST: "codex",
      CODEWIKI_HOOK_EVENT: eventName
    },
    ...(passInput ? { input: payload } : { stdio: ["ignore", "pipe", "pipe"] }),
    timeout: 30000,
    windowsHide: true
  });

  return result.status === 0 ? result.stdout : "";
}

export function writeJson(value) {
  process.stdout.write(`${JSON.stringify(value)}\n`);
}

export function logWrapperDebug(root, { event, stdoutProduced, wrapperJson, observableContext, message }) {
  if (process.env.CODEWIKI_HOOK_DEBUG !== "1") return;

  try {
    const stateDir = path.join(root, ".codewiki", "state");
    mkdirSync(stateDir, { recursive: true });
    writeFileSync(
      path.join(stateDir, "hooks-debug.jsonl"),
      `${JSON.stringify({
        timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
        host: "codex",
        event,
        stage: "wrapper",
        stdin_payload: "true",
        stdout_produced: stdoutProduced,
        wrapper_json: wrapperJson,
        observable_context: observableContext,
        message
      })}\n`,
      { flag: "a" }
    );
  } catch {
    // CodeWiki hooks are advisory.
  }
}

export function hasStopHookActive(payload) {
  try {
    return JSON.parse(payload)?.stop_hook_active === true;
  } catch {
    return /"stop_hook_active"\s*:\s*true/.test(payload);
  }
}

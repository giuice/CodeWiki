import { join } from "node:path";
import type { Plugin } from "@opencode-ai/plugin";

export const CodeWikiPlugin: Plugin = async ({ $, directory, worktree }) => {
  const hookRoot = join(worktree || directory, ".codewiki", "hooks");

  const runHook = async (hookFile: string, payload?: unknown) => {
    const hookPath = join(hookRoot, hookFile);

    if (!(await Bun.file(hookPath).exists())) {
      return;
    }

    const payloadText = payload == null ? "" : JSON.stringify(payload);

    try {
      if (payloadText) {
        await $`printf '%s' ${payloadText} | sh ${hookPath}`;
        return;
      }

      await $`sh ${hookPath}`;
    } catch {
      // CodeWiki hooks are advisory only and should never block OpenCode.
    }
  };

  return {
    "tool.execute.before": async (input: unknown) => {
      await runHook("pre-wiki-context.sh", input);
    },
    "file.edited": async (event: unknown) => {
      await runHook("post-verify.sh", event);
    },
    "session.idle": async (event: unknown) => {
      // Treat assistant idle as turn-end, not literal session teardown.
      await runHook("session-end.sh", event);
    },
  };
};

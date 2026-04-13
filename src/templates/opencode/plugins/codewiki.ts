import path from "node:path";

function toJson(value: unknown): string {
  try {
    return `${JSON.stringify(value ?? {}, null, 2)}\n`;
  } catch {
    return "{}\n";
  }
}

async function runHook(root: string, hookName: string, payload?: unknown): Promise<void> {
  const hookPath = path.join(root, ".codewiki", "hooks", hookName);

  try {
    const process = Bun.spawn({
      cmd: ["bash", hookPath],
      cwd: root,
      stdin: payload === undefined ? undefined : toJson(payload),
      stdout: "ignore",
      stderr: "ignore"
    });
    await process.exited;
  } catch {
    // CodeWiki hooks are advisory and must never block the host agent.
  }
}

export const CodeWikiPlugin = async ({
  directory,
  worktree
}: {
  directory?: string;
  worktree?: string;
}) => {
  const root = worktree ?? directory ?? process.cwd();

  return {
    "tool.execute.before": async (input: unknown, output: unknown) => {
      await runHook(root, "pre-wiki-context.sh", { input, output });
    },

    "file.edited": async (input: unknown, output: unknown) => {
      await runHook(root, "post-verify.sh", { input, output });
    },

    // `session.idle` is treated as assistant-idle / turn-end, not teardown.
    "session.idle": async (input: unknown) => {
      await runHook(root, "session-end.sh", input);
    }
  };
};

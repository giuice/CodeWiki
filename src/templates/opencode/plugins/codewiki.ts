import { spawn } from "node:child_process";
import path from "node:path";

function toJson(value: unknown): string {
  try {
    return `${JSON.stringify(value ?? {}, null, 2)}\n`;
  } catch {
    return "{}\n";
  }
}

async function runHook(root: string, hookName: string, payload?: unknown): Promise<string> {
  const hookPath = path.join(root, ".codewiki", "hooks", hookName);

  try {
    return await new Promise<string>((resolve) => {
      const child = spawn("bash", [hookPath], {
        cwd: root,
        env: {
          ...process.env,
          CODEWIKI_HOOK_HOST: "opencode",
          CODEWIKI_HOOK_EVENT: hookName
        },
        stdio: ["pipe", "pipe", "ignore"]
      });

      let stdout = "";

      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8");
      });

      child.on("error", () => resolve(""));
      child.on("close", () => resolve(stdout.trim()));

      if (payload === undefined) {
        child.stdin.end();
        return;
      }

      child.stdin.end(toJson(payload));
    });
  } catch {
    // CodeWiki hooks are advisory and must never block the host agent.
    return "";
  }
}

function hookContext(output: string): Record<string, string> {
  return output ? { codewikiContext: output } : {};
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
      return hookContext(await runHook(root, "pre-wiki-context.sh", { input, output }));
    },

    "file.edited": async (input: unknown, output: unknown) => {
      return hookContext(await runHook(root, "post-verify.sh", { input, output }));
    },

    // `session.idle` is treated as assistant-idle / turn-end, not teardown.
    "session.idle": async (input: unknown) => {
      return hookContext(await runHook(root, "session-end.sh", input));
    }
  };
};

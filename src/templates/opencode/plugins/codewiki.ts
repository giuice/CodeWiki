import { spawn } from "node:child_process";
import path from "node:path";

function toJson(value: unknown): string {
  try {
    return `${JSON.stringify(value ?? {}, null, 2)}\n`;
  } catch {
    return "{}\n";
  }
}

async function runHook(root: string, hookName: string, eventName: string, payload?: unknown): Promise<string> {
  const hookPath = path.join(root, ".codewiki", "hooks", hookName);

  try {
    return await new Promise<string>((resolve) => {
      const child = spawn("sh", [hookPath], {
        cwd: root,
        env: {
          ...process.env,
          CODEWIKI_HOOK_HOST: "opencode",
          CODEWIKI_HOOK_EVENT: eventName
        },
        stdio: ["pipe", "pipe", "ignore"]
      });

      let stdout = "";
      let settled = false;
      let timer: ReturnType<typeof setTimeout> | undefined;

      const finish = (value: string) => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        resolve(value);
      };

      timer = setTimeout(() => {
        child.kill();
        finish("");
      }, 5000);

      child.stdout.on("data", (chunk: Buffer) => {
        stdout += chunk.toString("utf8");
      });

      child.on("error", () => finish(""));
      child.on("close", () => finish(stdout.trim()));

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
      return hookContext(await runHook(root, "pre-wiki-context.sh", "tool.execute.before", { input, output }));
    },

    "file.edited": async (input: unknown, output: unknown) => {
      return hookContext(await runHook(root, "post-verify.sh", "file.edited", { input, output }));
    },

    // `session.idle` is treated as assistant-idle / turn-end, not teardown.
    "session.idle": async (input: unknown) => {
      return hookContext(await runHook(root, "session-end.sh", "session.idle", input));
    }
  };
};

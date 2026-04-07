import { mkdtempSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

export interface RunResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

export function tempProject(prefix = "codewiki-"): string {
  return mkdtempSync(path.join(tmpdir(), prefix));
}

export function cliPath(): string {
  return path.join(process.cwd(), "dist", "bin", "codewiki.js");
}

export function runCli(cwd: string, args: string[]): RunResult {
  const result = spawnSync(process.execPath, [cliPath(), ...args], { cwd, encoding: "utf8" });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

export function mustRun(cwd: string, args: string[]): RunResult {
  const result = runCli(cwd, args);
  if (result.status !== 0) {
    throw new Error(`CLI failed (${args.join(" ")}):\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
  }
  return result;
}

export function listRecursive(root: string, rel = "."): string[] {
  const abs = path.join(root, rel);
  const output: string[] = [];
  for (const entry of readdirSync(abs)) {
    const full = path.join(abs, entry);
    const nextRel = path.join(rel, entry);
    const stat = statSync(full);
    output.push(nextRel.split(path.sep).join("/"));
    if (stat.isDirectory()) output.push(...listRecursive(root, nextRel));
  }
  return output.sort();
}

export function read(root: string, rel: string): string {
  return readFileSync(path.join(root, rel), "utf8");
}

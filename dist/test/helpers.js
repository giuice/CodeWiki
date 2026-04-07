import { mkdtempSync, readFileSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
export function tempProject(prefix = "codewiki-") {
    return mkdtempSync(path.join(tmpdir(), prefix));
}
export function cliPath() {
    return path.join(process.cwd(), "dist", "bin", "codewiki.js");
}
export function runCli(cwd, args) {
    const result = spawnSync(process.execPath, [cliPath(), ...args], { cwd, encoding: "utf8" });
    return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}
export function mustRun(cwd, args) {
    const result = runCli(cwd, args);
    if (result.status !== 0) {
        throw new Error(`CLI failed (${args.join(" ")}):\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
    }
    return result;
}
export function listRecursive(root, rel = ".") {
    const abs = path.join(root, rel);
    const output = [];
    for (const entry of readdirSync(abs)) {
        const full = path.join(abs, entry);
        const nextRel = path.join(rel, entry);
        const stat = statSync(full);
        output.push(nextRel.split(path.sep).join("/"));
        if (stat.isDirectory())
            output.push(...listRecursive(root, nextRel));
    }
    return output.sort();
}
export function read(root, rel) {
    return readFileSync(path.join(root, rel), "utf8");
}

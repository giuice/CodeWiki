import { promises as fs } from "node:fs";
import path from "node:path";
export async function pathExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    }
    catch {
        return false;
    }
}
export function toPosixPath(value) {
    return value.split(path.sep).join("/");
}
export function ensureWithinRoot(root, candidate) {
    const resolvedRoot = path.resolve(root);
    const resolved = path.resolve(root, candidate);
    if (resolved !== resolvedRoot && !resolved.startsWith(resolvedRoot + path.sep)) {
        throw new Error(`Path escapes project root: ${candidate}`);
    }
    return resolved;
}
export function relativeToRoot(root, absolutePath) {
    return toPosixPath(path.relative(root, absolutePath));
}
export async function writeTextFileSafe(root, relPath, content, force = false) {
    const target = ensureWithinRoot(root, relPath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    if (!force && (await pathExists(target))) {
        const existing = await fs.readFile(target, "utf8");
        if (existing.length > 0 && existing !== content) {
            throw new Error(`Refusing to overwrite existing non-empty CodeWiki file without --force: ${relPath}`);
        }
    }
    await fs.writeFile(target, content, "utf8");
}
export async function ensureDir(root, relPath) {
    await fs.mkdir(ensureWithinRoot(root, relPath), { recursive: true });
}
export async function readTextIfExists(root, relPath) {
    const target = ensureWithinRoot(root, relPath);
    if (!(await pathExists(target))) {
        return undefined;
    }
    return fs.readFile(target, "utf8");
}
export async function readTextRequired(root, relPath) {
    const text = await readTextIfExists(root, relPath);
    if (text === undefined) {
        throw new Error(`Required file not found: ${relPath}`);
    }
    return text;
}
export async function listFilesRecursive(root, relDir, extension) {
    const start = ensureWithinRoot(root, relDir);
    if (!(await pathExists(start))) {
        return [];
    }
    const output = [];
    async function visit(absDir) {
        const entries = await fs.readdir(absDir, { withFileTypes: true });
        for (const entry of entries) {
            const abs = path.join(absDir, entry.name);
            if (entry.isDirectory()) {
                await visit(abs);
            }
            else if (entry.isFile() && (!extension || entry.name.toLowerCase().endsWith(extension))) {
                output.push(relativeToRoot(root, abs));
            }
        }
    }
    await visit(start);
    output.sort();
    return output;
}
export async function snapshotFiles(root, relDir) {
    const files = await listFilesRecursive(root, relDir);
    const snapshot = new Map();
    for (const file of files) {
        snapshot.set(file, await readTextRequired(root, file));
    }
    return snapshot;
}
//# sourceMappingURL=files.js.map
import { promises as fs } from "node:fs";
import path from "node:path";

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export function toPosixPath(value: string): string {
  return value.split(path.sep).join("/");
}

export function ensureWithinRoot(root: string, candidate: string): string {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(root, candidate);
  if (resolved !== resolvedRoot && !resolved.startsWith(resolvedRoot + path.sep)) {
    throw new Error(`Path escapes project root: ${candidate}`);
  }
  return resolved;
}

export function relativeToRoot(root: string, absolutePath: string): string {
  return toPosixPath(path.relative(root, absolutePath));
}

export async function writeTextFileSafe(root: string, relPath: string, content: string, force = false): Promise<void> {
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

export async function ensureDir(root: string, relPath: string): Promise<void> {
  await fs.mkdir(ensureWithinRoot(root, relPath), { recursive: true });
}

export async function readTextIfExists(root: string, relPath: string): Promise<string | undefined> {
  const target = ensureWithinRoot(root, relPath);
  if (!(await pathExists(target))) {
    return undefined;
  }
  return fs.readFile(target, "utf8");
}

export async function readTextRequired(root: string, relPath: string): Promise<string> {
  const text = await readTextIfExists(root, relPath);
  if (text === undefined) {
    throw new Error(`Required file not found: ${relPath}`);
  }
  return text;
}

export async function listFilesRecursive(root: string, relDir: string, extension?: string): Promise<string[]> {
  const start = ensureWithinRoot(root, relDir);
  if (!(await pathExists(start))) {
    return [];
  }
  const output: string[] = [];
  async function visit(absDir: string): Promise<void> {
    const entries = await fs.readdir(absDir, { withFileTypes: true });
    for (const entry of entries) {
      const abs = path.join(absDir, entry.name);
      if (entry.isDirectory()) {
        await visit(abs);
      } else if (entry.isFile() && (!extension || entry.name.toLowerCase().endsWith(extension))) {
        output.push(relativeToRoot(root, abs));
      }
    }
  }
  await visit(start);
  output.sort();
  return output;
}

export async function snapshotFiles(root: string, relDir: string): Promise<Map<string, string>> {
  const files = await listFilesRecursive(root, relDir);
  const snapshot = new Map<string, string>();
  for (const file of files) {
    snapshot.set(file, await readTextRequired(root, file));
  }
  return snapshot;
}

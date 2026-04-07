import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

export function ensureInsideRoot(root: string, candidate: string): string {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(root, candidate);
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw new Error(`Path escapes project root: ${candidate}`);
  }
  return resolved;
}

export const ensureWithinRoot = ensureInsideRoot;

export function relativePath(root: string, absolutePath: string): string {
  return path.relative(path.resolve(root), path.resolve(absolutePath)).split(path.sep).join("/");
}

export async function exists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return false;
    throw error;
  }
}

export async function readText(filePath: string): Promise<string> {
  return readFile(filePath, "utf8");
}

export async function readTextIfExists(filePath: string): Promise<string | undefined>;
export async function readTextIfExists(root: string, relativeFile: string): Promise<string | undefined>;
export async function readTextIfExists(first: string, second?: string): Promise<string | undefined> {
  const filePath = second === undefined ? first : ensureInsideRoot(first, second);
  if (!(await exists(filePath))) return undefined;
  return readText(filePath);
}

export async function writeFileSafe(root: string, relativeFile: string, content: string, force: boolean): Promise<void> {
  const target = ensureInsideRoot(root, relativeFile);
  await mkdir(path.dirname(target), { recursive: true });
  if (!force && (await exists(target))) {
    const current = await stat(target);
    if (current.size > 0) {
      throw new Error(`Refusing to overwrite existing non-empty file without --force: ${relativeFile}`);
    }
  }
  await writeFile(target, content, "utf8");
}

export async function writeTextFileSafe(root: string, relativeFile: string, content: string, force = false): Promise<void> {
  await writeFileSafe(root, relativeFile, content, force);
}

export async function ensureDir(root: string, relativeDir: string): Promise<void> {
  await mkdir(ensureInsideRoot(root, relativeDir), { recursive: true });
}

export function isMarkdownPath(filePath: string): boolean {
  const lower = filePath.toLowerCase();
  return lower.endsWith(".md") || lower.endsWith(".markdown");
}

export async function listMarkdownFiles(root: string, relativeDir: string): Promise<string[]> {
  const base = ensureInsideRoot(root, relativeDir);
  if (!(await exists(base))) return [];
  const found: string[] = [];
  async function walk(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && isMarkdownPath(entry.name)) {
        found.push(relativePath(root, full));
      }
    }
  }
  await walk(base);
  return found.sort();
}

export async function listFilesRecursive(root: string, relativeDir: string, extension?: string): Promise<string[]> {
  const base = ensureInsideRoot(root, relativeDir);
  if (!(await exists(base))) return [];
  const found: string[] = [];
  async function walk(current: string): Promise<void> {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && (!extension || entry.name.toLowerCase().endsWith(extension.toLowerCase()))) {
        found.push(relativePath(root, full));
      }
    }
  }
  await walk(base);
  return found.sort();
}

export const pathExists = exists;

export async function snapshotFiles(root: string, relativeDir: string): Promise<Map<string, string>> {
  const snapshot = new Map<string, string>();
  for (const file of await listFilesRecursive(root, relativeDir)) {
    snapshot.set(file, await readText(ensureInsideRoot(root, file)));
  }
  return snapshot;
}

export async function sha256File(filePath: string): Promise<string> {
  const data = await readFile(filePath);
  return createHash("sha256").update(data).digest("hex");
}

export function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .replace(/[`'"“”‘’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
  return slug || "untitled";
}

export function timestampForFile(date = new Date()): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

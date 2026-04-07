import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";

export async function sha256File(filePath: string): Promise<string> {
  const data = await fs.readFile(filePath);
  return createHash("sha256").update(data).digest("hex");
}

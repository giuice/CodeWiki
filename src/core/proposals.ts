export const PROPOSAL_ONLY_BOUNDARY = "PROPOSAL ONLY — no wiki files were modified without approval";

export function slugify(value: string): string {
  const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return slug || "untitled";
}

export function timestampForFile(date = new Date()): string {
  return date.toISOString().replace(/[:.]/g, "-");
}

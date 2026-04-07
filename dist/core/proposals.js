export const PROPOSAL_ONLY_BOUNDARY = "PROPOSAL ONLY — no wiki files were modified without approval";
export function slugify(value) {
    const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return slug || "untitled";
}
export function timestampForFile(date = new Date()) {
    return date.toISOString().replace(/[:.]/g, "-");
}
//# sourceMappingURL=proposals.js.map
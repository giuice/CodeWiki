export const PROPOSAL_BOUNDARY = "PROPOSAL ONLY — no wiki files were modified without approval";
export function renderProposal(result) {
    return [`# ${result.title}`, "", result.boundary, "", "## Proposed Writes", "", ...result.proposedWrites.map((write) => `- ${write.kind}: ${write.path} — ${write.description}`), "", result.body].join("\n");
}
//# sourceMappingURL=proposals.js.map
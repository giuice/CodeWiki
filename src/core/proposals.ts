export const PROPOSAL_BOUNDARY = "PROPOSAL ONLY — no wiki files were modified without approval";

export function proposalHeader(title: string): string {
  return `# ${title}\n\n${PROPOSAL_BOUNDARY}\n`;
}

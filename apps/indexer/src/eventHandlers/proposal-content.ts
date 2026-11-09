export type ProposalContent = {
  title: string;
  description: string;
  targets: string[];
  values: bigint[];
  signatures: string[];
  calldatas: string[];
};

const MAX_TITLE_LENGTH = 200;

function parseProposalTitle(description: string): string {
  const normalized = description.replace(/\\n/g, "\n");
  const lines = normalized.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^# /.test(trimmed)) {
      return trimmed.replace(/^# +/, "");
    }
    break;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || /^#{1,6}\s/.test(trimmed)) continue;
    return trimmed.length > MAX_TITLE_LENGTH
      ? trimmed.substring(0, MAX_TITLE_LENGTH) + "..."
      : trimmed;
  }

  return "";
}

/** Applies a Nouns proposal edit without touching fields the event did not carry. */
export function applyProposalContentUpdate(
  current: ProposalContent,
  patch: {
    description?: string;
    targets?: readonly string[];
    values?: readonly bigint[];
    signatures?: readonly string[];
    calldatas?: readonly string[];
  },
): ProposalContent {
  const description = patch.description ?? current.description;
  return {
    description,
    title:
      patch.description !== undefined
        ? parseProposalTitle(description)
        : current.title,
    targets: patch.targets ? [...patch.targets] : current.targets,
    values: patch.values ? [...patch.values] : current.values,
    signatures: patch.signatures ? [...patch.signatures] : current.signatures,
    calldatas: patch.calldatas ? [...patch.calldatas] : current.calldatas,
  };
}

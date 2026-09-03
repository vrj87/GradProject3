export function parseStudioPair(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 2);
}

/** Pick two same-kind saves first. They hang in the room before the coach opens. */
export function toggleCoachCompareSelection(
  id: string,
  cluster: string,
  current: string[],
  items: Array<{ id: string; cluster: string }>
): { selected: string[]; reason?: string } {
  const peers = items.filter((item) => item.cluster === cluster);
  if (peers.length < 2 && !current.includes(id)) {
    return {
      selected: current,
      reason: "Compare needs two looks of the same kind. Save another similar piece first."
    };
  }

  if (current.includes(id)) {
    return { selected: current.filter((item) => item !== id) };
  }

  if (current.length === 0) {
    return { selected: [id] };
  }

  const first = items.find((item) => item.id === current[0]);
  if (first && first.cluster !== cluster) {
    return { selected: [id] };
  }

  if (current.length >= 2) {
    return { selected: [current[0]!, id] };
  }

  return { selected: [...current, id] };
}

type PairItem = { id: string; cluster: string; gender?: string };

function sameKind(item: PairItem, cluster: string, gender?: string) {
  if (item.cluster !== cluster) return false;
  if (gender && item.gender && item.gender !== gender) return false;
  return true;
}

/** One ASK THE COACH click: this look plus another of the same kind. */
export function pairForAskCoach(
  id: string,
  cluster: string,
  current: string[],
  items: Array<PairItem>
): { selected: string[]; reason?: string } {
  const self = items.find((item) => item.id === id);
  const peers = items.filter((item) => sameKind(item, cluster, self?.gender));
  if (peers.length < 2) {
    return {
      selected: current,
      reason: "The coach needs two looks of the same kind. Save another similar piece first."
    };
  }

  const others = peers.filter((item) => item.id !== id);
  const existingOther = current.find((sid) => sid !== id && others.some((item) => item.id === sid));
  const idx = items.findIndex((item) => item.id === id);
  const later = others.find((item) => items.findIndex((row) => row.id === item.id) > idx);
  const otherId = existingOther ?? later?.id ?? others[0]?.id;
  if (!otherId) {
    return {
      selected: current,
      reason: "The coach needs two looks of the same kind. Save another similar piece first."
    };
  }

  return { selected: [id, otherId] };
}

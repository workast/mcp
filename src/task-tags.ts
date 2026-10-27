type ListedTag = { id: string };

type TagClient = {
  tags: {
    list(query: { name: string }): Promise<ListedTag[]>;
    create(body: { name: string; color: string }): Promise<ListedTag>;
  };
};

export const TAG_COLORS = [
  '#435585',
  '#DD4B4B',
  '#D62929',
  '#2BCA86',
  '#24A870',
  '#5986ff',
  '#4D74DC',
  '#f4a042',
  '#ED8A1B',
  '#FFD05C',
];

export async function findTags(workast: TagClient, names: string[] | undefined): Promise<string[]> {
  const ids: string[] = [];
  for (const name of names ?? []) {
    const [found] = await workast.tags.list({ name });
    if (found) ids.push(found.id);
  }
  return ids;
}

export async function findOrCreateTags(
  workast: TagClient,
  names: string[] | undefined,
): Promise<string[]> {
  const ids: string[] = [];
  for (const name of names ?? []) {
    const [found] = await workast.tags.list({ name });
    if (found) {
      ids.push(found.id);
      continue;
    }
    const color = TAG_COLORS[Math.floor(Math.random() * TAG_COLORS.length)];
    const created = await workast.tags.create({ name, color });
    ids.push(created.id);
  }
  return ids;
}

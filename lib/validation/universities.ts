import { universitySchema } from "@/types/domain";
export function validateUniversities(input: unknown) {
  const universities = universitySchema.array().parse(input);
  if (new Set(universities.map((u) => u.id)).size !== universities.length)
    throw new Error("Duplicate university IDs.");
  for (const u of universities) {
    const ids = new Set(u.sources.map((s) => s.id));
    if (ids.size !== u.sources.length)
      throw new Error(`Duplicate source IDs: ${u.id}`);
    for (const [field, value] of Object.entries(u)) {
      if (
        value &&
        typeof value === "object" &&
        "sourceIds" in value &&
        "value" in value
      ) {
        if (value.value !== null && value.sourceIds.length === 0)
          throw new Error(`Missing evidence: ${u.id}.${field}`);
        for (const sourceId of value.sourceIds)
          if (!ids.has(sourceId)) throw new Error(`Missing source ${sourceId}`);
        for (const sourceId of value.sourceIds)
          if (!u.sources.find((s) => s.id === sourceId)?.fields.includes(field))
            throw new Error(`Source does not support field ${u.id}.${field}`);
      }
    }
    if (
      Object.values(u.costs).some((v) => v !== null) &&
      (!u.costCycle || !u.costSourceIds.length)
    )
      throw new Error(`Costs need a cycle and evidence: ${u.id}`);
    if (u.costSourceIds.some((id) => !ids.has(id)))
      throw new Error(`Missing cost source: ${u.id}`);
  }
  return universities;
}

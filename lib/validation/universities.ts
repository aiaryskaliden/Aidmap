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
    if (
      u.annualCost.value !== null &&
      (!u.annualCost.cycle || !/20\d{2}/.test(u.annualCost.cycle))
    )
      throw new Error(`Annual cost baseline needs an academic year: ${u.id}`);
    for (const d of u.deadlines.value ?? []) {
      if (d.date && !d.cycle)
        throw new Error(`Dated deadline needs an intake: ${u.id}.${d.label}`);
      if (
        d.cycle === "Fall 2027" &&
        d.date &&
        (d.date < "2026-01-01" || d.date >= "2027-09-01")
      )
        throw new Error(
          `Deadline conflicts with Fall 2027: ${u.id}.${d.label}`,
        );
      if (d.sourceIds?.some((id) => !ids.has(id)))
        throw new Error(`Missing deadline source: ${u.id}`);
    }
    const dates = new Map<string, string>();
    for (const d of u.deadlines.value ?? [])
      if (d.date) {
        const key = `${d.label}-${d.cycle}`;
        if (dates.has(key) && dates.get(key) !== d.date)
          throw new Error(`Conflicting deadlines: ${u.id}.${key}`);
        dates.set(key, d.date);
      }
    if (
      u.satMiddle50.value &&
      u.satMiddle50.value.low > u.satMiddle50.value.high
    )
      throw new Error(`Invalid SAT range: ${u.id}`);
  }
  return universities;
}

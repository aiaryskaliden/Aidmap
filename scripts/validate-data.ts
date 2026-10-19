import { universities } from "../data/universities";
import { validateUniversities } from "../lib/validation/universities";
const checked = validateUniversities(universities);
console.log(
  `Validated ${checked.length} university records and ${checked.reduce((n, u) => n + u.sources.length, 0)} field-level evidence records.`,
);
console.log(
  "Unknown costs and admission deadlines remain null. No inferred award amounts.",
);

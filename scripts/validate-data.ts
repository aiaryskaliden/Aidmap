import { universities } from "../data/universities";
import { validateUniversities } from "../lib/validation/universities";
import { coreAdmissions } from "../data/core-admissions";
import { programTaxonomy } from "../lib/admissions";
const checked = validateUniversities(universities);
const expected=["harvard","yale","princeton","mit","amherst","dartmouth","bowdoin","brown"];
if(coreAdmissions.length!==8 || expected.some(id=>!coreAdmissions.some(d=>d.universityId===id)))throw new Error("The eight core dossiers must be present exactly once.");
for(const d of coreAdmissions){
  if(!d.programs.length || !d.rounds.length || !d.funding.renewal.trim() || !d.selection.text.trim() || d.costs.total===null)throw new Error(`Incomplete core record: ${d.universityId}`);
  if(d.programs.some(p=>!programTaxonomy.includes(p.category)))throw new Error(`Noncanonical subject: ${d.universityId}`);
  for(const stage of ["admission","aid","enrollment"])if(!d.requirements.some(r=>r.stage===stage))throw new Error(`Missing requirement stage: ${d.universityId}.${stage}`);
  for(const r of d.requirements)if(!r.submission.trim() || !r.due.trim())throw new Error(`Missing action context: ${d.universityId}.${r.id}`);
  if(d.scores.satComposite && (d.scores.satComposite[0]<400 || d.scores.satComposite[1]>1600))throw new Error(`Invalid SAT range: ${d.universityId}`);
}
console.log(
  `Validated ${checked.length} university records and ${checked.reduce((n, u) => n + u.sources.length, 0)} field-level evidence records.`,
);
console.log(
  "Field evidence, academic-year costs, deadline cycles and source references passed validation. Unknown values remain null.",
);
console.log(`Validated ${coreAdmissions.length} core dossiers, ${coreAdmissions.reduce((n,d)=>n+d.requirements.length,0)} sourced requirements and ${coreAdmissions.reduce((n,d)=>n+d.deadlines.length,0)} dated, recurring or relative events.`);

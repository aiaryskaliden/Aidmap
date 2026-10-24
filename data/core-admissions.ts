import { dossierSchema, type AdmissionsDossier } from "@/types/admissions";
import hyp from "./core-research-hyp.json";
import ma from "./core-research-ma.json";
import dbb from "./core-research-dbb.json";

// Research modules are added here after their source references pass validation.
const records: unknown[] = [...hyp, ...ma, ...dbb];
export const coreAdmissions: AdmissionsDossier[] = records.map((record) =>
  dossierSchema.parse(record),
);
export const findDossier = (id: string) =>
  coreAdmissions.find((d) => d.universityId === id);

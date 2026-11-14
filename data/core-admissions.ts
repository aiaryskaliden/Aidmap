import { dossierSchema, type AdmissionsDossier } from "@/types/admissions";
import hyp from "./core-research-hyp.json";
import ma from "./core-research-ma.json";
import dbb from "./core-research-dbb.json";

// Research modules are added here after their source references pass validation.
const records = [...hyp, ...ma, ...dbb];
export const coreAdmissions: AdmissionsDossier[] = typeof window === "undefined"
  ? records.map((record) => dossierSchema.parse(record))
  : records as AdmissionsDossier[];
export const findDossier = (id: string) =>
  coreAdmissions.find((d) => d.universityId === id);

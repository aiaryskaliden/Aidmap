import { z } from "zod";

export const maxDrafts = 12;
export const maxActivities = 12;
export const maxRecognitions = 12;
export const maxDocumentText = 30_000;
export const maxWordLimit = 5000;
export const activityCategories = [
  "club",
  "project",
  "research",
  "competition",
  "service",
  "sport",
  "art",
  "work",
] as const;
export const activityReach = [
  "school",
  "community",
  "regional",
  "national",
  "international",
] as const;

const documentSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  text: z.string().max(maxDocumentText),
});

export const essaySchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().trim().min(1).max(120),
  schoolId: z.string().max(90),
  prompt: z.string().max(2000),
  wordLimit: z.number().int().min(20).max(maxWordLimit),
  text: z.string().max(maxDocumentText),
  fileName: z.string().max(180).optional(),
  reviewedAt: z.iso.datetime().optional(),
});
export type EssayDraft = z.infer<typeof essaySchema>;

export const activitySchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().trim().min(1).max(120),
  category: z.enum(activityCategories),
  reach: z.enum(activityReach).optional(),
  role: z.string().trim().max(120),
  months: z.number().int().min(0).max(120),
  hours: z.number().min(0).max(112),
  action: z.string().trim().max(1000),
  impact: z.string().trim().max(1000),
  evidence: z.string().trim().max(400),
});
export type Activity = z.infer<typeof activitySchema>;

export const recognitionLevels = [
  "school",
  "city",
  "regional",
  "national",
  "international",
] as const;
export const recognitionGrades = [
  "9",
  "10",
  "11",
  "12",
  "postgraduate",
] as const;

export const recognitionSchema = z.object({
  id: z.string().min(1).max(64),
  title: z.string().trim().min(1).max(120),
  context: z.string().trim().max(140),
  date: z.union([
    z.literal(""),
    z.string().regex(/^(?:19[9]\d|20\d{2}|2100)-(?:0[1-9]|1[0-2])$/),
  ]),
  description: z.string().trim().max(1000),
  levels: z
    .array(z.enum(recognitionLevels))
    .max(recognitionLevels.length)
    .optional(),
  grades: z
    .array(z.enum(recognitionGrades))
    .max(recognitionGrades.length)
    .optional(),
});
export type Recognition = z.infer<typeof recognitionSchema>;

export const applicantStudioSchema = z.object({
  language: z.enum(["en", "ru", "kk"]).optional(),
  name: z.string().max(70),
  school: z.string().max(120),
  qualification: z.string().max(120),
  graduationYear: z.number().int().min(1950).max(2100).optional(),
  cv: documentSchema.nullable(),
  essays: z.array(essaySchema).max(maxDrafts),
  activities: z.array(activitySchema).max(maxActivities),
  honors: z.array(recognitionSchema).max(maxRecognitions).optional(),
  achievements: z.array(recognitionSchema).max(maxRecognitions).optional(),
  recentSchools: z
    .array(z.object({ id: z.string().max(90), checkedAt: z.iso.datetime() }))
    .max(8)
    .optional(),
});
export type ApplicantStudio = z.infer<typeof applicantStudioSchema>;

export const emptyStudio: ApplicantStudio = {
  name: "",
  school: "",
  qualification: "",
  cv: null,
  essays: [],
  activities: [],
};

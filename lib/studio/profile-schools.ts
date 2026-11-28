import { universities } from "@/data/universities";
import { shortlistFitSchool } from "@/lib/studio/shortlist-fit";

export const profileSchools = universities
  .map((school) => ({
    id: school.id,
    name: school.name,
    city: school.city,
    country: school.country,
    initials: school.initials,
    color: school.color,
    fit: shortlistFitSchool(school),
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export type ProfileSchool = (typeof profileSchools)[number];

import { universities } from "@/data/universities";
import { fieldStatus } from "@/lib/admissions";
import type { University } from "@/types/domain";

export const studioOptions = {
  schools: universities
    .map(({ id, name, country }) => ({ id, name, country }))
    .sort((a, b) => a.name.localeCompare(b.name)),
  countries: [
    ...new Set(universities.map((university) => university.country)),
  ].sort(),
};

export type StudioHomeSchoolInfo = Record<
  string,
  Pick<University, "initials" | "color"> & {
    platform?: { label: string; url: string; cycle: string | null };
  }
>;

export const studioHomeSchoolInfo: StudioHomeSchoolInfo = Object.fromEntries(
  universities.map((school) => {
    const { id, initials, color, applicationPlatform: field } = school;
    const source = school.sources.find(({ id }) =>
      field.sourceIds.includes(id),
    );
    if (
      !field.value ||
      !source ||
      fieldStatus(field, school) === "unverified" ||
      (field.scope && field.scope.purpose !== "admission")
    ) {
      return [id, { initials, color }];
    }

    const label = field.value
      .split(/[.;](?:\s|$)/, 1)[0]
      .replace(/^(?:Apply through|Submit one|Use|Choose one:)\s+/i, "")
      .replace(/\bCommon Application\b/i, "Common App");
    return [
      id,
      {
        initials,
        color,
        platform: { label, url: source.url, cycle: field.cycle },
      },
    ];
  }),
);

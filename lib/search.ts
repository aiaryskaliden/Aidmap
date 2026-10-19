import type { University } from "@/types/domain";
export type Filters = Record<string, string>;
export function searchUniversities(universities: University[], f: Filters) {
  return universities
    .filter((u) => {
      const q = (f.q || "").toLowerCase().trim();
      if (
        q &&
        ![
          u.name,
          u.shortName,
          u.country,
          u.city,
          u.state,
          ...(u.programs.value ?? []),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      )
        return false;
      if (f.region && u.region !== f.region) return false;
      if (f.country && u.country !== f.country) return false;
      if (f.city && u.city !== f.city) return false;
      if (f.major && !u.programs.value?.includes(f.major)) return false;
      if (f.aid === "international" && u.internationalAid.value !== true)
        return false;
      if (
        f.aid === "need" &&
        !(u.internationalAid.value && u.meetsFullNeed.value)
      )
        return false;
      if (f.aid === "merit" && u.meritAid.value !== true) return false;
      if (f.aid === "tuition" && u.fullTuition.value !== true) return false;
      if (f.aid === "full-cost" && u.fullCost.value !== true) return false;
      if (f.aid === "unknown" && u.internationalAid.value !== null)
        return false;
      if (
        f.test === "optional" &&
        !u.testPolicy.value?.toLowerCase().includes("optional")
      )
        return false;
      if (
        f.test === "required" &&
        !u.testPolicy.value?.toLowerCase().includes("required")
      )
        return false;
      if (f.test === "unknown" && u.testPolicy.value !== null) return false;
      if (f.english === "verified" && u.englishPolicy.value === null)
        return false;
      if (f.english === "unknown" && u.englishPolicy.value !== null)
        return false;
      if (f.waiver === "yes" && u.feeWaiver.value !== true) return false;
      if (
        f.platform &&
        !u.applicationPlatform.value
          ?.toLowerCase()
          .includes(f.platform.toLowerCase())
      )
        return false;
      if (f.plan && !u.applicationPlans.value?.includes(f.plan)) return false;
      if (
        f.deadline &&
        (!u.admissionDeadline.value || u.admissionDeadline.value > f.deadline)
      )
        return false;
      if (
        f.cost &&
        (Object.values(u.costs).some((v) => v === null) ||
          Object.values(u.costs).reduce<number>((s, n) => s + (n ?? 0), 0) >
            Number(f.cost))
      )
        return false;
      if (
        f.quality === "verified" &&
        !u.sources.some((s) => s.status === "verified")
      )
        return false;
      if (
        f.quality === "recheck" &&
        !u.sources.some(
          (s) => s.status === "needs-rechecking" || s.cycle !== "Fall 2027",
        )
      )
        return false;
      if (f.quality === "unknown" && u.internationalAid.value !== null)
        return false;
      return true;
    })
    .sort((a, b) =>
      f.sort === "name-desc"
        ? b.name.localeCompare(a.name)
        : f.sort === "deadline"
          ? (a.admissionDeadline.value ?? "9999").localeCompare(
              b.admissionDeadline.value ?? "9999",
            )
          : a.name.localeCompare(b.name),
    );
}

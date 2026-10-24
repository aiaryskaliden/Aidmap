import type { AdmissionsDossier } from "@/types/admissions";
import type { SavedUniversity } from "@/types/domain";
export type CalendarEvent = {
  id: string;
  universityId: string;
  label: string;
  category: string;
  date: string | null;
  time: string | null;
  timezone: string | null;
  source: string | null;
  note: string;
  relative?: string;
};
export function addDays(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}
export function timelineEvents(
  saved: SavedUniversity,
  dossier?: AdmissionsDossier,
): CalendarEvent[] {
  const events: CalendarEvent[] = (dossier?.deadlines ?? [])
    .filter(
      (d) =>
        !saved.applicationType ||
        !d.rounds.length ||
        d.rounds.includes(saved.applicationType),
    )
    .map((d) => {
      const trigger = saved.triggerDates?.[d.id];
      const relativeDate =
        d.relative && trigger ? addDays(trigger, d.relative.days) : null;
      return {
        id: `${saved.universityId}-${d.id}`,
        universityId: saved.universityId,
        label: d.label,
        category: d.category,
        date: d.date ?? relativeDate,
        time: d.time,
        timezone: d.timezone,
        source:
          dossier?.sources.find((s) => d.sourceIds.includes(s.id))?.url ?? null,
        relative: d.relative
          ? `${d.relative.days} days after ${d.relative.event}`
          : undefined,
        note: [
          d.cycle ?? "Cycle not specified",
          d.note,
          d.monthDay && !d.date
            ? `Recurring guidance: ${d.monthDay}. Target year is not confirmed.`
            : "",
          relativeDate
            ? `Calculated from your self-reported event date ${trigger}. Confirm the portal deadline.`
            : "",
        ]
          .filter(Boolean)
          .join(" "),
      };
    });
  if (saved.deadline)
    events.push({
      id: `${saved.universityId}-personal-target`,
      universityId: saved.universityId,
      label: "Your target date",
      category: "personal",
      date: saved.deadline,
      time: null,
      timezone: null,
      source: saved.deadlineSource?.url ?? null,
      note: saved.deadlineSource
        ? `Previously copied source date: ${saved.deadlineSource.label}. Your saved date is preserved.`
        : "User-defined planning date; not an official deadline.",
    });
  return events;
}
const escapeICS = (text: string) =>
  text
    .replaceAll("\\", "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,");
function foldLine(line: string) {
  let out = "",
    current = "",
    length = 0;
  for (const char of line) {
    const bytes = new TextEncoder().encode(char).length;
    if (length + bytes > 73) {
      out += current + "\r\n ";
      current = "";
      length = 1;
    }
    current += char;
    length += bytes;
  }
  return out + current;
}
// Exact cutoff times are exported only when the source gives an IANA timezone.
// Otherwise export a date-only event and retain the source's cutoff wording.
function utcTime(
  date: string,
  time: string | null,
  timezone: string | null,
): string | null {
  if (
    !time ||
    !/^\d{2}:\d{2}$/.test(time) ||
    !timezone ||
    !/^(America|Europe|Asia|Pacific|Etc)\//.test(timezone)
  )
    return null;
  try {
    const target = Date.parse(`${date}T${time}:00Z`);
    let instant = target;
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    for (let i = 0; i < 3; i++) {
      const p = Object.fromEntries(
        formatter.formatToParts(instant).map((x) => [x.type, x.value]),
      );
      const displayed = Date.parse(
        `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`,
      );
      instant += target - displayed;
    }
    return new Date(instant)
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(".000", "");
  } catch {
    return null;
  }
}
export function calendarICS(
  events: CalendarEvent[],
  stamp = new Date().toISOString(),
) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AidMap//Local application planning//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];
  for (const event of events) {
    if (!event.date) continue;
    const exact = utcTime(event.date, event.time, event.timezone);
    const description = [
      event.note,
      event.time
        ? `Official cutoff: ${event.time} ${event.timezone ?? "(confirm timezone)"}.`
        : "",
      exact
        ? "Exact source timezone converted to UTC."
        : "Date-only calendar entry. Check the source for the exact cutoff time.",
      event.source ? `Source: ${event.source}` : "",
      "AidMap does not provide live calendar synchronization or reminders.",
    ]
      .filter(Boolean)
      .join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${event.id.replace(/[^a-zA-Z0-9-]/g, "-")}@aidmap.local`,
      `DTSTAMP:${stamp.replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
      exact
        ? `DTSTART:${exact}`
        : `DTSTART;VALUE=DATE:${event.date.replaceAll("-", "")}`,
      ...(exact
        ? []
        : [`DTEND;VALUE=DATE:${addDays(event.date, 1).replaceAll("-", "")}`]),
      `SUMMARY:${escapeICS(`${event.universityId}: ${event.label}`)}`,
      `CATEGORIES:${escapeICS(event.category)}`,
      `DESCRIPTION:${escapeICS(description)}`,
      ...(event.source ? [`URL:${event.source}`] : []),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

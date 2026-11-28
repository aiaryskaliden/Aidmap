"use client";

import { useState } from "react";
import { dateLabel } from "@/lib/utils";
import { ExternalLink } from "@/components/ui/shared";

type SourceEntry = {
  id: string;
  url: string;
  title: string;
  checkedAt: string;
  details: string[];
};

export function SourceDetails({
  entries,
  summary = "Sources and verification",
}: {
  entries: SourceEntry[];
  summary?: string;
}) {
  const groups = [
    ...Map.groupBy(entries, ({ url }) => {
      const location = new URL(url);
      location.hash = "";
      return location.href.replace(/\/$/, "");
    }).values(),
  ];
  const [selected, setSelected] = useState(0);
  const group = groups[selected] ?? groups[0];
  if (!group) return null;
  const source = group[0];
  const checkedAt =
    group
      .map((entry) => entry.checkedAt)
      .sort()
      .at(-1) ?? source.checkedAt;
  const details = [
    ...new Set(group.flatMap((item) => item.details).filter(Boolean)),
  ];

  return (
    <details className="source-directory">
      <summary>{summary}</summary>
      {groups.length > 1 && (
        <label>
          <span className="sr-only">Choose an official source</span>
          <select
            value={selected}
            onChange={(event) => setSelected(Number(event.target.value))}
          >
            {groups.map(([entry], index) => (
              <option key={entry.id} value={index}>
                {entry.title}
              </option>
            ))}
          </select>
        </label>
      )}
      <div className="source-directory-entry">
        <ExternalLink href={source.url}>{source.title}</ExternalLink>
        <small>Last checked {dateLabel(checkedAt)}</small>
        {details.map((item) => (
          <p key={item}>{item}</p>
        ))}
      </div>
    </details>
  );
}

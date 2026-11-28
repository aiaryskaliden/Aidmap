"use client";

import { ClipboardList } from "lucide-react";
import Link from "next/link";
import { useApp } from "@/components/providers";
import { tr } from "@/lib/studio/reviews";

export function ApplicationWorkspaceLink({
  id,
  compact = false,
}: {
  id: string;
  compact?: boolean;
}) {
  const { state } = useApp();
  const language = state.studio?.language ?? "en";
  const title = tr(language, [
    "Application workspace",
    "План поступления",
    "Өтінім жоспары",
  ]);

  return (
    <Link
      className="application-workspace-link"
      data-compact={compact || undefined}
      href={`/universities/${id}/apply`}
      prefetch={false}
      aria-label={
        compact
          ? tr(language, ["Plan application", "План поступления", "Жоспар ашу"])
          : title
      }
    >
      <ClipboardList size={compact ? 15 : 17} aria-hidden />
      <span>{compact ? tr(language, ["Plan", "План", "Жоспар"]) : title}</span>
    </Link>
  );
}

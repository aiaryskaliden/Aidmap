import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  CheckCheck,
  CircleHelp,
  ShieldCheck,
} from "lucide-react";
import { Button } from "./button";
import type { Fact, University } from "@/types/domain";
export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {children}
    </div>
  );
}
export function EmptyState({
  title,
  text,
  href = "/explore",
  action = "Explore universities",
}: {
  title: string;
  text: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <CompassIcon />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      <Button asChild>
        <Link href={href}>
          {action}
          <ArrowRight size={16} />
        </Link>
      </Button>
    </div>
  );
}
function CompassIcon() {
  return <CircleHelp size={27} />;
}
export function ExternalLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <a
      className={`external-link ${className}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
      <ArrowUpRight size={14} />
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}
export function Evidence({
  university,
  field,
  label,
}: {
  university: University;
  field: Fact<unknown>;
  label?: string;
}) {
  const source = university.sources.find((s) => field.sourceIds.includes(s.id));
  if (field.value === null || !source)
    return (
      <span className="evidence unknown">
        <CircleHelp size={13} />
        {label || "Not yet verified"}
      </span>
    );
  return (
    <a
      className={`evidence ${source.status === "verified" ? "verified" : "pending"}`}
      href={`#source-${source.id}`}
      title={`${source.title}; checked ${source.checkedAt}. ${field.cycle || "General policy; recheck for Fall 2027."}`}
    >
      <ShieldCheck size={13} />
      {label ||
        (source.status === "verified"
          ? "Verified from official source"
          : "Needs rechecking")}
    </a>
  );
}
export function PolicyNote() {
  return (
    <div className="notice">
      <ShieldCheck size={18} />
      <p>
        <strong>Policies are a starting point, not a funding promise.</strong>{" "}
        An aid policy does not establish your award. Fall 2027 deadlines and
        costs are shown only when that cycle is verified.
      </p>
    </div>
  );
}
export function LocalNote() {
  return (
    <span className="local-note">
      <CheckCheck size={15} /> Private to this browser · No account needed
    </span>
  );
}

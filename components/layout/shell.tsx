"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowUpRight,
  Compass,
  Menu,
  Moon,
  Sun,
  X,
  ArrowRight,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "@/components/providers";
import { Button } from "@/components/ui/button";
export function Logo() {
  return (
    <Link className="logo" href="/" aria-label="AidMap home">
      <span className="logo-mark">
        <Compass size={25} strokeWidth={1.7} />
      </span>
      AidMap<span className="logo-dot">.</span>
    </Link>
  );
}
export function Header() {
  const pathname = usePathname();
  const { state, update, ready, blocked } = useApp();
  const [open, setOpen] = useState(false);
  const links = [
    ["/explore", "Explore"],
    ["/funding", "Funding"],
    ["/compare", "Compare"],
    ["/calculator", "Gap calculator"],
  ];
  return (
    <header className="site-header">
      <div className="header-inner">
        <Logo />
        <nav className="desktop-nav" aria-label="Main navigation">
          {links.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              aria-current={pathname === href ? "page" : undefined}
            >
              {label}
              {href === "/compare" && state.compare.length > 0 && (
                <span className="nav-count">{state.compare.length}</span>
              )}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <button
            className="theme-toggle"
            disabled={!ready || blocked}
            aria-label={`Switch to ${state.theme === "light" ? "dark" : "light"} theme`}
            onClick={() =>
              update((s) => ({
                ...s,
                theme: s.theme === "light" ? "dark" : "light",
              }))
            }
          >
            {state.theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <Button asChild size="sm" className="dashboard-link">
            <Link href="/dashboard">
              <LayoutDashboard size={15} /> My dashboard{" "}
              <ArrowUpRight size={15} />
            </Link>
          </Button>
          <button
            className="mobile-menu"
            disabled={!ready}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen(!open)}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          {[
            ...links,
            ["/dashboard", "My dashboard"],
            ["/planner", "Application planner"],
            ["/profile", "Preferences"],
          ].map(([href, label]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              {label}
              <ArrowRight size={16} />
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div>
          <Logo />
          <p>
            Find universities. Understand funding.
            <br />
            Plan your future.
          </p>
        </div>
        <div className="footer-links">
          <Link href="/explore">Explore universities</Link>
          <Link href="/calculator">Funding calculator</Link>
          <Link href="/about">Our methodology</Link>
          <Link href="/profile#data">Privacy & your data</Link>
        </div>
        <span className="footer-note">
          <ShieldCheck size={18} /> Independent. Source-backed. Student-first.
        </span>
      </div>
      <div className="footer-bottom">
        <p>
          AidMap is an independent university research and planning tool.
          Admissions and financial aid decisions are made by the institutions.
          Always verify requirements with official sources.
        </p>
        <span>Built for your next chapter.</span>
      </div>
    </footer>
  );
}
export function WorkspaceNav() {
  const pathname = usePathname();
  return (
    <nav className="workspace-nav" aria-label="Workspace">
      {[
        ["/dashboard", "Overview"],
        ["/planner", "Application planner"],
        ["/profile", "Preferences & data"],
      ].map(([href, label]) => (
        <Link
          key={href}
          href={href}
          aria-current={pathname === href ? "page" : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

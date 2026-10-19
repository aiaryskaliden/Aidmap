import Link from "next/link";
export default function NotFound() {
  return (
    <div className="page-container empty-state">
      <span className="eyebrow">404 / A NEW DIRECTION</span>
      <h1>This page is off the map.</h1>
      <p>The university or page you requested could not be found.</p>
      <Link className="button button-primary" href="/explore">
        Explore universities
      </Link>
    </div>
  );
}

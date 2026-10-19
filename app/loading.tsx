export default function Loading() {
  return (
    <div className="page-container" aria-label="Loading page" role="status">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-line" />
      <div className="university-grid">
        {[1, 2, 3].map((n) => (
          <div key={n} className="skeleton skeleton-card" />
        ))}
      </div>
      <span className="sr-only">Loading AidMap…</span>
    </div>
  );
}

"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="page-container empty-state">
      <h1>Something didn’t load.</h1>
      <p>
        Your local application data has not been removed. Try loading this page
        again.
      </p>
      <button className="button button-primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}

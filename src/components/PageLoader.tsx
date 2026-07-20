export default function PageLoader() {
  return (
    <div className="page-loader">
      <div className="page-loader-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
        <div className="spinner-ring"></div>
      </div>
      <p className="page-loader-text">Loading…</p>
    </div>
  );
}

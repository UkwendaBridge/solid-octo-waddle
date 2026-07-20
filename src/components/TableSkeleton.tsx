interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

// Deterministic width sequence — avoids Math.random() in render (impure)
const HEADER_WIDTHS = [72, 88, 65, 91, 78, 84, 69, 95, 73, 80];
const CELL_WIDTHS  = [55, 82, 68, 91, 60, 75, 88, 50, 70, 85];

export default function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <div className="skeleton-table" role="status" aria-label="Loading data">
      {/* Header row */}
      <div className="skeleton-row skeleton-header">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="skeleton-cell skeleton-pulse" style={{ width: `${HEADER_WIDTHS[i % HEADER_WIDTHS.length]}%` }} />
        ))}
      </div>
      {/* Data rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="skeleton-row">
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="skeleton-cell skeleton-pulse"
              style={{
                width: `${CELL_WIDTHS[(rowIdx * columns + colIdx) % CELL_WIDTHS.length]}%`,
                animationDelay: `${(rowIdx * columns + colIdx) * 0.05}s`,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

import './skeleton.css';

export function SkeletonLine({ width = '100%' }: { width?: string | number }) {
  return <div className="sk-line" style={{ width }} />;
}

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`sk-block ${className}`.trim()} />;
}

export function DashboardSkeleton() {
  return (
    <div className="sk-page" aria-busy aria-label="Chargement">
      <SkeletonLine width="40%" />
      <SkeletonLine width="70%" />
      <div className="sk-grid">
        <SkeletonBlock />
        <SkeletonBlock />
        <SkeletonBlock />
        <SkeletonBlock />
      </div>
    </div>
  );
}

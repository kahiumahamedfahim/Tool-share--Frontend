interface LoadingProps {
  show: boolean;
}

export default function Loading({
  show,
}: LoadingProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/15 backdrop-blur-[2px]" role="status" aria-label="Loading">
      <span className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-blue-700 shadow-sm" />
    </div>
  );
}

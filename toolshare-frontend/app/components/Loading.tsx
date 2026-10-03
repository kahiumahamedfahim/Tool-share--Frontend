interface LoadingProps {
  show: boolean;
}

export default function Loading({
  show,
}: LoadingProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/60 backdrop-blur-sm">
      <span className="loading loading-dots loading-lg"></span>
    </div>
  );
}
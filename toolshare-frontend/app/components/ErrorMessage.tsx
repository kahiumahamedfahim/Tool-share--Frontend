interface ErrorMessageProps {
  message: string;
  show: boolean;
  onClose: () => void;
}

export default function ErrorMessage({
  message,
  show,
  onClose,
}: ErrorMessageProps) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="w-full max-w-sm rounded-xl border border-red-200 bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-red-600">
          Error Messages 
        </h2>

        <p className="mt-2 text-sm text-zinc-600">
          {message}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-red-600 py-2.5 text-sm font-medium text-white transition hover:bg-red-700"
        >
          Close
        </button>
      </div>
    </div>
  );
}
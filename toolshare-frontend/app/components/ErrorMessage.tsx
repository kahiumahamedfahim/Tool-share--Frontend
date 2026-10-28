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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 px-4 backdrop-blur-[2px]" role="presentation">
      <div role="alertdialog" aria-modal="true" className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-700" aria-hidden="true">
          <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5"><path d="M10 6.5v4m0 3h.01M8.3 3.8 2.7 14a1.5 1.5 0 0 0 1.3 2.2h12a1.5 1.5 0 0 0 1.3-2.2L11.7 3.8a2 2 0 0 0-3.4 0Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold tracking-tight text-slate-950">
          We couldn’t complete that
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          {message}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline-blue-600"
        >
          Close
        </button>
      </div>
    </div>
  );
}

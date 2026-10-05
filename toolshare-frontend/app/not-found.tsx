export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <div className="text-center">
        <p className="text-7xl font-bold text-zinc-900">
          404
        </p>

        <h1 className="mt-4 text-2xl font-bold text-zinc-900">
          Page Not Found
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          The page you are looking for does not exist.
        </p>
      </div>
    </main>
  );
}
export default function Home() {
  return (
    <main className="min-h-screen bg-white text-zinc-900">
      {/* Navbar */}
      <nav className="border-b border-zinc-200">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <h1 className="text-2xl font-bold tracking-tight">
            Tool<span className="text-blue-600">Share</span>
          </h1>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#home" className="text-sm font-medium hover:text-blue-600">
              Home
            </a>

            <a
              href="#how-it-works"
              className="text-sm font-medium hover:text-blue-600"
            >
              How It Works
            </a>

            <a
              href="#features"
              className="text-sm font-medium hover:text-blue-600"
            >
              Features
            </a>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium hover:bg-zinc-100"
            >
              Login
            </a>

            <a
              href="/register/admin"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section id="home">
        <div className="mx-auto flex min-h-[600px] max-w-7xl flex-col items-center justify-center px-6 py-20 text-center">
          <div className="mb-6 rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-600">
            Smart & Secure Tool Sharing Platform
          </div>

          <h2 className="max-w-4xl text-5xl font-bold leading-tight tracking-tight md:text-6xl">
            Share Tools.
            <br />
            <span className="text-blue-600">Build Together.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600">
            ToolShare connects people who need tools with people who have them.
            Rent, share, and manage tools through a secure and reliable
            platform.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <a
              href="/login"
              className="rounded-lg bg-blue-600 px-7 py-3 font-medium text-white transition hover:bg-blue-700"
            >
              Get Started
            </a>

            <a
              href="#how-it-works"
              className="rounded-lg border border-zinc-300 px-7 py-3 font-medium transition hover:bg-zinc-100"
            >
              Learn More
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-zinc-50 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-medium text-blue-600">Features</p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Everything you need to share tools
            </h2>

            <p className="mt-4 text-zinc-600">
              A platform designed to make tool sharing simple, secure, and
              convenient.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <FeatureCard
              title="Easy Tool Sharing"
              description="List your tools and make them available to people who need them."
            />

            <FeatureCard
              title="Secure Verification"
              description="User identity and documents can be verified before participating."
            />

            <FeatureCard
              title="Reliable Management"
              description="Manage rentals, users, documents, and transactions from one platform."
            />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-medium text-blue-600">How It Works</p>

            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              Simple process, secure experience
            </h2>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <Step
              number="01"
              title="Create an Account"
              description="Register your account and complete the required verification."
            />

            <Step
              number="02"
              title="Find or Share Tools"
              description="Browse available tools or list your own tools for others."
            />

            <Step
              number="03"
              title="Rent & Share"
              description="Complete the rental process and safely exchange the tool."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-blue-600 py-20 text-white">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Ready to get started?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-blue-100">
            Join ToolShare and become part of a smarter tool-sharing
            community.
          </p>

          <a
            href="/login"
            className="mt-8 inline-block rounded-lg bg-white px-7 py-3 font-medium text-blue-600 transition hover:bg-zinc-100"
          >
            Get Started
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 md:flex-row">
          <h3 className="font-bold">
            Tool<span className="text-blue-600">Share</span>
          </h3>

          <p className="text-sm text-zinc-500">
            © 2026 ToolShare. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 font-bold text-blue-600">
        TS
      </div>

      <h3 className="mt-6 text-xl font-semibold">{title}</h3>

      <p className="mt-3 leading-7 text-zinc-600">{description}</p>
    </div>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
        {number}
      </div>

      <h3 className="mt-5 text-xl font-semibold">{title}</h3>

      <p className="mt-3 leading-7 text-zinc-600">{description}</p>
    </div>
  );
}
import Link from "next/link";
import type { ReactNode } from "react";

const benefits = [
  {
    number: "01",
    title: "Find what you need",
    description: "Browse equipment shared by people nearby and choose the right fit for the job.",
  },
  {
    number: "02",
    title: "Agree on the details",
    description: "Review availability, rental terms and delivery arrangements before a request is confirmed.",
  },
  {
    number: "03",
    title: "Use it with confidence",
    description: "Verified accounts and guided handover steps help keep every rental clear and accountable.",
  },
];

export default function Home() {
  return (
    <main className="overflow-hidden bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-white/90 backdrop-blur-xl">
        <nav aria-label="Main navigation" className="ts-container flex h-[72px] items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight text-slate-950">
            Tool<span className="text-primary">Share</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <Link href="/products" className="text-sm font-medium text-slate-600 transition hover:text-primary">Browse tools</Link>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 transition hover:text-primary">How it works</a>
            <a href="#community" className="text-sm font-medium text-slate-600 transition hover:text-primary">Why ToolShare</a>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/login" className="rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:px-4">Log in</Link>
            <Link href="/register" className="ts-button-primary min-h-10 px-4 sm:px-5">Create account</Link>
          </div>
        </nav>
      </header>

      <section className="relative isolate border-b border-slate-200 bg-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_76%_42%,oklch(0.94_0.045_250),transparent_38%),linear-gradient(to_bottom,white,oklch(0.985_0.006_250))]" />
        <div className="ts-container grid min-h-[600px] items-center gap-14 py-16 md:grid-cols-[1.05fr_0.95fr] md:py-20 lg:gap-20 lg:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/80 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-blue-800">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              A better way to get things done
            </div>
            <h1 className="mt-7 text-4xl font-semibold leading-[1.08] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-[3.75rem]">
              The right tool can <span className="text-primary">move any project forward.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
              Find useful tools from people in your community. Rent what you need for the job, then pass it on when you’re done.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/products" className="ts-button-primary px-6">Explore available tools <span aria-hidden="true" className="ml-2">→</span></Link>
              <Link href="/register" className="ts-button-secondary px-6">Share a tool</Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-200 pt-6 text-sm text-slate-600">
              <span className="inline-flex items-center gap-2"><CheckMark /> Verified community</span>
              <span className="inline-flex items-center gap-2"><CheckMark /> Clear rental steps</span>
              <span className="inline-flex items-center gap-2"><CheckMark /> Local sharing</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute -inset-5 rounded-[2rem] bg-blue-100/50 blur-2xl" aria-hidden="true" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_-38px_rgba(15,45,85,0.32)] sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">Built for sharing</p>
                  <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-950">More making. Less storing.</h2>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700"><ToolMark /></div>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
                <IllustrationTile tone="blue" title="Build" subtitle="Tools for the big jobs"><HammerMark /></IllustrationTile>
                <IllustrationTile tone="sand" title="Repair" subtitle="The right tool, right now"><WrenchMark /></IllustrationTile>
                <IllustrationTile tone="slate" title="Create" subtitle="Room to try something new"><RulerMark /></IllustrationTile>
                <div className="flex min-h-36 flex-col justify-between rounded-2xl bg-slate-950 p-4 text-white sm:min-h-40 sm:p-5">
                  <span className="text-xs font-semibold uppercase tracking-[0.14em] text-blue-200">One community</span>
                  <p className="max-w-[10rem] text-lg font-medium leading-6 tracking-tight">Useful things, shared well.</p>
                  <Link href="/products" className="text-sm font-semibold text-white underline decoration-blue-400 underline-offset-4 hover:text-blue-100">See what’s nearby</Link>
                </div>
              </div>
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-800"><CheckMark /></div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">A more thoughtful way to rent</p>
                  <p className="mt-0.5 text-xs text-slate-600">Discover, arrange and hand over with confidence.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="py-20 sm:py-24">
        <div className="ts-container">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary">Simple from start to finish</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">A clear path from search to handover.</h2>
            <p className="mt-4 text-base leading-7 text-slate-600">Every step is designed to keep renters and owners informed about what happens next.</p>
          </div>
          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {benefits.map((step) => (
              <li key={step.number} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-7">
                <span className="text-xs font-bold tracking-[0.14em] text-blue-700">{step.number}</span>
                <h3 className="mt-8 text-lg font-semibold tracking-tight text-slate-950">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="community" className="border-y border-slate-200 bg-white py-16 sm:py-20">
        <div className="ts-container grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:items-center">
          <div>
            <p className="text-sm font-semibold text-primary">Why ToolShare</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Good tools deserve to be used.</h2>
          </div>
          <div className="flex flex-col gap-5 border-l-2 border-blue-100 pl-6 sm:pl-8">
            <p className="text-base leading-7 text-slate-700">A project shouldn’t have to wait for the right equipment. ToolShare helps people find what they need nearby and make better use of the tools already in their community.</p>
            <Link href="/products" className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">Start browsing <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="ts-container">
          <div className="flex flex-col gap-6 rounded-[1.75rem] bg-slate-950 px-6 py-10 text-white sm:px-10 sm:py-12 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-blue-300">Ready when you are</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Find your next useful tool.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">Explore what people are sharing, or create an account to list a tool of your own.</p>
            </div>
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
              <Link href="/products" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-blue-50">Browse tools</Link>
              <Link href="/register" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">Create account</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-7">
        <div className="ts-container flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <Link href="/" className="text-base font-bold tracking-tight text-slate-950">Tool<span className="text-primary">Share</span></Link>
          <p className="text-xs text-slate-500">© {new Date().getFullYear()} ToolShare. Tools shared, projects moved forward.</p>
          <div className="flex gap-5 text-sm text-slate-600"><Link href="/products" className="hover:text-primary">Browse</Link><Link href="/login" className="hover:text-primary">Log in</Link></div>
        </div>
      </footer>
    </main>
  );
}

function CheckMark() {
  return <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" className="h-4 w-4"><path d="m5 10 3.2 3.2L15.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function ToolMark() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="h-5 w-5"><path d="m14.5 6.5 3 3M5 19l8.8-8.8m1.2-6.7a5 5 0 0 0 6.5 6.5l-4 4-6.5-6.5 4-4A5 5 0 0 0 8.5 2l-2 2-2-2-3 3 2 2-2 2a5 5 0 0 0 6.5 6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function HammerMark() {
  return <svg aria-hidden="true" viewBox="0 0 64 64" fill="none" className="h-14 w-14 text-blue-800 sm:h-16 sm:w-16"><path d="m36 13 15 15M33 16l6-6 17 17-6 6M35 27 17 45m-5 7 7-7 7 7-7 7-7-7Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function WrenchMark() {
  return <svg aria-hidden="true" viewBox="0 0 64 64" fill="none" className="h-14 w-14 text-amber-800 sm:h-16 sm:w-16"><path d="M41 10a16 16 0 0 0-19 20L9 43a7 7 0 0 0 10 10l13-13a16 16 0 0 0 20-19L42 31l-9-9 8-12Z" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /><circle cx="16" cy="46" r="2" fill="currentColor" /></svg>;
}

function RulerMark() {
  return <svg aria-hidden="true" viewBox="0 0 64 64" fill="none" className="h-14 w-14 text-slate-700 sm:h-16 sm:w-16"><path d="m12 43 31-31 10 10-31 31-10-10Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" /><path d="m37 18 7 7m-14-1 7 7m-14-1 7 7m-14-1 7 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" /></svg>;
}

function IllustrationTile({
  tone,
  title,
  subtitle,
  children,
}: {
  tone: "blue" | "sand" | "slate";
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const tones = {
    blue: "bg-blue-50",
    sand: "bg-amber-50",
    slate: "bg-slate-100",
  };

  return (
    <div className={`flex min-h-36 flex-col justify-between rounded-2xl p-4 sm:min-h-40 sm:p-5 ${tones[tone]}`}>
      <div>{children}</div>
      <div>
        <p className="font-semibold tracking-tight text-slate-950">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-600">{subtitle}</p>
      </div>
    </div>
  );
}

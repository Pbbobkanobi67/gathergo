import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Wine, DollarSign, Calendar, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const { userId } = await auth();

  // If user is logged in, redirect to dashboard
  if (userId) {
    redirect("/dashboard");
  }

  const features = [
    {
      icon: Calendar,
      title: "Itinerary Planning",
      description: "Organize day-by-day activities with voting and assignments.",
    },
    {
      icon: Users,
      title: "Guest Management",
      description: "Invite guests via link, track RSVPs, manage dietary needs.",
    },
    {
      icon: Wine,
      title: "Blind Wine Tasting",
      description: "Host blind wine tastings with scoring, betting, and dramatic reveals.",
    },
    {
      icon: DollarSign,
      title: "Expense Tracking",
      description: "Split costs, track balances, settle up via Venmo or card.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-slate-800 bg-slate-900/95 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-teal-500">G</span>
            <span className="text-lg font-semibold text-slate-100">GatherGo</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-teal-600/10 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(13,148,136,0.15),transparent)]" />
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,black,transparent)]" />
        <div className="relative mx-auto max-w-6xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-100 sm:text-5xl md:text-6xl">
            Group Travel
            <span className="block bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">Made Simple</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
            Plan your cabin trips, road trips, and adventures with friends. Coordinate meals,
            activities, expenses, and even host blind wine tastings - all in one place.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/sign-up">
              <Button size="xl" className="gap-2 shadow-[0_0_24px_rgba(13,148,136,0.4)]">
                Start Planning Free
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="xl" variant="outline">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold text-slate-100">
            Everything You Need
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-slate-400">
            From planning to packing to paying, GatherGo has you covered.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-slate-700 bg-gradient-to-b from-slate-800/80 to-slate-800/50 p-6 shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-300 hover:border-teal-500/50 hover:-translate-y-1 hover:shadow-[0_4px_16px_rgba(0,0,0,0.4),0_0_20px_rgba(13,148,136,0.15)]"
              >
                <div className="rounded-lg bg-teal-500/20 p-3 w-fit transition-colors duration-300 group-hover:bg-teal-500/30">
                  <feature.icon className="h-6 w-6 text-teal-400 transition-colors duration-300 group-hover:text-teal-300" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-100">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Wine Tasting Highlight */}
      <section className="py-20 bg-gradient-to-r from-purple-900/20 to-slate-900">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center gap-12 lg:flex-row">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-4 py-1 text-sm text-purple-300">
                <Wine className="h-4 w-4" />
                Signature Feature
              </div>
              <h2 className="mt-4 text-3xl font-bold text-slate-100">
                Blind Wine Tasting Contests
              </h2>
              <p className="mt-4 text-slate-400">
                Everyone brings a bottle in a paper bag. Score wines blind, place bets with
                Hood Bucks, and watch the dramatic reveal. Will the $6 bottle beat the $40 one?
              </p>
              <ul className="mt-6 space-y-3 text-slate-300">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                  Anonymous submissions with bag numbers
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                  Digital scoresheets for each taster
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                  Hood Bucks betting system
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                  Dramatic animated reveal
                </li>
              </ul>
            </div>
            <div className="flex-1">
              <div className="rounded-2xl bg-gradient-to-b from-slate-800 to-slate-800/80 p-8 shadow-[0_4px_16px_rgba(0,0,0,0.4),0_0_30px_rgba(168,85,247,0.15)] border border-slate-700">
                <div className="flex justify-center gap-4">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="flex h-24 w-16 flex-col items-center justify-center rounded-lg bg-amber-900/50 text-amber-400"
                    >
                      <span className="text-3xl font-bold">{n}</span>
                      <span className="text-xs">Bag</span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 text-center">
                  <p className="text-sm text-slate-500">Which wine will win?</p>
                  <p className="mt-2 text-lg font-semibold text-purple-400">
                    Place your bets!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_50%,rgba(13,148,136,0.08),transparent)]" />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-100">
            Ready to Plan Your Next Adventure?
          </h2>
          <p className="mt-4 text-slate-400">
            Create your first trip for free. No credit card required.
          </p>
          <Link href="/sign-up">
            <Button size="xl" className="mt-8 gap-2 shadow-[0_0_24px_rgba(13,148,136,0.4)]">
              Get Started Free
              <ChevronRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-teal-500">G</span>
              <span className="font-semibold text-slate-100">GatherGo</span>
            </div>
            <p className="text-sm text-slate-500">
              Group travel made simple.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

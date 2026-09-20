import { VurennLogo, VurennWordmark } from '@/components/common/vurenn-logo'
import { ArrowRight, CalendarDays, Camera, Compass, MessageCircle, Quote, ShieldCheck, Sparkles, Star } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getPublicJournal } from '@/lib/journal'

export const revalidate = 30

export const metadata: Metadata = {
  title: 'Vurenn Journal — Updates, team, and ideas',
  description: 'Product updates, company notes, and the people building Vurenn.',
}

const values = [
  {
    Icon: ShieldCheck,
    title: 'Open & honest',
    copy: 'We say what works, what does not, and what still needs work.',
  },
  {
    Icon: Compass,
    title: 'Focus & clarity',
    copy: 'Clear thinking matters more than confident-sounding noise.',
  },
  {
    Icon: Sparkles,
    title: 'Growth & evolution',
    copy: 'We keep learning, measuring, and improving the product.',
  },
]

export default async function BlogPage() {
  const journal = await getPublicJournal()
  return (
    <main className="min-h-screen bg-[#0D1321] text-[#E9EDF2]">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0D1321]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Vurenn home">
            <VurennLogo size={32} label={false} tone="light" />
            <VurennWordmark className="text-sm" />
          </Link>
          <nav className="flex items-center gap-1 text-sm text-[#AAB3C2]" aria-label="Journal navigation">
            <a href="#story" className="hidden rounded-lg px-3 py-2 transition hover:bg-white/5 hover:text-white md:block">
              Why Vurenn
            </a>
            <a href="#updates" className="hidden rounded-lg px-3 py-2 transition hover:bg-white/5 hover:text-white sm:block">
              Updates
            </a>
            <a href="#reviews" className="hidden rounded-lg px-3 py-2 transition hover:bg-white/5 hover:text-white lg:block">
              Reviews
            </a>
            <a href="#team" className="hidden rounded-lg px-3 py-2 transition hover:bg-white/5 hover:text-white sm:block">
              Team
            </a>
            <Link
              href="/"
              className="ml-1 inline-flex items-center gap-2 rounded-lg border border-[#4F7BFF]/40 bg-[#4F7BFF]/10 px-3 py-2 font-medium text-[#A8C5FF] transition hover:bg-[#4F7BFF]/20"
            >
              Open Vurenn <ArrowRight className="size-3.5" />
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-0 py-5 sm:px-5 sm:py-8">
        <div className="relative aspect-[2149/464] min-h-[250px] overflow-hidden border-y border-white/10 sm:rounded-2xl sm:border">
          <Image
            src="/blog-hero.webp"
            alt="Vurenn — Clarity over confidence. Always."
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-16 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:py-24">
        <div>
          <p className="text-xs font-semibold tracking-[0.28em] text-[#A8C5FF] uppercase">The Vurenn Journal</p>
          <h1 className="mt-4 max-w-xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            What we&apos;re building, and why.
          </h1>
        </div>
        <p className="max-w-2xl text-lg leading-8 text-[#AAB3C2] lg:pt-7">
          {journal.intro} We value honest updates over polished noise.
        </p>
      </section>

      <section id="story" className="border-y border-white/10 bg-[#E9EDF2] text-[#0D1321]">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.72fr_1.28fr] lg:py-24">
          <div>
            <p className="text-xs font-semibold tracking-[0.28em] text-[#2A3A5A] uppercase">Our story</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">Why we built Vurenn</h2>
          </div>
          <div className="space-y-5 text-lg leading-8 text-[#465366]">
            <p>
              We are Christian developers who believe our gifts should be used in service of truth,
              creativity, and human dignity. We saw room for an independent AI assistant that values
              honest correction over empty agreement, admits uncertainty, and helps people turn ideas
              into useful work.
            </p>
            <p>
              Our faith shapes that commitment, but Vurenn welcomes people of every belief and does not
              claim perfect answers or speak for a church or denomination. Christ-centered means pursuing
              truth with humility, treating people with mercy and respect, and refusing to flatter someone
              with an answer we do not believe is true.
            </p>
            <p className="rounded-2xl border border-[#C9D3E0] bg-white/70 p-5 text-base leading-7">
              Vurenn is independently developed. Some language capabilities use Anthropic APIs, and image
              generation uses OpenAI APIs. Anthropic and OpenAI do not own, operate, sponsor, or endorse
              Vurenn. AI can make mistakes, so important claims should still be verified.
            </p>
          </div>
        </div>
      </section>

      <section id="reviews" className="border-y border-white/10 bg-[#0A101C]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold tracking-[0.28em] text-[#A8C5FF] uppercase">Community review board</p>
              <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">What people are saying</h2>
              <p className="mt-3 max-w-2xl leading-7 text-[#AAB3C2]">Public recommendations can sync from Vurenn&apos;s official Facebook page. Team-added reviews are clearly separated from imported Facebook recommendations.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {journal.social.facebook && <a href={journal.social.facebook} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-[#4F7BFF]/35 bg-[#4F7BFF]/10 px-4 py-2.5 text-sm font-medium text-[#A8C5FF] transition hover:bg-[#4F7BFF]/20"><MessageCircle className="size-4" />Review Vurenn on Facebook</a>}
              {journal.social.instagram && <a href={journal.social.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/5"><Camera className="size-4" />Instagram</a>}
            </div>
          </div>
          {journal.reviews.length ? <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{journal.reviews.map((review) => <article key={review.id} className="flex min-h-64 flex-col rounded-3xl border border-white/10 bg-[#111B2C] p-6 shadow-[0_18px_60px_#0004]"><Quote className="size-6 text-[#4F7BFF]" /><p className="mt-6 flex-1 text-lg leading-8 text-[#E9EDF2]">“{review.quote}”</p><div className="mt-6 border-t border-white/10 pt-4"><div className="flex items-center gap-1 text-[#A8C5FF]">{review.rating ? Array.from({ length: review.rating }, (_, index) => <Star key={index} className="size-3.5 fill-current" />) : <span className="text-xs font-medium">Recommendation</span>}</div><div className="mt-2 flex items-center justify-between gap-3"><span className="text-sm font-medium">{review.author}</span>{review.source === 'facebook' && review.source_url ? <a href={review.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#8B9099] hover:text-[#A8C5FF]">Facebook</a> : <span className="text-xs text-[#8B9099]">Shared with Vurenn</span>}</div>{review.date && <time className="mt-1 block text-[11px] text-[#667085]">{review.date}</time>}</div></article>)}</div> : <div className="mt-10 rounded-3xl border border-dashed border-white/15 bg-white/[.025] px-6 py-14 text-center"><Quote className="mx-auto size-7 text-[#4F7BFF]" /><h3 className="mt-4 text-lg font-semibold">The board is ready for its first review</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[#8B9099]">Recommendations will appear here after the Facebook connection is approved or a team member publishes an authorized review.</p></div>}
        </div>
      </section>

      <section id="updates" className="border-y border-white/10 bg-[#101A2B]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
          <div className="mb-10 flex items-end justify-between gap-6">
            <div>
              <p className="text-xs font-semibold tracking-[0.28em] text-[#A8C5FF] uppercase">Latest</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Product &amp; company updates</h2>
            </div>
            <CalendarDays className="hidden size-7 text-[#4F7BFF] sm:block" />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {journal.updates.map((update) => (
              <article
                key={update.title}
                className="group rounded-2xl border border-white/10 bg-[#131F32] p-6 transition hover:-translate-y-1 hover:border-[#4F7BFF]/45 hover:bg-[#172640]"
              >
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="rounded-full bg-[#4F7BFF]/12 px-2.5 py-1 font-medium text-[#A8C5FF]">
                    {update.category}
                  </span>
                  <time className="text-[#8B9099]">{update.date}</time>
                </div>
                <h3 className="mt-8 text-xl font-semibold">{update.title}</h3>
                <p className="mt-3 leading-7 text-[#AAB3C2]">{update.summary}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="grid gap-4 md:grid-cols-3">
          {values.map(({ Icon, title, copy }) => (
            <div key={title} className="rounded-2xl border border-white/10 p-6">
              <Icon className="size-5 text-[#4F7BFF]" />
              <h3 className="mt-6 font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#AAB3C2]">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="team" className="border-t border-white/10 bg-[#E9EDF2] text-[#0D1321]">
        <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:py-24">
          <p className="text-xs font-semibold tracking-[0.28em] text-[#2A3A5A] uppercase">The team</p>
          <h2 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Small team. Clear responsibility.
          </h2>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {journal.team.map((person) => (
              <article key={person.name} className="rounded-2xl border border-[#D3DAE4] bg-white p-6">
                <div className="flex size-11 items-center justify-center rounded-full bg-[#0D1321] text-sm font-semibold text-white">
                  {person.name.charAt(0)}
                </div>
                <h3 className="mt-6 text-xl font-semibold">{person.name}</h3>
                <p className="mt-1 text-sm font-medium text-[#4F7BFF]">{person.role}</p>
                <p className="mt-4 leading-7 text-[#5F6875]">{person.note}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-10 text-sm text-[#8B9099] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <span>© 2026 Vurenn. Clarity. Truth. Always.</span>
          <Link href="/" className="text-[#A8C5FF] transition hover:text-white">
            Return to Vurenn
          </Link>
        </div>
      </footer>
    </main>
  )
}

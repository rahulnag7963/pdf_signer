import Link from 'next/link';

const FEATURES = [
  {
    title: 'Private by design',
    body: 'Your PDF never leaves your browser. No uploads, no servers, no accounts — everything happens on your machine.',
    icon: '🔒',
  },
  {
    title: 'Draw or type',
    body: 'Sketch your signature with mouse or touch, or type your name and pick a handwriting style. Save it for next time.',
    icon: '✍️',
  },
  {
    title: 'Drag anywhere',
    body: 'Drop signatures, text, and dates exactly where they belong. Resize and reposition until it looks right.',
    icon: '📄',
  },
];

export default function Home() {
  return (
    <div className="bg-hero min-h-screen text-white">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-xl font-extrabold tracking-tight">
          Ink<span className="text-accent-400">Press</span>
        </div>
        <Link
          href="/sign"
          className="btn-glow rounded-full bg-accent-500 px-6 py-2.5 text-sm font-semibold transition hover:bg-accent-400"
        >
          Sign a PDF
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
        <div>
          <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
            Sign PDFs
            <br />
            in seconds
          </h1>
          <p className="mt-6 max-w-md text-lg text-ink-100">
            Add your signature, text, and date to any PDF — right in your browser. Free, fast, and
            completely private.
          </p>
          <Link
            href="/sign"
            className="btn-glow mt-8 inline-block rounded-full bg-accent-500 px-8 py-3.5 font-semibold transition hover:bg-accent-400"
          >
            Get started — it&apos;s free
          </Link>
        </div>

        {/* CSS illustration: floating document with signature squiggle */}
        <div className="relative hidden h-80 md:block" aria-hidden>
          <div className="absolute left-12 top-12 h-64 w-48 -rotate-6 rounded-2xl bg-ink-700/60 shadow-2xl" />
          <div className="absolute left-24 top-4 h-64 w-48 rotate-3 rounded-2xl bg-white p-5 shadow-2xl">
            <div className="h-2 w-3/4 rounded bg-ink-100" />
            <div className="mt-2 h-2 w-full rounded bg-ink-100" />
            <div className="mt-2 h-2 w-5/6 rounded bg-ink-100" />
            <div className="mt-2 h-2 w-full rounded bg-ink-100" />
            <div className="mt-2 h-2 w-2/3 rounded bg-ink-100" />
            <div
              className="mt-10 text-4xl text-ink-700"
              style={{ fontFamily: 'var(--font-dancing)' }}
            >
              Rahul
            </div>
            <div className="mt-1 h-px w-32 bg-ink-700/40" />
          </div>
          <div className="btn-glow absolute bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent-500 text-2xl">
            ✓
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-2xl bg-white/5 p-8 backdrop-blur">
              <div className="text-3xl">{f.icon}</div>
              <h3 className="mt-4 text-lg font-bold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-100">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Big CTA card, echoing the reference's white search card */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="rounded-3xl bg-white p-10 text-center shadow-2xl">
          <h2 className="text-2xl font-extrabold text-ink-900 md:text-3xl">
            Ready to sign your document?
          </h2>
          <p className="mt-2 text-slate-500">Drop in a PDF and be done in under a minute.</p>
          <Link
            href="/sign"
            className="btn-glow mt-6 inline-block rounded-full bg-accent-500 px-10 py-3.5 font-semibold text-white transition hover:bg-accent-400"
          >
            Open the editor
          </Link>
        </div>
      </section>

      <footer className="pb-10 text-center text-sm text-ink-100/60">
        InkPress — your files never leave your browser.
      </footer>
    </div>
  );
}

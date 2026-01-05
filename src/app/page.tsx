import { WalletConnect, WalletBalance, TransferForm } from "@/components/wallet";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--void)] relative">
      {/* Gradient orbs */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-[var(--electric)] opacity-[0.03] blur-[150px] rounded-full pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-500 opacity-[0.03] blur-[150px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#1a1a1a] bg-[var(--void)]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[var(--electric)] to-[var(--electric-dim)] flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--void)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-[var(--text-primary)]">LazorKit</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 rounded-full bg-[var(--signal-warning)]/10 border border-[var(--signal-warning)]/20 text-[var(--signal-warning)] text-xs font-mono">
              DEVNET
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <section className="text-center mb-20 animate-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--electric)]/10 border border-[var(--electric)]/20 text-[var(--electric)] text-xs font-mono mb-8">
            <span className="w-2 h-2 rounded-full bg-[var(--electric)] animate-pulse" />
            WebAuthn + Solana secp256r1
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-[var(--text-primary)] mb-6 tracking-tight">
            Passwordless
            <br />
            <span className="bg-gradient-to-r from-[var(--electric)] via-cyan-400 to-[var(--electric-dim)] bg-clip-text text-transparent">
              Wallet Auth
            </span>
          </h1>

          <p className="text-lg text-[var(--text-secondary)] max-w-xl mx-auto mb-12 leading-relaxed">
            Create and access your Solana smart wallet with biometrics.
            <br className="hidden sm:block" />
            No seed phrases. No extensions. Just you.
          </p>
        </section>

        {/* Features */}
        <section className="grid md:grid-cols-3 gap-4 mb-16">
          {[
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.864 4.243A7.5 7.5 0 0119.5 10.5c0 2.92-.556 5.709-1.568 8.268M5.742 6.364A7.465 7.465 0 004.5 10.5a7.464 7.464 0 01-1.15 3.993m1.989 3.559A11.209 11.209 0 008.25 10.5a3.75 3.75 0 117.5 0c0 .527-.021 1.049-.064 1.565M12 10.5a14.94 14.94 0 01-3.6 9.75m6.633-4.596a18.666 18.666 0 01-2.485 5.33" />
              ),
              title: "Passkey Auth",
              desc: "Face ID, Touch ID, Windows Hello",
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              ),
              title: "Gasless",
              desc: "Zero SOL needed for fees",
            },
            {
              icon: (
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              ),
              title: "Smart Wallet",
              desc: "Recovery & policy controls",
            },
          ].map((f, i) => (
            <div
              key={f.title}
              className={`p-5 rounded-2xl bg-gradient-to-br from-[#0a0a0a] to-[#0d0d0d] border border-[#1a1a1a] hover:border-[#2a2a2a] transition-all animate-in delay-${i + 1}`}
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--electric)]/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-[var(--electric)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  {f.icon}
                </svg>
              </div>
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">{f.title}</h3>
              <p className="text-sm text-[var(--text-tertiary)]">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* Main Grid */}
        <section className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <WalletConnect />
            <WalletBalance />
          </div>
          <TransferForm />
        </section>

        {/* How it works */}
        <section className="mt-24 animate-in delay-4">
          <h2 className="text-center text-sm font-mono uppercase tracking-widest text-[var(--text-tertiary)] mb-12">
            How it works
          </h2>
          <div className="grid sm:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Connect", desc: "Click the button" },
              { step: "02", title: "Authenticate", desc: "Biometric scan" },
              { step: "03", title: "Wallet Ready", desc: "On-chain deploy" },
              { step: "04", title: "Transact", desc: "Gasless transfers" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[var(--electric)] to-[var(--electric-dim)] flex items-center justify-center text-[var(--void)] font-mono font-bold text-lg">
                  {item.step}
                </div>
                <h4 className="font-semibold text-[var(--text-primary)] mb-1">{item.title}</h4>
                <p className="text-sm text-[var(--text-tertiary)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1a1a1a] mt-24">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-[var(--text-tertiary)]">
            Built with{" "}
            <a href="https://lazorkit.com" target="_blank" rel="noopener noreferrer" className="text-[var(--electric)] hover:underline">
              LazorKit SDK
            </a>
          </p>
          <div className="flex items-center gap-6 text-sm">
            <a href="https://docs.lazorkit.com" target="_blank" rel="noopener noreferrer" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              Docs
            </a>
            <a href="https://github.com/lazor-kit" target="_blank" rel="noopener noreferrer" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              GitHub
            </a>
            <a href="https://explorer.solana.com/?cluster=devnet" target="_blank" rel="noopener noreferrer" className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
              Explorer
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

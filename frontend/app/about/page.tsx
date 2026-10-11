"use client";

import { QRCodeSVG } from "qrcode.react";
import { PageHeader } from "../../components/PageHeader";

type TeamMember = {
  name: string;
  role: string;
  initials: string;
  avatarBg: string;
  linkedin: string;
  contributions: string[];
};

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Shah Htet Naing (Shah)",
    role: "Developer | Full-Stack & AI Systems Leader",
    initials: "SN",
    avatarBg: "from-purple-700 via-indigo-700 to-purple-950",
    linkedin: "https://www.linkedin.com/in/shah-htet-naing",
    contributions: [
      "Architected Next.js 15 UI with bespoke Aether theme and responsive operations desk.",
      "Engineered Express API & REST microservice bridge for real-time dataset analysis.",
      "Implemented strict PII / DLP regex guardrails to sanitize customer contact details.",
      "Designed algorithmic risk scoring engine for overdue invoice prioritization.",
    ],
  },
  {
    name: "Thi Han Htun (Louis)",
    role: "Developer | Backend & Infrastructure Specialist",
    initials: "TH",
    avatarBg: "from-violet-850 via-purple-800 to-slate-900",
    linkedin: "https://www.linkedin.com/in/thi-han-htun-65a22736a/",
    contributions: [
      "Engineered multi-tenant database schema supporting resilient local persistence.",
      "Built multi-catalog ledger integrations across bookings, invoices, and compliance items.",
      "Created resilient human-in-the-loop approval email dispatch pipeline.",
      "Constructed reliable background job scheduling and system audit logging services.",
    ],
  },
  {
    name: "Nyan Lin Htet (Loki)",
    role: "Business Development Manager | Product & SME Ecosystem Lead",
    initials: "NL",
    avatarBg: "from-fuchsia-800 via-purple-900 to-indigo-950",
    linkedin: "https://www.linkedin.com/in/nyan-lin-htet-1a6849240/",
    contributions: [
      "Led product-market fit alignment with Enterprise Singapore SME requirements & standards.",
      "Designed localized workflows tailored to Singapore GST, CPF, ACRA, and PDPA compliance.",
      "Architected SME grant eligibility screening matrices (PSG, EDG, and Market Readiness).",
      "Directed end-to-end go-to-market strategy, user persona research, and business viability.",
    ],
  },
];

type TechBadge = {
  name: string;
  category: string;
  description: string;
  badge: string;
  icon: (props: { className?: string }) => React.JSX.Element;
};

const TECH_STACK: TechBadge[] = [
  {
    name: "Next.js",
    category: "Full-Stack Web Framework",
    description: "App Router, SSR, Server Actions & optimized edge routing",
    badge: "v15",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 180 180" fill="currentColor">
        <circle cx="90" cy="90" r="88" fill="none" stroke="currentColor" strokeWidth="6" />
        <path d="M149.5 142.3L72.2 44.5H53.5V135.5H68.8V67.8L136.2 153.2C141 150 145.5 146.4 149.5 142.3Z" />
        <rect x="111.5" y="44.5" width="15.5" height="91" />
      </svg>
    ),
  },
  {
    name: "Node.js",
    category: "Server Runtime",
    description: "Async event-driven I/O engine powering backend agent runners",
    badge: "v22 LTS",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 32 32" fill="currentColor">
        <path d="M16 2.5L28.2 9.5V23.5L16 30.5L3.8 23.5V9.5L16 2.5Z" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M16 8.5L22.5 12.2V19.8L16 23.5L9.5 19.8V12.2L16 8.5Z" />
      </svg>
    ),
  },
  {
    name: "Vercel",
    category: "Edge & Frontend Deployment",
    description: "Global CDN delivery, automated preview branches & DNS",
    badge: "Cloud",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1L24 22H0L12 1Z" />
      </svg>
    ),
  },
  {
    name: "Render",
    category: "Cloud Infrastructure",
    description: "Containerized application runtime & managed background workers",
    badge: "Cloud PaaS",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z" />
      </svg>
    ),
  },
  {
    name: "MongoDB Atlas",
    category: "Scalable Document Store",
    description: "Distributed schemaless records for multi-agent state tracking",
    badge: "Database",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 1.5C11.5 3 6.5 9.5 6.5 14.5c0 3.3 2.5 6 5.5 6.5 3-.5 5.5-3.2 5.5-6.5 0-5-5-11.5-5.5-13zm0 18.5c-2.2 0-4-1.8-4-4 0-3 3-7.5 4-9 1 1.5 4 6 4 9 0 2.2-1.8 4-4 4z" />
      </svg>
    ),
  },
  {
    name: "OpenAI",
    category: "Autonomous Agent Core",
    description: "High-reasoning LLMs for nuance-aware drafts & rule extraction",
    badge: "AI Core",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.5 9.8c-.3-1.6-1.5-2.8-3.1-3.2-.5-.9-1.3-1.6-2.3-1.9-1.4-.5-3-.1-4 .9-1-.3-2-.1-2.9.4-1.2.7-1.9 2-1.9 3.4 0 .4.1.8.2 1.2-1 .5-1.7 1.4-1.9 2.5-.3 1.5.3 3 1.5 3.9v1.2c0 1.4.7 2.7 1.9 3.4.9.5 1.9.7 2.9.4 1 1 2.6 1.4 4 .9 1-.3 1.8-1 2.3-1.9 1.6-.4 2.8-1.6 3.1-3.2.2-1.1-.1-2.2-.8-3 .7-.8 1-1.9.8-3.1zm-8.5 7.7c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z" />
      </svg>
    ),
  },
  {
    name: "Resend",
    category: "Transactional Messaging",
    description: "Enterprise deliverability for approved email notifications",
    badge: "Email API",
    icon: ({ className }) => (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.5 5h19v14h-19V5zm17.2 2.2L12 12.3 4.3 7.2v9.6h15.4V7.2zM12 10.7l7-4.7H5l7 4.7z" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-10 pb-12">
      <PageHeader
        eyebrow="Hackathon Credibility"
        title="About Us"
        description="Meet the engineering and business development team driving autonomous operational intelligence for Singapore SMEs."
      />

      {/* Mission Statement Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-br from-[#2e0854] via-[#3b0764] to-[#1e0538] p-8 text-white shadow-xl shadow-purple-950/20">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 left-1/3 h-56 w-56 rounded-full bg-fuchsia-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-300/30 bg-purple-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-200">
            <span className="h-1.5 w-1.5 rounded-full bg-purple-300 animate-pulse" />
            Our Mission
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white md:text-3xl leading-snug">
            &ldquo;Building secure, autonomous AI agents to solve operational bottlenecks for Singapore&apos;s local businesses.&rdquo;
          </h2>
          <p className="text-sm text-purple-200/90 leading-relaxed max-w-2xl pt-1">
            Singapore small and medium enterprises spend hundreds of hours every month chasing unpaid invoices,
            screening complex grant eligibility criteria, and tracking regulatory filings. Aether blends autonomous
            agent reasoning with strict human-in-the-loop oversight to automate routine back-office drudgery while
            safeguarding company data integrity.
          </p>
        </div>
      </section>

      {/* Team Profile Cards */}
      <section className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="accent-text text-[11px] font-semibold uppercase tracking-[0.16em]">Builders & Strategists</p>
            <h2 className="text-2xl font-semibold tracking-tight">The Team</h2>
          </div>
          <p className="text-xs text-muted">Hover & scan QR codes to connect</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {TEAM_MEMBERS.map((member) => (
            <article
              key={member.name}
              className="group relative flex flex-col justify-between rounded-xl border border-purple-900/30 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-purple-600 hover:shadow-xl hover:shadow-purple-950/10"
            >
              {/* Purple accent highlight bar on top */}
              <div className="absolute inset-x-0 top-0 h-1 rounded-t-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 opacity-80 group-hover:opacity-100 transition-opacity" />

              <div>
                {/* Header with Avatar and Role */}
                <div className="flex items-start gap-4">
                  <div
                    className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr ${member.avatarBg} text-lg font-bold text-white shadow-md shadow-purple-950/20 ring-2 ring-purple-300/60`}
                  >
                    {member.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-base font-semibold tracking-tight text-[#1e1233] leading-snug">
                      {member.name}
                    </h3>
                    <p className="mt-1 text-xs font-medium text-purple-700 leading-tight">
                      {member.role}
                    </p>
                  </div>
                </div>

                {/* Key Contributions List */}
                <div className="mt-5 border-t border-purple-100 pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Key Contributions</p>
                  <ul className="mt-2.5 space-y-2">
                    {member.contributions.map((bullet, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-[#2e1d4a] leading-relaxed">
                        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-600" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* QR Code and Connect Button Footer */}
              <div className="mt-6 border-t border-purple-100 pt-5 space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-purple-200/80 bg-purple-50/50 p-3">
                  <div className="space-y-0.5">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-900">Scan to Connect</p>
                    <p className="text-[11px] text-muted">Direct LinkedIn profile</p>
                  </div>
                  <div className="rounded-md border border-purple-200 bg-white p-1.5 shadow-sm">
                    <QRCodeSVG
                      value={member.linkedin}
                      size={74}
                      level="M"
                      fgColor="#2e0854"
                      bgColor="#ffffff"
                    />
                  </div>
                </div>

                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="btn-ink w-full gap-2 text-xs py-2.5 transition-transform hover:scale-[1.01]"
                >
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                  Connect on LinkedIn
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Tech Stack Showcase */}
      <section className="space-y-4">
        <div>
          <p className="accent-text text-[11px] font-semibold uppercase tracking-[0.16em]">Architecture</p>
          <h2 className="text-2xl font-semibold tracking-tight">Tech Stack Showcase</h2>
          <p className="mt-1 text-sm text-muted">Production-grade foundation tailored for enterprise reliability and speed.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {TECH_STACK.map((tech) => {
            const Icon = tech.icon;
            return (
              <div
                key={tech.name}
                className="panel group relative flex flex-col justify-between p-4 transition-all hover:border-purple-500 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-800 group-hover:bg-purple-700 group-hover:text-white transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-purple-700 border border-purple-200">
                      {tech.badge}
                    </span>
                  </div>
                  <h3 className="mt-3 font-semibold text-sm text-[#1e1233]">{tech.name}</h3>
                  <p className="text-[11px] font-medium text-purple-600">{tech.category}</p>
                  <p className="mt-1.5 text-xs text-muted leading-relaxed">{tech.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Execution Credibility Footer Callout */}
      <section className="rounded-xl border border-purple-200 bg-purple-50/60 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-900">Singapore SME Regulatory Ready</p>
          <p className="text-xs text-muted max-w-xl">
            Designed to meet the Personal Data Protection Act (PDPA), ACRA annual review schedules, and IRAS GST reporting cadence with non-repudiable audit logs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="live-dot" />
          <span className="text-xs font-semibold text-purple-950 font-mono">Status: Verified Hackathon Build</span>
        </div>
      </section>
    </div>
  );
}

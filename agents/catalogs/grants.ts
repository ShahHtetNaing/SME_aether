export type GrantCatalogItem = {
  id: string;
  name: string;
  agency: string;
  summary: string;
  checklist: string[];
  match: (profile: {
    industry: string;
    employeeCount: number;
    isExporting: boolean;
    usesDigitalTools: boolean;
  }) => { ok: boolean; reason: string; score: number };
};

export const GRANT_CATALOG: GrantCatalogItem[] = [
  {
    id: "psg",
    name: "Productivity Solutions Grant (PSG)",
    agency: "Enterprise Singapore",
    summary: "Co-funds pre-approved IT solutions and equipment that raise productivity.",
    checklist: ["Confirm SME eligibility", "Pick a pre-approved vendor", "Prepare quotations", "Submit via Business Grants Portal"],
    match: (p) =>
      p.usesDigitalTools || p.employeeCount >= 1
        ? { ok: true, reason: "Fits SMEs adopting digital or equipment upgrades", score: 80 }
        : { ok: false, reason: "Needs a digital or equipment upgrade intent", score: 20 },
  },
  {
    id: "edg",
    name: "Enterprise Development Grant (EDG)",
    agency: "Enterprise Singapore",
    summary: "Supports projects in core capabilities, innovation, and internationalisation.",
    checklist: ["Define project scope and outcomes", "Prepare 3-year financials", "List project costs", "Identify project manager"],
    match: (p) =>
      p.employeeCount >= 3
        ? { ok: true, reason: "Capability-building project likely relevant", score: 75 }
        : { ok: false, reason: "Usually better with a defined growth project and staff", score: 30 },
  },
  {
    id: "mra",
    name: "Market Readiness Assistance (MRA)",
    agency: "Enterprise Singapore",
    summary: "Supports first overseas marketing, listing, and promotion costs.",
    checklist: ["Name target market", "Prepare overseas marketing plan", "Collect vendor quotes", "Confirm first-time market entry"],
    match: (p) =>
      p.isExporting
        ? { ok: true, reason: "Exporting SMEs can be matched to overseas assistance", score: 90 }
        : { ok: false, reason: "Turn on exporting in the business profile to evaluate", score: 10 },
  },
  {
    id: "sfec",
    name: "SkillsFuture Enterprise Credit (SFEC)",
    agency: "SkillsFuture / Enterprise Singapore",
    summary: "Credit for eligible enterprises to offset qualifying transformation and training costs.",
    checklist: ["Check remaining credit", "Map training or transformation vendor", "Keep attendance and invoices"],
    match: (p) =>
      p.employeeCount >= 1
        ? { ok: true, reason: "Most SMEs with staff can review remaining credit", score: 70 }
        : { ok: false, reason: "Needs at least one employee", score: 15 },
  },
  {
    id: "startup-sg",
    name: "Startup SG Founder",
    agency: "Startup SG",
    summary: "Mentorship and startup capital support for first-time founders.",
    checklist: ["Confirm first-time founder status", "Prepare business idea brief", "Identify mentor / incubator"],
    match: (p) =>
      p.employeeCount <= 10 && /tech|software|digital|startup/i.test(p.industry)
        ? { ok: true, reason: "Small digital or tech profile may fit founder support", score: 65 }
        : { ok: false, reason: "Better for early-stage tech or digital founders", score: 25 },
  },
];

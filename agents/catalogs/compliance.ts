export type ComplianceRequirement = {
  id: string;
  framework: string;
  title: string;
  summary: string;
  appliesWhen: (profile: { annualRevenueSgd: number; hasGstRegistration: boolean; employeeCount: number }) => boolean;
};

export const COMPLIANCE_CATALOG: ComplianceRequirement[] = [
  {
    id: "pdpa-consent",
    framework: "PDPA",
    title: "Personal data purpose and consent",
    summary: "Collect only what you need and tell customers why you use their data.",
    appliesWhen: () => true,
  },
  {
    id: "pdpa-access",
    framework: "PDPA",
    title: "Access and correction process",
    summary: "Be able to respond if a person asks what data you hold or wants a correction.",
    appliesWhen: () => true,
  },
  {
    id: "acra-annual",
    framework: "ACRA",
    title: "Annual return / filing calendar",
    summary: "Track filing deadlines for the business entity.",
    appliesWhen: () => true,
  },
  {
    id: "gst-threshold",
    framework: "GST",
    title: "GST registration threshold",
    summary: "Register if taxable turnover exceeds the GST threshold or you are already registered.",
    appliesWhen: (p) => p.hasGstRegistration || p.annualRevenueSgd >= 1_000_000,
  },
  {
    id: "cpf-employees",
    framework: "MOM / CPF",
    title: "CPF contributions for employees",
    summary: "If you have staff, keep Contribution records aligned with employment dates.",
    appliesWhen: (p) => p.employeeCount >= 1,
  },
  {
    id: "wsh-basic",
    framework: "WSH",
    title: "Workplace safety basics",
    summary: "Risk assessment and incident reporting for on-site or customer-facing work.",
    appliesWhen: (p) => p.employeeCount >= 1,
  },
];

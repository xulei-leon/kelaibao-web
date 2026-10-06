export type ServiceId = "positioning" | "content-assets" | "ongoing-advisory";

export type ProfessionId = "direct-sales" | "insurance" | "securities";

export interface ServiceDefinition {
  id: ServiceId;
  number: string;
  name: string;
  summary: string;
  clientSituation: string;
  outcome: string;
  scope: readonly string[];
  deliverables: readonly string[];
  clientInputs: readonly string[];
  useCases: readonly string[];
  limitations: readonly string[];
}

export interface RepresentativeSample {
  id: string;
  number: string;
  title: string;
  summary: string;
  previewItems: readonly string[];
  useCases: readonly string[];
  isIllustrative: true;
  disclaimer: string;
}

export interface DirectSalesSituation {
  number: string;
  title: string;
  problem: string;
  outcome: string;
}

export interface WorkingStandard {
  number: string;
  title: string;
  description: string;
}

export interface ProfessionServiceFit {
  serviceId: ServiceId;
  description: string;
}

export interface ProfessionDefinition {
  id: ProfessionId;
  name: string;
  shortName: string;
  heroTitle: string;
  lead: string;
  scenarios: readonly string[];
  commonProblems: readonly string[];
  serviceFit: readonly ProfessionServiceFit[];
  contentAssets: readonly string[];
  boundaries: readonly string[];
  responsibilities: readonly string[];
  disclaimer: string;
}

export interface WorkflowStep {
  id: string;
  number: string;
  title: string;
  description: string;
  deliverable: string;
}

export interface WechatContactConfig {
  qrImagePath: string;
  displayName: string;
  accountType: "wecom";
  serviceHours?: string;
  desktopHint: string;
  mobileHint: string;
  assetStatus: "preview-placeholder" | "production-wecom";
}

export interface MiniProgramConfig {
  qrImagePath: string;
  displayName: string;
  desktopHint: string;
  mobileHint: string;
  assetStatus: "preview-placeholder" | "production-mini-program";
}

export type ProfessionValue =
  | "direct_sales"
  | "insurance_broker"
  | "securities_broker"
  | "other";

export type ContactMethod = "phone";

export interface MainlandLeadRequest {
  name: string;
  profession: ProfessionValue;
  city?: string;
  contactMethod: ContactMethod;
  contactValue: string;
  needs: string;
  privacyConsent: true;
}

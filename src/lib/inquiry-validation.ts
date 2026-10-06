import type {
  ContactMethod,
  MainlandLeadRequest,
  ProfessionValue,
} from "@/types/site";

export interface InquiryInput {
  name: string;
  profession: string;
  city: string;
  contactMethod: string;
  contactValue: string;
  needs: string;
  privacyConsent: boolean;
  company: string;
}

type InquiryField = keyof InquiryInput;
export type InquiryErrors = Partial<Record<InquiryField, string>>;

export type InquiryValidationResult =
  | { ok: true; value: InquiryInput }
  | { ok: false; errors: InquiryErrors };

const professionValues: readonly ProfessionValue[] = [
  "direct_sales",
  "insurance_broker",
  "securities_broker",
  "other",
];
const contactMethods: readonly ContactMethod[] = ["phone"];

function length(value: string) {
  return Array.from(value).length;
}

export function validateInquiry(input: InquiryInput): InquiryValidationResult {
  const value: InquiryInput = {
    ...input,
    name: input.name.trim(),
    city: input.city.trim(),
    contactValue: input.contactValue.trim(),
    needs: input.needs.trim(),
    company: input.company.trim(),
  };
  const errors: InquiryErrors = {};

  if (length(value.name) < 1 || length(value.name) > 40) {
    errors.name = "请输入 1–40 个字符的称呼。";
  }
  if (!professionValues.includes(value.profession as ProfessionValue)) {
    errors.profession = "请选择您的职业场景。";
  }
  if (length(value.city) > 40) {
    errors.city = "城市名称最多 40 个字符。";
  }
  if (!contactMethods.includes(value.contactMethod as ContactMethod)) {
    errors.contactMethod = "请使用电话号码联系。";
  }
  if (length(value.contactValue) < 2 || length(value.contactValue) > 80) {
    errors.contactValue = "请输入 2–80 个字符的联系方式。";
  } else if (!/^(?:\+?86[-\s]?)?1[3-9]\d{9}$/.test(value.contactValue)) {
    errors.contactValue = "请输入有效的中国大陆手机号码。";
  }
  if (length(value.needs) < 10 || length(value.needs) > 800) {
    errors.needs = "请用 10–800 个字符说明当前需求。";
  }
  if (value.privacyConsent !== true) {
    errors.privacyConsent = "提交前请阅读并同意隐私保护原则。";
  }
  return Object.keys(errors).length > 0
    ? { ok: false, errors }
    : { ok: true, value };
}

export function createLeadRequest(input: InquiryInput): MainlandLeadRequest {
  const payload: MainlandLeadRequest = {
    name: input.name,
    profession: input.profession as ProfessionValue,
    contactMethod: input.contactMethod as ContactMethod,
    contactValue: input.contactValue,
    needs: input.needs,
    privacyConsent: true,
  };

  if (input.city) payload.city = input.city;
  return payload;
}

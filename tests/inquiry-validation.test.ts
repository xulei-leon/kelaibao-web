import {
  createLeadRequest,
  validateInquiry,
} from "@/lib/inquiry-validation";
import { describe, expect, it } from "vitest";

const validInput = {
  name: "林女士",
  profession: "insurance_broker",
  city: "上海",
  contactMethod: "phone",
  contactValue: "13800138000",
  needs: "希望梳理个人介绍、服务说明和长期内容主题。",
  privacyConsent: true,
  company: "",
};

describe("inquiry validation", () => {
  it("creates the exact whitelisted lead payload", () => {
    const result = validateInquiry(validInput);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(createLeadRequest(result.value)).toEqual({
      name: "林女士",
      profession: "insurance_broker",
      city: "上海",
      contactMethod: "phone",
      contactValue: "13800138000",
      needs: "希望梳理个人介绍、服务说明和长期内容主题。",
      privacyConsent: true,
    });
  });

  it.each([
    ["name", { name: "" }],
    ["profession", { profession: "advisor" }],
    ["contactValue", { contactValue: "" }],
    ["needs", { needs: "太短" }],
    ["privacyConsent", { privacyConsent: false }],
  ])("rejects invalid %s input before submission", (_field, override) => {
    const result = validateInquiry({ ...validInput, ...override });
    expect(result.ok).toBe(false);
  });

  it("uses the friendly privacy notice name in consent errors", () => {
    const result = validateInquiry({ ...validInput, privacyConsent: false });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.errors.privacyConsent).toBe("提交前请阅读并同意隐私保护原则。");
  });

  it("keeps the transport honeypot out of the lead DTO", () => {
    const result = validateInquiry({
      ...validInput,
      company: "bot-filled",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(createLeadRequest(result.value)).not.toHaveProperty("company");
  });

  it("validates a mainland phone number when phone is selected", () => {
    expect(
      validateInquiry({
        ...validInput,
        contactMethod: "phone",
        contactValue: "12345",
      }).ok,
    ).toBe(false);
    expect(
      validateInquiry({
        ...validInput,
        contactMethod: "phone",
        contactValue: "13800138000",
      }).ok,
    ).toBe(true);
  });
});

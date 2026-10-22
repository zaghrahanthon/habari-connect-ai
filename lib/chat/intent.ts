export type ChatIntent =
  | "greeting"
  | "follow_up"
  | "it_support"
  | "security"
  | "hr_policy"
  | "company_specific"
  | "internal_tool"
  | "general_workplace";

const COMPANY_MARKERS =
  /\b(habari|hm connect|habari connect|habari media|axiopay|payspace|our (policy|policies|process|procedure)|company (policy|policies|handbook)|who (is|should i contact)|boardroom|people (&|and) culture)\b/i;

export function classifyIntent(
  query: string,
  previousUserMessages: string[] = [],
): ChatIntent {
  const text = query.trim();
  if (!text) return "general_workplace";

  if (
    /^(hi|hello|hey|good (morning|afternoon|evening)|thanks|thank you|cheers)\b/i.test(
      text,
    ) &&
    text.length < 80
  ) {
    return "greeting";
  }

  if (
    /\b(phish|security alert|suspicious email|malware|ransomware|data breach|compromised)\b/i.test(
      text,
    )
  ) {
    return "security";
  }

  if (
    /\b(password|vpn|outlook|laptop|wifi|wi-fi|printer|software|hardware|it support|reset (my )?password|teams|excel|windows|mac)\b/i.test(
      text,
    )
  ) {
    return "it_support";
  }

  if (
    /\b(leave|hr|human resources|policy|policies|handbook|benefits|payslip|payroll|paternity|maternity)\b/i.test(
      text,
    )
  ) {
    return COMPANY_MARKERS.test(text) || /\b(habari|our|company)\b/i.test(text)
      ? "hr_policy"
      : /\b(leave|hr|policy|handbook|benefits)\b/i.test(text)
        ? "hr_policy"
        : "general_workplace";
  }

  if (
    /\b(dashboard|analytics|boardroom|book(ing)? (a )?(room|boardroom)|notifications?|people & culture|knowledge base|habari connect)\b/i.test(
      text,
    )
  ) {
    return "internal_tool";
  }

  if (COMPANY_MARKERS.test(text)) return "company_specific";

  if (
    previousUserMessages.length > 0 &&
    (/^(and|also|what about|how about|that|those|it|this|yes|no|ok|please)\b/i.test(
      text,
    ) ||
      (text.length < 120 &&
        /\b(it|that|those|this|them|the same)\b/i.test(text)))
  ) {
    return "follow_up";
  }

  return "general_workplace";
}

export function isCompanyBoundIntent(intent: ChatIntent): boolean {
  return (
    intent === "security" ||
    intent === "hr_policy" ||
    intent === "company_specific" ||
    intent === "internal_tool"
  );
}

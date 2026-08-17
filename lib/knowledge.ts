// Minimal static baseline for chat — all other content comes from the admin database.

/** Employee self-service portal — leave, payslips, and HR enrolment */
export const AXIOPAY_URL = "https://axiopay.payus.co.za";

/** Canonical leave guidance — URL appears once when answering leave questions */
export const LEAVE_GUIDANCE = {
  portalName: "Axiopay Employee Self Service",
  url: AXIOPAY_URL,
  advanceDays: 5,
  hrContact: "Chanel Martin",
  hrRole: "HR Business Partner",
  hrEmail: "chanel.martin@habarimedia.com",
  annualLeaveDays: 15,
} as const;

/** Leave-only baseline injected into chat when DB content does not cover leave */
export const LEAVE_BASELINE = `
## Leave applications (Axiopay)
- Apply for leave via Axiopay Employee Self Service (submit at least ${LEAVE_GUIDANCE.advanceDays} working days in advance)
- Full-time employees receive ${LEAVE_GUIDANCE.annualLeaveDays} days annual leave per year
- Leave portal link (include once when answering leave questions): ${AXIOPAY_URL}
- For HR questions about leave, contact ${LEAVE_GUIDANCE.hrContact} (${LEAVE_GUIDANCE.hrRole}) at ${LEAVE_GUIDANCE.hrEmail}
`.trim();

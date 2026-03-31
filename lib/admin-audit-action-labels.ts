/**
 * Short labels for audit `action` codes shown in /admin/audit.
 * Unknown actions fall back to the raw string.
 */
const LABELS: Record<string, string> = {
  "auth.login": "Staff sign-in",
  "admin.team.invite": "Invite administrator",
  "admin.team.resend_credentials": "Resend credentials email",
  "admin.team.update": "Update team member",
  "admin.team.revoke": "Revoke staff access",
  "admin.team.test_smtp": "Send SMTP test email",
  "companies.verify": "Verify company",
  "orders.acknowledge_commission_proofs": "Acknowledge commission proofs",
  "orders.merchant_commission_record": "Record merchant commission",
  "orders.supplier_commission_record": "Record supplier commission",
  "orders.confirm_gateway": "Confirm gateway payment",
  "orders.approve_bank": "Approve bank payment",
  "orders.complete": "Complete order",
  "moderation.delete_product_review": "Delete product review",
  "moderation.delete_company_review": "Delete company review",
  "moderation.delete_product_comment": "Delete product comment",
  "categories.create": "Create category",
  "categories.patch": "Update category",
  "categories.delete": "Delete category",
  "system.config.patch": "Update system settings",
  "identity.review": "Identity verification decision",
};

export function auditActionLabel(action: string): string {
  return LABELS[action] ?? action;
}

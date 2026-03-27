/**
 * Smoke test for SendGrid. Run from project root:
 *   SENDGRID_API_KEY=... SENDGRID_FROM_EMAIL=verified@yourdomain.com node scripts/test-sendgrid.mjs you@example.com
 *
 * The "to" address can be any inbox you can check (does not need to be verified in SendGrid).
 */
import sgMail from "@sendgrid/mail";

const apiKey = process.env.SENDGRID_API_KEY?.trim();
const from = process.env.SENDGRID_FROM_EMAIL?.trim();
const to = process.argv[2]?.trim();

if (!apiKey || !from) {
  console.error("Set SENDGRID_API_KEY and SENDGRID_FROM_EMAIL in the environment.");
  process.exit(1);
}
if (!to) {
  console.error("Usage: node scripts/test-sendgrid.mjs <recipient@email.com>");
  process.exit(1);
}

sgMail.setApiKey(apiKey);

await sgMail.send({
  to,
  from,
  subject: "Lucy Merchant — SendGrid test",
  text: "If you received this, SendGrid is configured correctly.",
  html: "<p>If you received this, SendGrid is configured correctly.</p>",
});

console.log(`Sent test email to ${to}`);

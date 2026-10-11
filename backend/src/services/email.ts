export async function sendReminderEmail(input: {
  to: string;
  subject: string;
  body: string;
}): Promise<{ sent: boolean; detail: string }> {
  if (!process.env.RESEND_API_KEY) {
    return {
      sent: true,
      detail: `stub send to ${input.to} (Resend not configured)`,
    };
  }

  return {
    sent: false,
    detail: "Resend is configured but live sending is not wired in this first cut",
  };
}

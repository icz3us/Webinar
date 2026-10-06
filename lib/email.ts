type EmailMessage = { to: string; toName?: string; subject: string; html: string; tags?: string[] };

export async function sendEmail(message: EmailMessage) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const senderName = process.env.BREVO_SENDER_NAME || "Deepfakes & Digital Trust";
  if (!apiKey || !senderEmail) return { delivered: false, reason: "Brevo is not configured." };
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ sender: { email: senderEmail, name: senderName }, to: [{ email: message.to, name: message.toName }], subject: message.subject, htmlContent: message.html, tags: message.tags ?? ["webinar-transactional"] }),
  });
  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Brevo email rejected", { status: response.status, body: errorBody });
    let reason = "Brevo rejected the email request.";
    try {
      const parsed = JSON.parse(errorBody);
      if (parsed?.message) {
        reason = `Brevo error: ${parsed.message}`;
      }
    } catch {
      // keep fallback
    }
    return { delivered: false, reason };
  }
  const result = await response.json() as { messageId?: string };
  return { delivered: true, id: result.messageId };
}

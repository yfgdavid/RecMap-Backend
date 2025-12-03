export async function enviarEmail(to: string, subject: string, html: string) {
  try {

    console.log("🔑 BREVO_API_KEY:", process.env.BREVO_API_KEY ? `${process.env.BREVO_API_KEY.substring(0, 20)}...` : "❌ NÃO ENCONTRADA");
    console.log("📧 FROM_EMAIL:", process.env.FROM_EMAIL);
    
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY!,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: process.env.FROM_NAME || "RecMap",
          email: process.env.FROM_EMAIL!
        },
        to: [{ email: to }],
        subject: subject,
        htmlContent: html
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Brevo API Error: ${JSON.stringify(error)}`);
    }

    const result = await response.json() as { messageId?: string };
    console.log("✅ Email enviado com sucesso para:", to, "| ID:", result.messageId || 'OK');
  } catch (error) {
    console.error("❌ Erro ao enviar email via Brevo API:", error);
    throw new Error("Não foi possível enviar o email.");
  }
}

console.log("📧 Servidor pronto para enviar emails via Brevo");

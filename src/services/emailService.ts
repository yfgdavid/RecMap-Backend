// src/services/emailService.ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // porta 587 = false
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

transporter.verify((error, success) => {
  if (error) console.log("SMTP Error:", error);
  else console.log("Servidor SMTP pronto para enviar emails!");
});

export async function enviarEmail(to: string, subject: string, html: string) {
  try {
    await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html
    });
    console.log("Email enviado para:", to);
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    throw new Error("Não foi possível enviar o email.");
  }
}

import { transporter, sender } from "@/lib/mail/transporter";

async function main() {
  const info = await transporter.sendMail({
    from: sender(),
    to: "test@mailtrap.io",
    subject: "Prueba SMTP EncuentroDeFe",
    text: "Si ves esto en Mailtrap, el correo funciona correctamente.",
    html: "<p>Si ves esto en <strong>Mailtrap</strong>, el correo funciona correctamente.</p>",
  });

  console.log("Correo enviado:", info.messageId);
}

main().catch((err) => {
  console.error("Error SMTP:", err);
  process.exit(1);
});

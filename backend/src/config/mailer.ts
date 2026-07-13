import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter;

export async function setupMailer() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (user && pass) {
    try {
      transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
      await transporter.verify();
      console.log(`✅ Mailer connected successfully to ${host}:${port}`);
      return transporter;
    } catch (error: any) {
      console.error(`❌ SMTP connection failed for ${host}:${port}. Details:`, error.message);
    }
  }

  // Ethereal Fallback for testing/debugging offline
  try {
    console.log("ℹ️ Standard SMTP settings not configured. Setting up test account on Ethereal...");
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    console.log(`ℹ️ Ethereal SMTP test account initialized: user=${testAccount.user}`);
  } catch (error: any) {
    console.error("❌ Failed to initiate fallback mail server:", error.message);
    // In-memory logging fallback if all SMTP services are unreachable
    transporter = {
      sendMail: async (options: any) => {
        console.log("\n================ [SIMULATED EMAIL LOG] ================");
        console.log(`From: ${options.from}`);
        console.log(`To: ${options.to}`);
        console.log(`Subject: ${options.subject}`);
        console.log(`Body: ${options.text || options.html}`);
        console.log("========================================================\n");
        return { messageId: `simulation_${Date.now()}` };
      }
    } as any;
  }

  return transporter;
}

export function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    throw new Error("Transporter has not been initialized. Please call setupMailer() first.");
  }
  return transporter;
}

import { Resend } from "resend";

let resend: Resend | null = null;

function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY || "");
  }
  return resend;
}

const FROM_EMAIL = process.env.EMAIL_FROM || "noreply@semecity.bj";
const APP_URL = process.env.APP_URL || "http://localhost:3000";

export async function sendVerificationEmail(
  email: string,
  token: string,
  name: string
) {
  const verifyUrl = `${APP_URL}/verifier-email?token=${token}`;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: "Vérifiez votre adresse email - Sèmè City",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Bienvenue sur Sèmè City, ${name} !</h2>
        <p>Merci de vous être inscrit(e). Veuillez vérifier votre adresse email en cliquant sur le lien ci-dessous :</p>
        <p style="margin: 24px 0;">
          <a href="${verifyUrl}" style="background-color: #14355A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Vérifier mon email
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">Ce lien expire dans 24 heures.</p>
        <p style="color: #666; font-size: 14px;">Si vous n'avez pas créé de compte, ignorez cet email.</p>
      </div>
    `,
  });
}

export async function sendInvitationEmail(
  email: string,
  token: string,
  inviterName: string,
  role: string,
  serviceName?: string
) {
  const inviteUrl = `${APP_URL}/invitation/${token}`;

  const roleLabels: Record<string, string> = {
    INTERVENANT: "Intervenant",
    RESPONSABLE_SERVICE: "Responsable de service",
    ADMIN: "Administrateur",
  };

  const roleLabel = roleLabels[role] || role;
  const serviceInfo = serviceName ? ` pour le service <strong>${serviceName}</strong>` : "";

  await getResend().emails.send({
    from: FROM_EMAIL,
    to: email,
    subject: `Invitation - Sèmè City`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Vous avez été invité(e) sur Sèmè City</h2>
        <p><strong>${inviterName}</strong> vous invite à rejoindre la plateforme en tant que <strong>${roleLabel}</strong>${serviceInfo}.</p>
        <p style="margin: 24px 0;">
          <a href="${inviteUrl}" style="background-color: #14355A; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
            Accepter l'invitation
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">Cette invitation expire dans 7 jours.</p>
        <p style="color: #666; font-size: 14px;">Si vous n'attendiez pas cette invitation, ignorez cet email.</p>
      </div>
    `,
  });
}

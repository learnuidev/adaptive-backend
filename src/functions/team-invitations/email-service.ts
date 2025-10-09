import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { TeamInvitation } from "adaptive.fyi";
import { apiConfig } from "../../constants/api-config.js";

const sesClient = new SESClient({
  region: apiConfig.region,
});

export interface EmailTemplate {
  toAddress: string;
  subject: string;
  htmlBody: string;
  textBody: string;
}

export class InvitationEmailService {
  private fromEmail: string;

  constructor() {
    this.fromEmail = apiConfig.fromEmailAddress;
  }

  /**
   * Generate invitation email content
   */
  private generateInvitationEmail(invitation: TeamInvitation): EmailTemplate {
    const acceptUrl = `${apiConfig.frontendUrl || "https://adaptive.fyi"}/team`;
    const expiryDate = new Date(invitation.expiresAt || "").toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

    const subject = `You're invited to join ${invitation.websiteId} on Adaptive`;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Team Invitation - Adaptive</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #4F46E5;
          }
          .content {
            margin-bottom: 30px;
          }
          .invitation-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
          }
          .role-badge {
            display: inline-block;
            background: #4F46E5;
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 500;
          }
          .cta-button {
            display: inline-block;
            background: #4F46E5;
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 500;
            margin: 20px 0;
          }
          .cta-button:hover {
            background: #4338CA;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 12px;
            color: #666;
          }
          .message-box {
            background: #f1f5f9;
            border-left: 4px solid #4F46E5;
            padding: 15px;
            margin: 20px 0;
            font-style: italic;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Adaptive</div>
        </div>
        
        <div class="content">
          <h1>You're Invited to Join a Team!</h1>
          
          <p>Hello,</p>
          
          <p>You've been invited to collaborate on <strong>${invitation.websiteId}</strong> using Adaptive Analytics.</p>
          
          <div class="invitation-card">
            <h3>Invitation Details:</h3>
            <ul>
              <li><strong>Website:</strong> ${invitation.websiteId}</li>
              <li><strong>Role:</strong> <span class="role-badge">${invitation.role}</span></li>
              <li><strong>Invited by:</strong> ${invitation.invitedBy}</li>
              <li><strong>Expires on:</strong> ${expiryDate}</li>
            </ul>
          </div>
          
          ${
            invitation.message
              ? `
            <div class="message-box">
              <strong>Personal message from ${invitation.invitedBy}:</strong><br>
              "${invitation.message}"
            </div>
          `
              : ""
          }
          
          <p>To accept this invitation and start collaborating, click the button below:</p>
          
          <a href="${acceptUrl}" class="cta-button">Accept Invitation</a>
          
          <p>If you can't click the button, you can also copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4F46E5;">${acceptUrl}</p>
          
          <p><strong>Note:</strong> This invitation will expire on ${expiryDate}.</p>
        </div>
        
        <div class="footer">
          <p>This is an automated email from Adaptive Analytics. If you didn't expect this invitation, you can safely ignore this email.</p>
          <p>Adaptive Analytics - Web Analytics & Team Collaboration</p>
        </div>
      </body>
      </html>
    `;

    const textBody = `
You're invited to join a team on Adaptive Analytics!

Hello,

You've been invited to collaborate on ${invitation.websiteId} using Adaptive Analytics.

Invitation Details:
- Website: ${invitation.websiteId}
- Role: ${invitation.role}
- Invited by: ${invitation.invitedBy}
- Expires on: ${expiryDate}

${invitation.message ? `\nPersonal message from ${invitation.invitedBy}:\n"${invitation.message}"\n` : ""}

To accept this invitation, visit: ${acceptUrl}

Note: This invitation will expire on ${expiryDate}.

This is an automated email from Adaptive Analytics. If you didn't expect this invitation, you can safely ignore this email.
    `;

    return {
      toAddress: invitation.email,
      subject,
      htmlBody,
      textBody,
    };
  }

  /**
   * Send invitation email
   */
  async sendInvitationEmail(invitation: TeamInvitation): Promise<void> {
    const emailContent = this.generateInvitationEmail(invitation);

    const params = {
      Source: this.fromEmail,
      Destination: {
        ToAddresses: [emailContent.toAddress],
      },
      Message: {
        Subject: {
          Data: emailContent.subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: emailContent.htmlBody,
            Charset: "UTF-8",
          },
          Text: {
            Data: emailContent.textBody,
            Charset: "UTF-8",
          },
        },
      },
    };

    try {
      const command = new SendEmailCommand(params);
      const result = await sesClient.send(command);

      console.log(`Invitation email sent successfully to ${invitation.email}`);
      console.log(`Message ID: ${result.MessageId}`);
    } catch (error: any) {
      console.error("Failed to send invitation email:", error);

      // Provide more specific error information
      if (error.name === "MessageRejected") {
        throw new Error(`Email rejected: ${error.message}`);
      } else if (error.name === "MailFromDomainNotVerified") {
        throw new Error("Sender email domain not verified in SES");
      } else if (error.name === "ConfigurationSetDoesNotExist") {
        throw new Error("SES configuration set not found");
      } else {
        throw new Error(`Failed to send email: ${error.message}`);
      }
    }
  }

  /**
   * Send invitation status update email (when invitation is accepted/rejected)
   */
  async sendInvitationStatusUpdateEmail(
    invitation: TeamInvitation,
    status: "accepted" | "rejected"
  ): Promise<void> {
    const subject =
      status === "accepted"
        ? `Invitation Accepted - ${invitation.email}`
        : `Invitation Declined - ${invitation.email}`;

    const htmlBody = `
      <h2>Invitation ${status === "accepted" ? "Accepted" : "Rejected"}</h2>
      <p>${invitation.email} has ${status} your invitation to join ${invitation.websiteId}.</p>
      <p>Role: ${invitation.role}</p>
      <p>Status: ${status.toUpperCase()}</p>
      ${status === "accepted" ? "<p>They now have access to the website with the assigned role.</p>" : ""}
    `;

    const textBody = `
Invitation ${status === "accepted" ? "Accepted" : "Rejected"}

${invitation.email} has ${status} your invitation to join ${invitation.websiteId}.

Role: ${invitation.role}
Status: ${status.toUpperCase()}
${status === "accepted" ? "They now have access to the website with the assigned role." : ""}
    `;

    const params = {
      Source: this.fromEmail,
      Destination: {
        ToAddresses: [invitation.invitedBy],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: "UTF-8",
          },
          Text: {
            Data: textBody,
            Charset: "UTF-8",
          },
        },
      },
    };

    try {
      const command = new SendEmailCommand(params);
      await sesClient.send(command);

      console.log(
        `Invitation status update email sent to ${invitation.invitedBy}`
      );
    } catch (error: any) {
      console.error("Failed to send status update email:", error);
      // Don't throw errors for status update emails to avoid failing the main flow
    }
  }
}

// Export singleton instance
export const emailService = new InvitationEmailService();

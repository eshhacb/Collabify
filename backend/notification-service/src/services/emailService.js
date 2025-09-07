import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter
const createTransporter = () => {
  // Gmail fallback if provided
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
  }

  // Generic SMTP
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false otherwise
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        }
      : undefined,
  });
};

// Normalize emails so "Name <email@domain>" or quoted addresses become just the raw address
const normalizeEmail = (input) => {
  if (!input) return '';
  let s = String(input).trim();
  const angle = s.match(/<([^>]+)>/);
  if (angle) s = angle[1];
  s = s.replace(/^["']+|["']+$/g, '');
  return s;
};

// Email template for invitation
const createInvitationEmailTemplate = (invitation, acceptUrl) => {
  const roleText = invitation.role === 'editor' ? 'edit' : 'view';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Document Invitation - Collabify</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        .warning { background: #FEF3C7; border: 1px solid #F59E0B; padding: 15px; border-radius: 6px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📄 Document Invitation</h1>
        </div>
        <div class="content">
          <h2>Hello!</h2>
          <p><strong>${invitation.invitedByName}</strong> has invited you to ${roleText} the document:</p>
          
          <div style="background: white; padding: 20px; border-radius: 6px; border-left: 4px solid #4F46E5; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #4F46E5;">${invitation.documentTitle}</h3>
            <p style="margin: 0; color: #666;">Role: <strong>${invitation.role}</strong></p>
          </div>
          
          <p>Click the button below to accept this invitation and start collaborating:</p>
          
          <div style="text-align: center;">
            <a href="${acceptUrl}" class="button">Accept Invitation</a>
          </div>
          
          <div class="warning">
            <strong>⚠️ Important:</strong> This invitation will expire in 7 days. If you don't have an account, you'll be able to create one when you accept the invitation.
          </div>
          
          <p>If the button doesn't work, you can copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #4F46E5;">${acceptUrl}</p>
        </div>
        <div class="footer">
          <p>This invitation was sent from Collabify - Your collaborative document platform</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Send invitation email
export const sendInvitationEmail = async (invitation, acceptUrl) => {
  try {
    // Check if SMTP is configured
    // If neither SMTP nor Gmail is configured, log dev output
    const smtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
    const gmailConfigured = process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD;
    if (!smtpConfigured && !gmailConfigured) {
      console.log('SMTP not configured, logging invitation details for development:');
      console.log('=== INVITATION EMAIL (Development Mode) ===');
      console.log(`To: ${invitation.email}`);
      console.log(`Subject: You've been invited to collaborate on "${invitation.documentTitle}"`);
      console.log(`Accept URL: ${acceptUrl}`);
      console.log('=== END INVITATION EMAIL ===');
      return { success: true, messageId: 'dev-mode-' + Date.now() };
    }

    const transporter = createTransporter();
    
    const fromAddress = process.env.SMTP_USER || process.env.GMAIL_USER;
    const mailOptions = {
      from: `"Collabify" <${fromAddress}>`,
      to: normalizeEmail(invitation.email),
      subject: `You've been invited to collaborate on "${invitation.documentTitle}"`,
      html: createInvitationEmailTemplate(invitation, acceptUrl),
      text: `
        Hello!
        
        ${invitation.invitedByName} has invited you to ${invitation.role} the document: ${invitation.documentTitle}
        
        Click this link to accept the invitation: ${acceptUrl}
        
        This invitation will expire in 7 days. If you don't have an account, you'll be able to create one when you accept the invitation.
        
        Best regards,
        The Collabify Team
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Invitation email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending invitation email:', error);
    throw new Error(`Failed to send invitation email: ${error.message}`);
  }
};

// Test email configuration
export const testEmailConfiguration = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration is valid');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
};

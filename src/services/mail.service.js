const nodemailer = require('nodemailer');
const MailLog = require('../models/MailLog');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Brevo SMTP Password
  },
});

const getBaseFrontendUrl = () => {
  const envUrl = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.trim() : '';
  if (envUrl && !envUrl.includes('localhost')) {
    return envUrl.replace(/\/$/, '');
  }
  return 'https://capstone.jaswanthnarne.online';
};

/**
 * Send credentials to Team Lead
 */
const sendTLCredentials = async (email, username, password, projectName) => {
  const loginLink = `${getBaseFrontendUrl()}/login`;
  const subject = `Welcome to Ethnotech ProjectSpace — Team Lead Account Created`;

  const mailOptions = {
    from: `"Ethnotech ProjectSpace" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@capstonehub.dev'}>`,
    to: email,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 24px; }
          .card { background-color: #ffffff; border-radius: 16px; max-width: 520px; margin: 0 auto; padding: 36px; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05); border: 1px solid #e2e8f0; }
          .header { text-align: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }
          .logo { font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; text-decoration: none; }
          h2 { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
          p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0; }
          .btn-container { text-align: center; margin: 24px 0; }
          .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 28px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px; text-align: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
          .credentials { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 18px; margin: 20px 0; }
          .credentials-item { margin: 8px 0; font-size: 14px; font-family: monospace; color: #0f172a; }
          .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <span class="logo">Ethnotech ProjectSpace</span>
          </div>
          <h2>Welcome to your workspace!</h2>
          <p>An administrator has created a <strong>Team Lead</strong> account for you in the Capstone Project: <strong>${projectName}</strong>.</p>
          <p>Below are your generated credentials. Please keep them secure:</p>
          
          <div class="credentials">
            <div class="credentials-item"><strong>Username/LeadUsername:</strong> ${username}</div>
            <div class="credentials-item"><strong>Password:</strong> ${password}</div>
          </div>
          
          <div class="btn-container">
            <a href="${loginLink}" target="_blank" class="btn">Sign In to Portal</a>
          </div>
          
          <p style="font-size: 11px; color: #94a3b8; margin-top: 20px;">
            If the button above does not work, copy and paste this link in your browser:<br/>
            <a href="${loginLink}" style="color: #2563eb;">${loginLink}</a>
          </p>
          
          <div class="footer">
            © ${new Date().getFullYear()} Ethnotech ProjectSpace. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    if (process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`✉️ Email sent successfully to Team Lead: ${email}`);
      await MailLog.create({
        to: email,
        subject,
        type: 'tl_credentials',
        status: 'sent',
        metadata: { username, projectName }
      }).catch(e => console.error('MailLog save error:', e));
    } else {
      throw new Error('SMTP_PASS not configured');
    }
  } catch (err) {
    console.error("❌ Nodemailer sendTLCredentials error details:", err);
    await MailLog.create({
      to: email,
      subject,
      type: 'tl_credentials',
      status: 'failed',
      error: err.message || 'SMTP delivery error',
      metadata: { username, projectName }
    }).catch(e => console.error('MailLog save error:', e));
  }
};

/**
 * Send invitation to Team Member
 */
const sendMemberInvitation = async (email, name, teamName, projectName, acceptLink) => {
  const subject = `Invitation to Join Team: ${teamName}`;
  const mailOptions = {
    from: `"Ethnotech ProjectSpace" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@capstonehub.dev'}>`,
    to: email,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 24px; }
          .card { background-color: #ffffff; border-radius: 16px; max-width: 520px; margin: 0 auto; padding: 36px; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05); border: 1px solid #e2e8f0; }
          .header { text-align: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }
          .logo { font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; text-decoration: none; }
          h2 { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
          p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0; }
          .btn-container { text-align: center; margin: 24px 0; }
          .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 28px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px; text-align: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
          .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <span class="logo">Ethnotech ProjectSpace</span>
          </div>
          <h2>Hello ${name},</h2>
          <p>You have been invited to join the team <strong>${teamName}</strong> for the Capstone Project: <strong>${projectName}</strong>.</p>
          <p>Click the button below to accept the invitation and join your team in the portal:</p>
          
          <div class="btn-container">
            <a href="${acceptLink}" target="_blank" class="btn">Accept Invitation</a>
          </div>
          
          <p style="font-size: 11px; color: #94a3b8; margin-top: 20px;">
            If the button above does not work, copy and paste this link in your browser:<br/>
            <a href="${acceptLink}" style="color: #2563eb;">${acceptLink}</a>
          </p>
          
          <div class="footer">
            © ${new Date().getFullYear()} Ethnotech ProjectSpace. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    if (process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`✉️ Invitation email sent successfully to: ${email}`);
      await MailLog.create({
        to: email,
        subject,
        type: 'member_invitation',
        status: 'sent',
        metadata: { name, teamName, projectName }
      }).catch(e => console.error('MailLog save error:', e));
    } else {
      throw new Error('SMTP_PASS not configured');
    }
  } catch (err) {
    console.error("❌ Nodemailer sendMemberInvitation error details:", err);
    await MailLog.create({
      to: email,
      subject,
      type: 'member_invitation',
      status: 'failed',
      error: err.message || 'SMTP delivery error',
      metadata: { name, teamName, projectName }
    }).catch(e => console.error('MailLog save error:', e));
  }
};

/**
 * Send password reset link to user
 */
const sendPasswordResetEmail = async (email, name, resetLink) => {
  const subject = `Reset Your Password - Ethnotech ProjectSpace`;
  const mailOptions = {
    from: `"Ethnotech ProjectSpace" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@capstonehub.dev'}>`,
    to: email,
    subject: subject,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #334155; margin: 0; padding: 24px; }
          .card { background-color: #ffffff; border-radius: 16px; max-width: 520px; margin: 0 auto; padding: 36px; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05); border: 1px solid #e2e8f0; }
          .header { text-align: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 20px; margin-bottom: 24px; }
          .logo { font-size: 24px; font-weight: 800; color: #2563eb; letter-spacing: -0.5px; text-decoration: none; }
          h2 { font-size: 20px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px; }
          p { font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0; }
          .btn-container { text-align: center; margin: 24px 0; }
          .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 28px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px; text-align: center; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2); }
          .footer { text-align: center; font-size: 11px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <span class="logo">Ethnotech ProjectSpace</span>
          </div>
          <h2>Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>We received a request to reset the password for your Ethnotech ProjectSpace account. Click the button below to choose a new password:</p>
          
          <div class="btn-container">
            <a href="${resetLink}" target="_blank" class="btn">Reset Password</a>
          </div>
          
          <p>This password reset link will expire in 1 hour. If you did not request a password reset, please ignore this email.</p>
          
          <p style="font-size: 11px; color: #94a3b8; margin-top: 20px;">
            If the button above does not work, copy and paste this link in your browser:<br/>
            <a href="${resetLink}" style="color: #2563eb;">${resetLink}</a>
          </p>
          
          <div class="footer">
            © ${new Date().getFullYear()} Ethnotech ProjectSpace. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `,
  };

  try {
    if (process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`✉️ Password reset email sent successfully to: ${email}`);
      await MailLog.create({
        to: email,
        subject,
        type: 'password_reset',
        status: 'sent',
        metadata: { name }
      }).catch(e => console.error('MailLog save error:', e));
    } else {
      throw new Error('SMTP_PASS not configured');
    }
  } catch (err) {
    console.error("❌ Nodemailer sendPasswordResetEmail error:", err);
    await MailLog.create({
      to: email,
      subject,
      type: 'password_reset',
      status: 'failed',
      error: err.message || 'SMTP delivery error',
      metadata: { name }
    }).catch(e => console.error('MailLog save error:', e));
  }
};

module.exports = { sendTLCredentials, sendMemberInvitation, sendPasswordResetEmail, getBaseFrontendUrl };


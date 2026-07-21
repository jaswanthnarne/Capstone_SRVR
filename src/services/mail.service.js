const nodemailer = require('nodemailer');
const MailLog = require('../models/MailLog');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
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
 * Send credentials to Team Lead with redesigned template
 */
const sendTLCredentials = async (email, username, password, projectName, teamName = '') => {
  const loginLink = `${getBaseFrontendUrl()}/login`;
  const displayTeam = teamName || username;
  const subject = `🚀 Welcome to Ethnotech ProjectSpace — Account Credentials for ${displayTeam}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; background-color: #0b0f19; color: #e2e8f0; margin: 0; padding: 32px 16px; }
        .wrapper { max-width: 560px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .banner { background: linear-gradient(135deg, #2563eb, #7c3aed); padding: 36px 28px; text-align: center; }
        .banner h1 { margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.02em; }
        .banner p { margin: 8px 0 0; font-size: 13px; color: rgba(255,255,255,0.85); text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600; }
        .content { padding: 32px 28px; }
        .greeting { font-size: 18px; font-weight: 700; color: #f8fafc; margin: 0 0 12px; }
        .text { font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 20px; }
        .cred-box { background: #090d16; border: 1px solid #2563eb; border-radius: 14px; padding: 20px; margin: 24px 0; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5); }
        .cred-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.2px; color: #3b82f6; margin-bottom: 12px; }
        .cred-row { display: flex; justify-content: space-between; font-size: 14px; padding: 6px 0; border-bottom: 1px solid #1e293b; }
        .cred-row:last-child { border-bottom: none; }
        .cred-label { color: #64748b; font-weight: 600; }
        .cred-val { color: #38bdf8; font-family: 'Courier New', monospace; font-weight: 700; }
        .btn-wrap { text-align: center; margin: 32px 0 20px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #ffffff !important; padding: 14px 36px; font-size: 15px; font-weight: 700; text-decoration: none; border-radius: 12px; box-shadow: 0 8px 20px rgba(37,99,235,0.35); text-transform: uppercase; letter-spacing: 0.5px; }
        .footer { text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1e293b; padding: 20px 28px; background: #0d1322; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="banner">
          <h1>Ethnotech ProjectSpace</h1>
          <p>Capstone Team Credentials</p>
        </div>
        <div class="content">
          <div class="greeting">Hello Team Lead 👋</div>
          <p class="text">Your account for <strong>${displayTeam}</strong> in <strong>${projectName}</strong> has been configured by the course administration. Below are your official login credentials:</p>
          
          <div class="cred-box">
            <div class="cred-title">🔑 Access Credentials</div>
            <div class="cred-row"><span class="cred-label">Team Name:</span><span class="cred-val">${displayTeam}</span></div>
            <div class="cred-row"><span class="cred-label">Lead Username:</span><span class="cred-val">${username}</span></div>
            <div class="cred-row"><span class="cred-label">Portal URL:</span><span class="cred-val">https://capstone.jaswanthnarne.online</span></div>
          </div>
          
          <div class="btn-wrap">
            <a href="${loginLink}" target="_blank" class="btn">Access Team Workspace</a>
          </div>
          
          <p class="text" style="font-size: 12px; text-align: center; margin-top: 24px;">
            Direct Link: <a href="${loginLink}" style="color: #38bdf8;">${loginLink}</a>
          </p>
        </div>
        <div class="footer">
          © ${new Date().getFullYear()} Ethnotech Capstone Project Management System.<br/>All rights reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"Ethnotech ProjectSpace" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@capstonehub.dev'}>`,
    to: email,
    subject: subject,
    html: htmlContent,
  };

  try {
    if (process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`✉️ Credentials email sent successfully to: ${email}`);
      await MailLog.create({
        to: email,
        subject,
        type: 'tl_credentials',
        status: 'sent',
        metadata: { username, teamName: displayTeam, projectName }
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
      metadata: { username, teamName: displayTeam, projectName }
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
          body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #e2e8f0; margin: 0; padding: 24px; }
          .card { background-color: #131b2e; border-radius: 16px; max-width: 520px; margin: 0 auto; padding: 36px; border: 1px solid #1e293b; }
          .logo { font-size: 24px; font-weight: 800; color: #3b82f6; text-decoration: none; }
          h2 { font-size: 20px; font-weight: 700; color: #f8fafc; }
          p { font-size: 14px; line-height: 1.6; color: #94a3b8; }
          .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 28px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">Ethnotech ProjectSpace</div>
          <h2>Hello ${name},</h2>
          <p>You have been invited to join the team <strong>${teamName}</strong> for Capstone Project: <strong>${projectName}</strong>.</p>
          <p><a href="${acceptLink}" target="_blank" class="btn">Accept Team Invitation</a></p>
          <p style="font-size: 11px; color: #64748b; margin-top: 20px;">Link: <a href="${acceptLink}" style="color: #38bdf8;">${acceptLink}</a></p>
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
    console.error("❌ Nodemailer sendMemberInvitation error:", err);
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
          body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #e2e8f0; margin: 0; padding: 24px; }
          .card { background-color: #131b2e; border-radius: 16px; max-width: 520px; margin: 0 auto; padding: 36px; border: 1px solid #1e293b; }
          .logo { font-size: 24px; font-weight: 800; color: #3b82f6; text-decoration: none; }
          h2 { font-size: 20px; font-weight: 700; color: #f8fafc; }
          p { font-size: 14px; line-height: 1.6; color: #94a3b8; }
          .btn { display: inline-block; background-color: #2563eb; color: #ffffff !important; padding: 12px 28px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 10px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="logo">Ethnotech ProjectSpace</div>
          <h2>Password Reset Request</h2>
          <p>Hello ${name},</p>
          <p>We received a request to reset your password. Click the button below to update your credentials:</p>
          <p><a href="${resetLink}" target="_blank" class="btn">Reset Password</a></p>
          <p style="font-size: 11px; color: #64748b; margin-top: 20px;">Link: <a href="${resetLink}" style="color: #38bdf8;">${resetLink}</a></p>
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

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // Brevo SMTP Password
  },
});

/**
 * Send credentials to Team Lead
 */
const sendTLCredentials = async (email, username, password, projectName) => {
  const mailOptions = {
    from: `"CapstoneHub" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@capstonehub.dev'}>`,
    to: email,
    subject: `Welcome to CapstoneHub — Team Lead Account Created`,
    html: `
      <h2>Welcome to CapstoneHub!</h2>
      <p>An admin has created a Team Lead account for you in the Capstone Project: <strong>${projectName}</strong>.</p>
      <p>Here are your login credentials:</p>
      <ul>
        <li><strong>Username:</strong> ${username}</li>
        <li><strong>Password:</strong> ${password}</li>
      </ul>
      <p>Log in at: <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login">${process.env.FRONTEND_URL || 'http://localhost:5173'}/login</a></p>
    `,
  };

  try {
    if (process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`✉️ Email sent successfully to Team Lead: ${email}`);
    } else {
      throw new Error('SMTP_PASS not configured');
    }
  } catch (err) {
    console.error("❌ Nodemailer sendTLCredentials error details:", err);
    console.log(`\n⚠️ [MAIL FALLBACK] Failed to send email via SMTP. Please note the credentials below:`);
    console.log(`   To: ${email}`);
    console.log(`   Username/LeadUsername: ${username}`);
    console.log(`   Password: ${password}`);
    console.log(`   Project: ${projectName}\n`);
  }
};

/**
 * Send invitation to Team Member
 */
const sendMemberInvitation = async (email, name, teamName, projectName, acceptLink) => {
  const mailOptions = {
    from: `"CapstoneHub" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@capstonehub.dev'}>`,
    to: email,
    subject: `Invitation to Join Team: ${teamName}`,
    html: `
      <h2>Hello ${name},</h2>
      <p>You have been invited to join the team <strong>${teamName}</strong> for the Capstone Project: <strong>${projectName}</strong>.</p>
      <p>Click the link below to accept the invitation and join the team:</p>
      <p><a href="${acceptLink}" style="background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a></p>
      <p>Or copy this link to your browser:</p>
      <p>${acceptLink}</p>
    `,
  };

  try {
    if (process.env.SMTP_PASS) {
      await transporter.sendMail(mailOptions);
      console.log(`✉️ Invitation email sent successfully to: ${email}`);
    } else {
      throw new Error('SMTP_PASS not configured');
    }
  } catch (err) {
    console.error("❌ Nodemailer sendMemberInvitation error details:", err);
    console.log(`\n⚠️ [MAIL FALLBACK] Failed to send invitation email via SMTP. Please note the link below:`);
    console.log(`   To: ${email}`);
    console.log(`   Link: ${acceptLink}\n`);
  }
};

module.exports = { sendTLCredentials, sendMemberInvitation };

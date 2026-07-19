require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sendTLCredentials } = require('../services/mail.service');

async function testMails() {
  console.log("🚀 Testing Email Dispatch via Brevo SMTP...");
  console.log("SMTP HOST:", process.env.SMTP_HOST);
  console.log("SMTP USER:", process.env.SMTP_USER);
  console.log("SMTP FROM:", process.env.SMTP_FROM);

  try {
    console.log("\n✉️ Sending test mail to: jaswanthnarne35@gmail.com ...");
    await sendTLCredentials('jaswanthnarne35@gmail.com', 'Team_01 (Test)', 'Mits@3!', 'Java Full Stack Development');
    console.log("✅ Mail 1 finished.");

    console.log("\n✉️ Sending test mail to: jaswanthnarne25@gmail.com ...");
    await sendTLCredentials('jaswanthnarne25@gmail.com', 'Team_01 (Test)', 'Mits@3!', 'Java Full Stack Development');
    console.log("✅ Mail 2 finished.");
  } catch (err) {
    console.error("❌ Test mail failed:", err);
  }
  process.exit(0);
}

testMails();

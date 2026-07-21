require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Team = require('../models/Team');
const Batch = require('../models/Batch');
const { sendTLCredentials } = require('../services/mail.service');

async function runBulkResend() {
  console.log("🚀 Starting Bulk Operation: Updating Team Statuses & Resending Welcome Emails...");
  try {
    // 1. Connect to MongoDB Atlas
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 });
    console.log(`✅ Connected to MongoDB Atlas: ${mongoose.connection.host}`);

    // 2. Update all teams in database to 'in_progress'
    const statusUpdateResult = await Team.updateMany({}, { status: 'in_progress' });
    console.log(`✨ Status updated to 'in_progress' for ${statusUpdateResult.modifiedCount} teams!`);

    // 3. Fetch all teams
    const teams = await Team.find().populate('batchId', 'name');
    console.log(`📋 Found ${teams.length} teams in database. Preparing email dispatches...`);

    let sent = 0;
    let failed = 0;

    // 4. Iterate over every single team and send credentials
    for (let i = 0; i < teams.length; i++) {
      const team = teams[i];
      const targetEmail = team.email || (team.members && team.members[0] && team.members[0].email);
      
      if (!targetEmail) {
        console.log(`[${i + 1}/${teams.length}] ⚠️ Team "${team.name}" has no email configured. Skipping.`);
        failed++;
        continue;
      }

      console.log(`[${i + 1}/${teams.length}] ✉️ Sending welcome email to ${team.name} (${targetEmail})...`);
      try {
        await sendTLCredentials(
          targetEmail,
          team.leadUsername,
          'Eth@dm!n#56',
          team.batchId?.name || 'Ethnotech Capstone Project',
          team.name
        );
        sent++;
      } catch (err) {
        console.error(`[${i + 1}/${teams.length}] ❌ Failed for ${team.name}: ${err.message}`);
        failed++;
      }
    }

    console.log("\n==================================================");
    console.log(`🎉 BULK RESEND COMPLETE!`);
    console.log(`- Total Teams: ${teams.length}`);
    console.log(`- Status Updated to 'in_progress': ${statusUpdateResult.modifiedCount}`);
    console.log(`- Welcome Emails Dispatched: ${sent}`);
    console.log(`- Failed/Skipped: ${failed}`);
    console.log("==================================================");

    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal script error:", error);
    process.exit(1);
  }
}

runBulkResend();

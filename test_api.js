const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Team = require('./src/models/Team');
const College = require('./src/models/College');
const Subject = require('./src/models/Subject');
const Batch = require('./src/models/Batch');
const ProblemStatement = require('./src/models/ProblemStatement');
const ProblemLock = require('./src/models/ProblemLock');

// Import controller directly to invoke it with mock req/res
const { getAvailableProblems } = require('./src/controllers/problem.controller');

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to database");

    const team = await Team.findOne({ leadUsername: "leadalpha" }).populate('batchId');
    if (!team) {
      console.error("Team leadalpha not found");
      return;
    }

    console.log("Team batch details:", team.batchId);

    // Mock request
    const req = {
      user: {
        id: team._id.toString(),
        role: 'teamlead',
        teamId: team._id.toString(),
        batchId: team.batchId ? team.batchId._id.toString() : null,
        name: team.leadUsername
      }
    };

    // Mock response
    const res = {
      statusCode: 200,
      json(data) {
        console.log("API Response (Status:", this.statusCode, "):");
        console.log(JSON.stringify(data, null, 2));
      },
      status(code) {
        this.statusCode = code;
        return this;
      }
    };

    await getAvailableProblems(req, res);

  } catch (err) {
    console.error("Error during test:", err);
  } finally {
    await mongoose.disconnect();
  }
}

test();

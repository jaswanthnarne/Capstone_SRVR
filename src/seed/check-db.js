require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Trainer = require('../models/Trainer');
const College = require('../models/College');
const Subject = require('../models/Subject');
const Batch = require('../models/Batch');
const Team = require('../models/Team');

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('--- DATABASE DIAGNOSTIC REPORT ---');
  
  const trainers = await Trainer.find();
  console.log(`Trainers: ${trainers.length}`);
  trainers.forEach(t => console.log(`  - ID: ${t._id}, Email: ${t.email}, Name: ${t.name}`));

  const colleges = await College.find();
  console.log(`Colleges: ${colleges.length}`);
  colleges.forEach(c => console.log(`  - ID: ${c._id}, Name: ${c.name}, TrainerId: ${c.trainerId}`));

  const batches = await Batch.find();
  console.log(`Batches/Projects: ${batches.length}`);
  batches.forEach(b => console.log(`  - ID: ${b._id}, Name: ${b.name}, TrainerId: ${b.trainerId}, CollegeId: ${b.collegeId}`));

  const teams = await Team.find();
  console.log(`Teams: ${teams.length}`);
  teams.forEach(t => console.log(`  - ID: ${t._id}, Name: ${t.name}, Lead: ${t.leadUsername}, Email: ${t.email}, BatchId: ${t.batchId}`));

  await mongoose.disconnect();
}

run().catch(console.error);

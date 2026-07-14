require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Trainer = require('../models/Trainer');
const College = require('../models/College');
const Subject = require('../models/Subject');
const Batch = require('../models/Batch');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  // Find trainer
  const trainer = await Trainer.findOne({ email: 'trainer@capstonehub.dev' });
  if (!trainer) {
    console.error('Trainer not found. Please run seed script first.');
    await mongoose.disconnect();
    return;
  }

  // Find subject
  const subject = await Subject.findOne();
  if (!subject) {
    console.error('Subject not found. Please run seed script first.');
    await mongoose.disconnect();
    return;
  }

  console.log(`Using Trainer: ${trainer.name} (${trainer._id})`);
  console.log(`Using Subject: ${subject.name} (${subject._id})`);

  // Create college
  const name = 'Test College ' + Date.now();
  const college = await College.create({
    name,
    location: 'Hyderabad',
    trainerId: trainer._id
  });
  console.log(`Created College: ${college.name} (${college._id})`);

  // Create batch
  const batchName = 'Test Batch ' + Date.now();
  const batch = await Batch.create({
    name: batchName,
    collegeId: college._id,
    subjectId: subject._id,
    trainerId: trainer._id,
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    minMembers: 3,
    maxMembers: 5
  });
  console.log(`Created Batch: ${batch.name} (${batch._id})`);

  // Verification query
  const foundCollege = await College.findById(college._id);
  const foundBatch = await Batch.findById(batch._id);

  if (foundCollege && foundBatch && foundBatch.minMembers === 3 && foundBatch.maxMembers === 5) {
    console.log('✅ PERSISTENCE VERIFIED SUCCESSFULLY!');
    // Clean up test records
    await College.findByIdAndDelete(college._id);
    await Batch.findByIdAndDelete(batch._id);
    console.log('Cleaned up test records');
  } else {
    console.error('❌ PERSISTENCE FAILURE: Records were not saved or retrieved correctly.');
  }

  await mongoose.disconnect();
}

test().catch(console.error);

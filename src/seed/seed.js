require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Trainer = require('../models/Trainer');
const College = require('../models/College');
const Subject = require('../models/Subject');
const Batch = require('../models/Batch');
const ProblemStatement = require('../models/ProblemStatement');
const Team = require('../models/Team');
const ProblemLock = require('../models/ProblemLock');
const Milestone = require('../models/Milestone');
const Submission = require('../models/Submission');
const Evaluation = require('../models/Evaluation');

// ─── PASTE YOUR 20 PROBLEM STATEMENTS HERE ───────────────────────────────────
// Replace the array below with your actual problem statements.
// Each object should match the ProblemStatement schema.
const JAVA_FULL_STACK_PROBLEMS = [
  {
    title: 'TiffinHub – Local Home Chef & Cloud Kitchen Marketplace',
    problemStatement: 'Home chefs and small cloud kitchens in a locality have no unified digital platform to reach nearby customers, forcing them to rely on word-of-mouth or expensive third-party food apps.',
    description: 'Local home-based food vendors often cook fresh, quality meals but lack visibility. Customers looking for daily tiffin services or home-style food have no easy way to discover, compare, and subscribe to vendors near them. Vendors also struggle to manage daily menu changes and predict demand.',
    expectedOutput: 'A web application where vendors can list daily/weekly menus, manage subscription plans (weekly/monthly), and customers can browse nearby vendors, subscribe, and place one-time or recurring orders. Admin panel to onboard/verify vendors.',
    outcome: 'Students learn subscription-billing logic, recurring order scheduling, geolocation-based filtering, and multi-role dashboard design — a real SaaS-style commerce flow.',
    suggestedTech: ['Spring Boot', 'Spring Security (JWT)', 'Spring Data JPA', 'MySQL/PostgreSQL', 'React.js', 'Axios', 'Tailwind CSS', 'Leaflet.js', 'Cloudinary'],
    difficulty: 'advanced',
    tags: ['SaaS', 'Marketplace', 'Subscription', 'Food'],
  },
  {
    title: 'PawCare – Pet Grooming, Boarding & Vet Booking Platform',
    problemStatement: 'Pet owners struggle to find verified, nearby pet care professionals (groomers, boarders, walkers, vets) and have no centralized way to track their pet\'s service and medical history.',
    description: 'Pet services are highly fragmented and locally advertised. There\'s no platform combining service booking with a persistent pet health/service record, making it hard for owners to track vaccination schedules or past grooming/boarding history.',
    expectedOutput: 'A platform where pet owners create pet profiles (breed, age, medical/vaccination history), search and book verified service providers by pet type and service, and view booking history. Providers manage their availability and service catalogue.',
    outcome: 'Students implement profile-based matching logic, calendar/availability management, and structured medical-history data modeling — good practice in relational schema design for one-to-many entities.',
    suggestedTech: ['Spring Boot', 'Spring Security', 'Spring Data JPA', 'MySQL', 'React.js', 'Redux/Context API', 'JavaMail API', 'Cloudinary'],
    difficulty: 'intermediate',
    tags: ['Pet Care', 'Booking', 'Calendar', 'Notifications'],
  },
  {
    title: 'FixItLocal – On-Demand Local Service Marketplace',
    problemStatement: 'Residents needing quick local services (electricians, plumbers, cleaners, tutors) have no reliable, verified platform to find and book professionals near them on short notice.',
    description: 'Most service discovery still happens informally, leading to trust issues, inconsistent pricing, and no accountability. Service providers, especially small independent workers, lack a digital storefront.',
    expectedOutput: 'A platform with provider profiles (skills, ratings, availability), customer service requests with urgency levels, real-time booking, and a review/rating system after service completion.',
    outcome: 'Students build a two-sided marketplace with matching logic based on skill + proximity + availability, along with a trust-building rating system — core patterns used in real gig-economy platforms.',
    suggestedTech: ['Spring Boot', 'Spring Security (JWT)', 'MySQL/PostgreSQL', 'WebSocket (STOMP)', 'React.js', 'Tailwind CSS', 'Haversine formula'],
    difficulty: 'intermediate',
    tags: ['Marketplace', 'Real-time', 'Geolocation', 'Gig Economy'],
  },
  {
    title: 'StockSync – Inventory & Order Management System for SMBs',
    problemStatement: 'Small businesses often manage inventory and orders manually, leading to stockouts, overstocking, and lost sales due to lack of real-time visibility.',
    description: 'Without a proper system, business owners can\'t track stock levels accurately, get low-stock alerts, or analyze which products sell best. This directly impacts profitability and operational efficiency.',
    expectedOutput: 'A system for business owners to manage product catalogues, track stock levels in real time, receive low-stock alerts, process customer/supplier orders, and view sales analytics dashboards.',
    outcome: 'Students build real transactional business logic (stock deduction on order, threshold-based alerting) and data visualization — highly transferable to real backend/ERP-style roles.',
    suggestedTech: ['Spring Boot', 'Spring Data JPA', 'Spring Security', 'MySQL/PostgreSQL', 'React.js', 'Recharts/Chart.js', 'Spring @Scheduled', 'Apache POI'],
    difficulty: 'intermediate',
    tags: ['Inventory', 'SaaS', 'B2B', 'Analytics'],
  },
  {
    title: 'HomeFind – Property Listing & Discovery Platform',
    problemStatement: 'Property seekers struggle to filter genuinely relevant listings from cluttered classifieds, while individual sellers/agents lack an easy way to list and manage properties without going through expensive brokers.',
    description: 'Real estate search is often dominated by outdated listings, poor filtering, and no verification. Buyers waste time on irrelevant results; sellers/agents have no simple listing management tool.',
    expectedOutput: 'A platform where sellers/agents list properties with details, images, and pricing; buyers search using advanced filters (location, price range, BHK, amenities); includes a shortlist/wishlist feature and inquiry system.',
    outcome: 'Students implement advanced multi-filter search queries, image-heavy data handling, and inquiry/lead management — solid practice in query optimization and cloud storage integration.',
    suggestedTech: ['Spring Boot', 'Spring Data JPA (Specification API)', 'MySQL/PostgreSQL', 'React.js', 'React Query', 'Cloudinary', 'Elasticsearch'],
    difficulty: 'advanced',
    tags: ['Real Estate', 'Search', 'Filtering', 'Cloud Storage'],
  },
  {
    title: 'SpaceBook – Coworking & Study Space Booking System',
    problemStatement: 'Coworking and study space owners lack a digital system to manage seat-level bookings and prevent double allocation, while users have no easy way to check real-time seat availability.',
    description: 'Manual booking leads to overbooking, wasted capacity, and poor user experience. Space owners also can\'t easily analyze usage patterns to optimize pricing.',
    expectedOutput: 'A system showing real-time seat/room availability by time slot, allowing users to book hourly/daily passes, with auto-cancellation for no-shows and an owner dashboard for occupancy analytics.',
    outcome: 'Students solve real-time availability and double-booking prevention — a concurrency-handling problem (locking/transaction isolation) that\'s genuinely instructive.',
    suggestedTech: ['Spring Boot', 'Spring Data JPA', 'Pessimistic/Optimistic Locking', 'MySQL/PostgreSQL', 'React.js', 'FullCalendar.io', 'Spring @Scheduled'],
    difficulty: 'advanced',
    tags: ['Booking', 'Concurrency', 'Calendar', 'SaaS'],
  },
  {
    title: 'QuickCart – Multi-Store Grocery Delivery Platform',
    problemStatement: 'Local grocery/kirana stores lack an online ordering and delivery system, losing customers to large delivery apps, while customers can\'t easily compare and order from multiple nearby stores in one place.',
    description: 'Small stores can\'t individually build tech infrastructure. Customers want convenience but also want to support local stores if given an easy option. Order routing to the correct nearest store with stock availability is a real operational challenge.',
    expectedOutput: 'A platform listing multiple local stores with live inventory, allowing customers to order from the nearest store with items in stock, track order status, and a delivery partner interface for order fulfillment.',
    outcome: 'Students tackle order-routing logic (nearest store + stock availability), multi-actor order state management (store, customer, delivery partner), and real-time status tracking.',
    suggestedTech: ['Spring Boot', 'Spring Security (JWT)', 'MySQL/PostgreSQL', 'WebSocket', 'React.js', 'Redux Toolkit', 'Google Maps API'],
    difficulty: 'advanced',
    tags: ['Delivery', 'Marketplace', 'Order Routing', 'Real-time'],
  },
  {
    title: 'EventEase – Wedding & Event Vendor Booking Platform',
    problemStatement: 'Event planning involves coordinating multiple vendors separately, with no unified platform to compare, bundle, and book them together.',
    description: 'Customers spend significant time individually contacting and negotiating with vendors, and have no easy way to see combined cost or check vendor availability against their event date.',
    expectedOutput: 'A platform where vendors list services/packages, customers build a custom event bundle by picking vendors across categories, see auto-calculated total cost, and check date-wise availability for each vendor.',
    outcome: 'Students build a "package builder" — a cart-like system spanning multiple independent vendors with combined pricing and availability constraints, a nontrivial data-aggregation problem.',
    suggestedTech: ['Spring Boot', 'Spring Data JPA', 'MySQL/PostgreSQL', 'React.js', 'Context API/Redux', 'FullCalendar.io'],
    difficulty: 'intermediate',
    tags: ['Event Management', 'Marketplace', 'Package Builder', 'Calendar'],
  },
  {
    title: 'PlayBook – Sports Turf & Ground Booking Platform',
    problemStatement: 'Local turf/ground owners manage bookings manually via phone calls, leading to slot conflicts, while players/teams have no visibility into real-time availability or a way to split costs among teammates.',
    description: 'Peak-hour demand isn\'t reflected in pricing, double-bookings are common, and group bookings require manual cost-splitting among players — currently done informally over chat apps.',
    expectedOutput: 'A platform showing real-time slot availability per turf, dynamic pricing (peak/off-peak), team-based group booking with automatic cost-splitting among players, and booking history/analytics for turf owners.',
    outcome: 'Students implement dynamic pricing logic, slot-conflict prevention, and a cost-splitting algorithm (ties naturally into debt-settlement logic) — solid, demonstrable algorithmic work.',
    suggestedTech: ['Spring Boot', 'Spring Data JPA', 'Transaction Locking', 'MySQL/PostgreSQL', 'React.js', 'FullCalendar.io', 'JavaMail API'],
    difficulty: 'advanced',
    tags: ['Booking', 'Sports', 'Dynamic Pricing', 'Split Bill'],
  },
  {
    title: 'RoomSync – Meeting Room & Resource Booking System',
    problemStatement: 'Employees in organizations frequently face meeting room conflicts and lack visibility into which rooms have the right equipment (projector, video conferencing) for their needs.',
    description: 'Manual or calendar-only booking doesn\'t account for resource requirements or auto-suggest alternatives when a preferred room is unavailable, leading to wasted time resolving conflicts.',
    expectedOutput: 'A system where employees book rooms by required capacity/equipment, the system detects conflicts and auto-suggests alternate available rooms/slots, with recurring meeting support and an admin view of overall utilization.',
    outcome: 'Students build genuine constraint-matching logic (capacity + equipment + time availability) and conflict-resolution suggestions — a scaled-down version of real enterprise resource-booking systems.',
    suggestedTech: ['Spring Boot', 'Spring Data JPA', 'MySQL/PostgreSQL', 'React.js', 'FullCalendar.io', 'JavaMail API'],
    difficulty: 'intermediate',
    tags: ['Booking', 'Enterprise', 'Resource Management', 'Constraint Solving'],
  },
  {
    title: 'ShareIt – Neighborhood Resource Sharing Platform',
    problemStatement: 'People own tools, appliances, and equipment that sit unused most of the time, while neighbors who need them occasionally have no easy way to borrow locally instead of buying.',
    description: 'There\'s no trust mechanism or organized system for neighborhood lending, so most people default to buying items they\'ll rarely use, and lenders have no incentive or visibility to share.',
    expectedOutput: 'A platform for listing shareable items with availability calendars, proximity-based browsing, a borrow request/approval flow, and a reputation/trust score built from completed exchanges.',
    outcome: 'Students implement a trust-scoring system based on transaction history and proximity-based discovery — good practice in reputation algorithms and geolocation queries.',
    suggestedTech: ['Spring Boot', 'Spring Data JPA', 'MySQL/PostgreSQL', 'React.js', 'Leaflet.js', 'JavaMail API'],
    difficulty: 'intermediate',
    tags: ['Sharing Economy', 'Proximity', 'Trust Score', 'Community'],
  },
  {
    title: 'TicketGuard – Smart Support Ticketing System with SLA Prediction',
    problemStatement: 'Support teams handling customer/internal tickets often miss SLA (resolution time) commitments because there\'s no early warning of which open tickets are at risk of breaching their deadline.',
    description: 'Tickets are typically just tracked by status without any predictive insight, so teams react only after an SLA is already breached, damaging customer trust and accountability.',
    expectedOutput: 'A ticketing system with priority-based auto-assignment (load-balanced across agents), SLA countdown per ticket, and a prediction model flagging tickets at risk of breach based on historical resolution-time patterns.',
    outcome: 'Students combine workflow engineering (ticket lifecycle, assignment logic) with a basic predictive/statistical model — genuinely close to what tools like Zendesk/Freshdesk do internally.',
    suggestedTech: ['Spring Boot', 'Spring Data JPA', 'MySQL/PostgreSQL', 'React.js', 'Recharts', 'WebSocket'],
    difficulty: 'advanced',
    tags: ['SLA', 'Ticketing', 'Prediction', 'Real-time'],
  },
  {
    title: 'PlaceIt – Campus Placement Drive Coordination System',
    problemStatement: 'College placement cells coordinate drives using WhatsApp groups and Excel sheets, causing confusion over eligibility, round schedules, and result announcements.',
    description: 'Students often miss eligibility criteria or get double-booked across company slots, and placement cells struggle to track multi-round progress across hundreds of students manually.',
    expectedOutput: 'A system where placement cells create drives with eligibility rules (auto-filtering eligible students), manage round-wise scheduling with conflict detection, and broadcast results in real time. Students view their own eligibility and status.',
    outcome: 'Students build a real rule-engine (eligibility filtering) and scheduling-conflict detection — genuinely useful and pilotable with their own institute\'s placement cell.',
    suggestedTech: ['Spring Boot', 'Spring Data JPA', 'Spring Security (JWT)', 'MySQL/PostgreSQL', 'React.js', 'Material UI', 'JavaMail API'],
    difficulty: 'intermediate',
    tags: ['Placement', 'Education', 'Rule Engine', 'Scheduling'],
  },
  {
    title: 'RoomGuard – Classroom & Lab Equipment Booking Conflict Resolver',
    problemStatement: 'Faculty and teams at institutes frequently double-book labs, classrooms, and equipment (projectors, kits) because bookings are handled informally, leading to last-minute conflicts.',
    description: 'There\'s no centralized system to check room/equipment availability before booking, so conflicts are discovered only when two groups show up for the same slot.',
    expectedOutput: 'A booking system with real-time conflict detection across rooms and equipment, auto-suggested alternate slots/rooms based on capacity and equipment needs, and an admin view of institute-wide utilization.',
    outcome: 'Students solve genuine concurrency and constraint-matching problems — directly reusable as a real tool for their own institute\'s admin office.',
    suggestedTech: ['Spring Boot', 'Spring Data JPA', 'Transactional Locking', 'MySQL/PostgreSQL', 'React.js', 'FullCalendar.io', 'JavaMail API'],
    difficulty: 'intermediate',
    tags: ['Booking', 'Conflict Resolution', 'Education', 'Resource Management'],
  },
  {
    title: 'RoomMatch – Compatibility-Based Hostel Room Allocation System',
    problemStatement: 'Hostel/PG room allotment is usually random or first-come-first-serve, leading to mismatched roommates and frequent mid-year conflicts over lifestyle differences.',
    description: 'Sleep schedules, cleanliness habits, noise tolerance, and study habits are never considered during allocation, resulting in avoidable roommate conflicts that affect students\' wellbeing and academics.',
    expectedOutput: 'A system where students fill a preference/lifestyle questionnaire, and a matching algorithm allocates rooms based on compatibility scores, with an admin override option and post-allocation feedback tracking.',
    outcome: 'Students implement a genuine matching algorithm (Gale-Shapley stable matching or weighted compatibility scoring) — real, explainable algorithmic depth, and directly pilotable in their own hostel.',
    suggestedTech: ['Spring Boot', 'Spring Data JPA', 'Gale-Shapley Algorithm', 'MySQL/PostgreSQL', 'React.js', 'Formik'],
    difficulty: 'advanced',
    tags: ['Hostel', 'Matching Algorithm', 'Education', 'Profile Matching'],
  },
  {
    title: 'MoveSwap – Student Move-In/Move-Out Exchange Platform',
    problemStatement: 'Every semester, outgoing students dump or urgently undersell furniture/setup items, while incoming students overpay for the same items from shops — with no organized crossover between the two groups.',
    description: 'Listings and demand are highly time-sensitive (spiking near semester start/end) and informal (WhatsApp groups), so good deals are missed and pricing is inconsistent.',
    expectedOutput: 'A platform with time-sensitive listings tied to the academic calendar, urgency-based price suggestions (dropping as move-out deadline nears), and a reservation system before physical exchange.',
    outcome: 'Students implement time-decay pricing logic and calendar-aware listing visibility — a genuinely novel algorithmic angle rarely seen in student projects.',
    suggestedTech: ['Spring Boot', 'Spring Data JPA', 'Time-decay Algorithm', 'MySQL/PostgreSQL', 'React.js', 'Cloudinary', 'Spring @Scheduled'],
    difficulty: 'intermediate',
    tags: ['Marketplace', 'Time-Decay', 'Student Exchange', 'SaaS'],
  },
  {
    title: 'LifeLink – Real-Time Blood Donor Matching System',
    problemStatement: 'During medical emergencies, finding a compatible, currently-eligible blood donor nearby is chaotic and typically relies on frantic WhatsApp forward chains with outdated donor information.',
    description: 'Donor eligibility changes over time (must wait ~3 months after donating), and most donor lists are static and outdated, wasting critical time during emergencies.',
    expectedOutput: 'A system where donors self-update availability/eligibility status, and requesters can search by blood type + location + urgency to get a prioritized, currently-eligible donor list with direct contact options.',
    outcome: 'Students implement eligibility-rule logic (time-since-last-donation calculations) combined with geolocation + blood-type matching — a genuinely valuable civic-tech build with real emergency relevance.',
    suggestedTech: ['Spring Boot', 'Spring Data JPA', 'Java Time API', 'MySQL/PostgreSQL', 'React.js', 'Leaflet.js', 'Twilio SMS API', 'JavaMail API'],
    difficulty: 'intermediate',
    tags: ['Civic Tech', 'Emergency', 'Blood Donor', 'Geolocation'],
  },
  {
    title: 'FeedbackLens – Faculty & Course Feedback Analytics System',
    problemStatement: 'End-of-semester feedback forms are collected but rarely analyzed meaningfully beyond a simple average score, so recurring specific issues go unaddressed.',
    description: 'Open-text feedback comments contain valuable insight that\'s ignored because there\'s no systematic way to analyze sentiment or detect recurring complaints across semesters.',
    expectedOutput: 'A feedback collection system with sentiment analysis on open-text responses, trend tracking per faculty/course across semesters, and auto-flagging of recurring specific complaints for the department to act on.',
    outcome: 'Students apply basic sentiment analysis/NLP on real text data and build trend-analytics dashboards — genuinely useful to their own institute\'s academic quality process.',
    suggestedTech: ['Spring Boot', 'Spring Data JPA', 'Sentiment Analysis API', 'MySQL/PostgreSQL', 'React.js', 'Recharts/Chart.js', 'Apache POI'],
    difficulty: 'intermediate',
    tags: ['Analytics', 'Education', 'NLP', 'Feedback'],
  },
  {
    title: 'TimetablePro – Automated Faculty Timetable Generator',
    problemStatement: 'Building a clash-free timetable (faculty availability, room capacity, no double-booking, lab-slot continuity) is done manually each semester and takes days of effort.',
    description: 'Manual timetabling is error-prone, doesn\'t scale well with more faculty/courses, and any change requires re-checking dozens of constraints by hand.',
    expectedOutput: 'A system where admins input faculty availability, course requirements, and room constraints, and a backtracking/constraint-satisfaction algorithm auto-generates a valid, clash-free timetable, with manual override support.',
    outcome: 'Students implement a genuine constraint-satisfaction/backtracking algorithm — this is legitimately hard CS (NP-hard territory, scoped down) and is one of the strongest technical showpieces in this entire list.',
    suggestedTech: ['Spring Boot', 'Spring Data JPA', 'Backtracking Algorithm', 'MySQL/PostgreSQL', 'React.js', 'Apache POI'],
    difficulty: 'advanced',
    tags: ['Timetable', 'Algorithm', 'Backtracking', 'Constraint Solving'],
  },
  {
    title: 'CommutePool – Campus Shared Commute Pooling System',
    problemStatement: 'Students commuting from the same area to campus each pay full auto/cab fare separately when they could easily share, but there\'s no organized way to find others traveling the same route at a similar time.',
    description: 'Route and time-window overlap discovery is currently informal, so most students commute alone even when pooling opportunities exist nearby.',
    expectedOutput: 'A platform where students post their commute route and time window, the system matches students with overlapping routes/times into pools, and calculates a fair cost split per pool.',
    outcome: 'Students implement a route-overlap + time-window matching algorithm and a cost-splitting calculation — a real, demoable algorithmic problem with daily personal relevance.',
    suggestedTech: ['Spring Boot', 'Spring Data JPA', 'Route Matching Algorithm', 'MySQL/PostgreSQL', 'React.js', 'Leaflet.js', 'JavaMail API'],
    difficulty: 'intermediate',
    tags: ['Carpool', 'Algorithm', 'Route Overlap', 'Shared Transport'],
  }
];
// ─────────────────────────────────────────────────────────────────────────────

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      Trainer.deleteMany({}),
      College.deleteMany({}),
      Subject.deleteMany({}),
      Batch.deleteMany({}),
      ProblemStatement.deleteMany({}),
      Team.deleteMany({}),
      ProblemLock.deleteMany({}),
      Milestone.deleteMany({}),
      Submission.deleteMany({}),
      Evaluation.deleteMany({}),
    ]);
    console.log('🧹 Cleared all existing database collections');

    // Create Trainer 1
    const passwordHash1 = await bcrypt.hash('Eth@dm!n#56', 12);
    const trainer = await Trainer.create({
      name: 'Jaswanth Narne',
      email: 'admin@ethnotech.project.in',
      passwordHash: passwordHash1,
    });
    console.log(`👤 Trainer 1 created: ${trainer.email} / password: Eth@dm!n#56`);

    // Create Trainer 2
    const passwordHash2 = await bcrypt.hash('Jashu@789', 12);
    const trainer2 = await Trainer.create({
      name: 'Jaswanth Narne',
      email: 'narnejaswanth83@gmail.com',
      passwordHash: passwordHash2,
    });
    console.log(`👤 Trainer 2 created: ${trainer2.email} / password: Jashu@789`);

    // Create Subjects
    const subjects = await Subject.insertMany([
      { name: 'Java Full Stack', description: 'Spring Boot + React', color: '#f59e0b', trainerId: trainer._id },
      { name: 'Python Full Stack', description: 'Django/Flask + React', color: '#10b981', trainerId: trainer._id },
      { name: 'MERN Stack', description: 'MongoDB + Express + React + Node.js', color: '#3b82f6', trainerId: trainer._id },
      { name: 'Data Science', description: 'Python + ML + Visualization', color: '#8b5cf6', trainerId: trainer._id },
    ]);
    console.log(`📚 Created ${subjects.length} subjects`);

    // Create Sample College
    const college = await College.create({
      name: 'Sample Engineering College',
      location: 'Hyderabad, Telangana',
      trainerId: trainer._id,
      contactEmail: 'principal@samplecollege.edu',
    });
    console.log(`🏫 College created: ${college.name}`);

    // Create Sample Batch with constraints and default dropdown configurations
    const batch = await Batch.create({
      name: '2026-MERN-A',
      collegeId: college._id,
      subjectId: subjects[2]._id, // MERN Stack
      trainerId: trainer._id,
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-06-30'),
      status: 'active',
      minMembers: 2,
      maxMembers: 4,
      departments: ['CSE', 'ECE', 'ISE', 'AIML'],
      divisions: ['A', 'B', 'C'],
      rooms: ['Lab 1', 'Lab 2', 'Room 304'],
      courses: ['Java Full Stack', 'MERN Stack'],
    });
    console.log(`📅 Batch created: ${batch.name} (Min: ${batch.minMembers}, Max: ${batch.maxMembers})`);

    // Create Problem Statements
    const jfsSubjectId = subjects[0]._id;
    const mernSubjectId = subjects[2]._id;

    const jfsProblems = await ProblemStatement.insertMany(
      JAVA_FULL_STACK_PROBLEMS.map((p) => ({
        ...p,
        subjectId: jfsSubjectId,
        trainerId: trainer._id,
        isGlobal: false,
      }))
    );
    console.log(`💡 Created ${jfsProblems.length} Java Full Stack problem statements`);

    const mernProblems = await ProblemStatement.insertMany(
      JAVA_FULL_STACK_PROBLEMS.map((p) => ({
        ...p,
        subjectId: mernSubjectId,
        trainerId: trainer._id,
        isGlobal: false,
      }))
    );
    console.log(`💡 Created ${mernProblems.length} MERN Stack problem statements`);

    // Create a Sample Team Lead Account
    const leadPassHash = await bcrypt.hash('teamlead123', 12);
    const sampleTeam = await Team.create({
      name: 'Team Alpha',
      leadUsername: 'leadalpha',
      email: 'leadalpha@college.edu',
      passwordHash: leadPassHash,
      batchId: batch._id,
      collegeId: college._id,
      members: [
        { name: 'Srinivas Rao', rollNumber: '2026CS01', email: 'srinivas@college.edu' },
        { name: 'Deepika K', rollNumber: '2026CS02', email: 'deepika@college.edu' }
      ],
      status: 'problem_pending'
    });
    console.log(`👥 Sample Team created: "${sampleTeam.name}" (Lead: leadalpha / teamlead123)`);

    console.log('\n🎉 Seed complete!');
    console.log('─'.repeat(50));
    console.log('Trainer 1 Login:   admin@ethnotech.project.in / Eth@dm!n#56');
    console.log('Trainer 2 Login:   narnejaswanth83@gmail.com / Jashu@789');
    console.log('Team Lead Login:   leadalpha / teamlead123');
    console.log('─'.repeat(50));
  } catch (err) {
    console.error('❌ Seed error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();

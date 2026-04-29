/**
 * Database seeder — populates the DB with the same demo users
 * that the frontend mock data had, so you can log in immediately.
 *
 * Run:   node src/utils/seeder.js
 * Wipe:  node src/utils/seeder.js --destroy
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose     = require('mongoose');
const connectDB    = require('../config/db');
const User         = require('../models/User');
const CollabReq    = require('../models/CollaborationRequest');
const Message      = require('../models/Message');

const entrepreneurs = [
  {
    name: 'Sarah Johnson',
    email: 'sarah@techwave.io',
    password: 'password123',
    role: 'entrepreneur',
    avatarUrl: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg',
    bio: 'Serial entrepreneur with 10+ years of experience in SaaS and fintech.',
    startupName: 'TechWave AI',
    pitchSummary: 'AI-powered financial analytics platform helping SMBs make data-driven decisions.',
    fundingNeeded: '$1.5M',
    industry: 'FinTech',
    location: 'San Francisco, CA',
    foundedYear: 2021,
    teamSize: 12,
    isOnline: true,
  },
  {
    name: 'David Chen',
    email: 'david@greenlife.co',
    password: 'password123',
    role: 'entrepreneur',
    avatarUrl: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg',
    bio: 'Environmental scientist turned entrepreneur.',
    startupName: 'GreenLife Solutions',
    pitchSummary: 'Biodegradable packaging alternatives for consumer goods and food industry.',
    fundingNeeded: '$2M',
    industry: 'CleanTech',
    location: 'Portland, OR',
    foundedYear: 2020,
    teamSize: 8,
  },
  {
    name: 'Maya Patel',
    email: 'maya@healthpulse.com',
    password: 'password123',
    role: 'entrepreneur',
    avatarUrl: 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg',
    bio: 'Former healthcare professional with an MBA.',
    startupName: 'HealthPulse',
    pitchSummary: 'Mobile platform connecting patients with mental health professionals in real-time.',
    fundingNeeded: '$800K',
    industry: 'HealthTech',
    location: 'Boston, MA',
    foundedYear: 2022,
    teamSize: 5,
    isOnline: true,
  },
  {
    name: 'James Wilson',
    email: 'james@urbanfarm.io',
    password: 'password123',
    role: 'entrepreneur',
    avatarUrl: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
    bio: 'Agricultural engineer focused on urban farming solutions.',
    startupName: 'UrbanFarm',
    pitchSummary: 'IoT-enabled vertical farming systems for urban environments.',
    fundingNeeded: '$3M',
    industry: 'AgTech',
    location: 'Chicago, IL',
    foundedYear: 2019,
    teamSize: 14,
  },
];

const investors = [
  {
    name: 'Michael Rodriguez',
    email: 'michael@vcinnovate.com',
    password: 'password123',
    role: 'investor',
    avatarUrl: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
    bio: 'Early-stage investor with focus on B2B SaaS and fintech.',
    investmentInterests: ['FinTech', 'SaaS', 'AI/ML'],
    investmentStage: ['Seed', 'Series A'],
    portfolioCompanies: ['PayStream', 'DataSense', 'CloudSecure'],
    totalInvestments: 12,
    minimumInvestment: '$250K',
    maximumInvestment: '$1.5M',
    isOnline: true,
  },
  {
    name: 'Jennifer Lee',
    email: 'jennifer@impactvc.org',
    password: 'password123',
    role: 'investor',
    avatarUrl: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg',
    bio: 'Impact investor focused on climate tech and sustainable agriculture.',
    investmentInterests: ['CleanTech', 'AgTech', 'Sustainability'],
    investmentStage: ['Seed', 'Series A', 'Series B'],
    portfolioCompanies: ['SolarFlow', 'EcoPackage', 'CleanWater Solutions'],
    totalInvestments: 18,
    minimumInvestment: '$500K',
    maximumInvestment: '$3M',
  },
  {
    name: 'Robert Torres',
    email: 'robert@healthventures.com',
    password: 'password123',
    role: 'investor',
    avatarUrl: 'https://images.pexels.com/photos/834863/pexels-photo-834863.jpeg',
    bio: 'Healthcare-focused investor with medical background.',
    investmentInterests: ['HealthTech', 'BioTech', 'Medical Devices'],
    investmentStage: ['Series A', 'Series B'],
    portfolioCompanies: ['MediTrack', 'BioGenics', 'Patient+'],
    totalInvestments: 9,
    minimumInvestment: '$1M',
    maximumInvestment: '$5M',
    isOnline: true,
  },
];

const seed = async () => {
  await connectDB();

  if (process.argv[2] === '--destroy') {
    await User.deleteMany();
    await CollabReq.deleteMany();
    await Message.deleteMany();
    console.log('🗑  Database wiped');
    process.exit(0);
  }

  // Clear existing users to avoid duplicates
  await User.deleteMany();
  await CollabReq.deleteMany();
  await Message.deleteMany();

  const createdEntrepreneurs = await User.create(entrepreneurs);
  const createdInvestors     = await User.create(investors);

  console.log(`🌱  Seeded ${createdEntrepreneurs.length} entrepreneurs`);
  console.log(`🌱  Seeded ${createdInvestors.length} investors`);

  // Seed a collaboration request (Michael -> Sarah)
  await CollabReq.create({
    investorId:      createdInvestors[0]._id,
    entrepreneurId:  createdEntrepreneurs[0]._id,
    message:         "I'd like to explore potential investment in TechWave AI.",
    status: 'pending',
  });

  // Seed a message between Sarah and Michael
  await Message.create({
    senderId:   createdEntrepreneurs[0]._id,
    receiverId: createdInvestors[0]._id,
    content:    "Thanks for connecting! I'd love to discuss how our AI platform can help.",
    isRead:     true,
  });

  console.log('✅  Seeding complete');
  console.log('\nDemo credentials:');
  console.log('  Entrepreneur: sarah@techwave.io / password123');
  console.log('  Investor:     michael@vcinnovate.com / password123');
  process.exit(0);
};

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

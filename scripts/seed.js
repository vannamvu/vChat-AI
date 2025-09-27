const mongoose = require('mongoose');
require('dotenv').config();

const FaqService = require('../src/services/FaqService');

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seed...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vchat-ai');
    
    console.log('✅ Connected to MongoDB');
    
    // Seed FAQs
    await FaqService.seedInitialFaqs();
    
    console.log('✅ Database seeded successfully!');
    console.log('🚀 You can now start the application with: npm start');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedDatabase();
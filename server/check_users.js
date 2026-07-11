const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('./models/User');

async function testPassword() {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/parkspot';
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB!');
    const users = await User.find({}).select('+password');
    console.log(`Total users in DB: ${users.length}`);
    for (const u of users) {
      console.log('------------------------------');
      console.log('Email:', u.email);
      console.log('Role:', u.role);
      console.log('Phone:', u.phone || 'N/A');
      console.log('Verified:', u.isVerified);
      console.log('Hashed Password:', u.password);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await mongoose.disconnect();
  }
}

testPassword();

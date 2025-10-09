const mongoose = require('mongoose');

async function connectToDatabase() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI not set');
  await mongoose.connect(mongoUri, { autoIndex: true });
  console.log('Connected to MongoDB');
}

module.exports = { connectToDatabase };



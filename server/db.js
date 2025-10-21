import mongoose from "mongoose";
const db = process.env.DB;

async function dbConnect() {
  if (!db) {
    throw new Error(`DB connection string not set`);
  }
  try {
    const connect = await mongoose.connect(db);
    console.log(`connection established with db`);
    console.log(connect);
    return connect;
  } catch (error) {
    console.log(`connection not established!`);
    throw error;
  }
}
export default dbConnect;

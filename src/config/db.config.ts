import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();
mongoose.set("strictQuery", true)
const mongoDbConnection = mongoose
  .connect(process.env.MONGO_URL!)
  .then(() => console.log("db connected"))
  .catch((err) => console.log(`error ${err}`));

export default mongoDbConnection;

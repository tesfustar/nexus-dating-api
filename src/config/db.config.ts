import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();
mongoose.set("strictQuery", true)
const mongoDbConnection = mongoose
  .connect('mongodb://127.0.0.1:27017/nexus-dating-api')
  .then(() => console.log("db connected"))
  .catch((err) => console.log(`error ${err}`));

export default mongoDbConnection;

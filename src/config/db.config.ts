import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();
mongoose.set("strictQuery", true)
const mongoDbConnection = mongoose
  .connect('mongodb://31.220.18.115:27017/my-database')
  .then(() => console.log("db connected"))
  .catch((err) => console.log(`error ${err}`));

export default mongoDbConnection;

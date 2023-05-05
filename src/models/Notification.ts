import mongoose from "mongoose";
import { INotification } from "../interfaces/Notification";
const notificationSchema = new mongoose.Schema<INotification>(
  {
    userId: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
    profile: { type: String },
    message: { type: String },
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Notification = mongoose.model<INotification>(
  "Notification",
  notificationSchema
);

export default Notification;

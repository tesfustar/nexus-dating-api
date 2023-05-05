import mongoose from "mongoose";
import { IConversation } from "../interfaces/Conversation";
const conversationSchema = new mongoose.Schema<IConversation>(
  {
    members: [{ type: mongoose.SchemaTypes.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

const Conversation = mongoose.model<IConversation>("Conversation", conversationSchema);

export default Conversation;

import mongoose from "mongoose";
import { IMessage } from "../interfaces/Messages";

const messagesSchema = new mongoose.Schema<IMessage>(
  {
    conversationId: { 
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Conversation",
    },
    text: { type: String ,default: null },
    senderId: { type: String },
    receiverId: { type: String },
    readAt: { type: Date, default: null },
    audio: { type: String,default: null  },
  },
  { timestamps: true }
);

const Messages = mongoose.model<IMessage>("Messages", messagesSchema);

export default Messages;

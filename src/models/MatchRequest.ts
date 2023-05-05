import mongoose from "mongoose";
import { IMatchRequest } from "../interfaces/MatchRequest";

const matchRequestSchema = new mongoose.Schema<IMatchRequest>({
  senderId: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
  receiverId: { type: mongoose.SchemaTypes.ObjectId, ref: "User" },
  isAccepted: { type: Boolean, default: false },
  isRejected: { type: Boolean, default: false },
  isUnMatched: { type: Boolean, default: false },
});

const MatchRequest = mongoose.model<IMatchRequest>("MatchRequest", matchRequestSchema);

export default MatchRequest;

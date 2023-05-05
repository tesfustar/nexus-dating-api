import { Document ,ObjectId,} from "mongoose";
export interface IMatchRequest extends Document{
    senderId: ObjectId,
    receiverId: ObjectId,
    isAccepted: boolean,
    isRejected: boolean,
    isUnMatched: boolean,
}
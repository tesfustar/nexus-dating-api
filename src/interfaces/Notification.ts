import { Document ,ObjectId,} from "mongoose";
export interface INotification extends Document{
    userId:ObjectId,
    profile:string,
    message:string,
    readAt:Date,
}
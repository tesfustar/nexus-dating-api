import { Document ,ObjectId,} from "mongoose";

 interface IProfile{
    filename:string;
    _id:string;
 }
export interface INotification extends Document{
    userId:ObjectId,
    profile:IProfile,
    message:string,
    readAt:Date,
}
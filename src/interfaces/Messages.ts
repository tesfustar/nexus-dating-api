import { Document ,ObjectId,} from "mongoose";
export interface IMessage extends Document{
      conversationId:ObjectId,
      text:string,
      senderId:string,
      receiverId:string,
      readAt:Date,
      audio:string,
}
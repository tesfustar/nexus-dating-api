import { Document ,ObjectId,} from "mongoose";
export interface IConversation extends Document{
    members:string[];
    createdAt?:string
    id:string;
}
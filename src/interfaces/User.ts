import { Document, ObjectId } from "mongoose";

interface IProfile{
  path:string
}
export interface IUser extends Document {
  phone: number;
  password: string;
  fullName: string;
  displayName: string;
  gender: string;
  birthDate: Date;
  bio: string;
  profile: IProfile[];
  location: number[];
  address: string;
  interest: string[];
  pets: string;
  lookingFor: string;
  education: string;
  communication: string;
  blockedUsers: ObjectId[];
  isAdmin: boolean;
  otpVerified: boolean;
  hasFullInfo: boolean;
}

import { Document, ObjectId } from "mongoose";

export interface IUser extends Document {
  phone: number;
  password: string;
  fullName: string;
  displayName: string;
  gender: string;
  birthDate: Date;
  bio: string;
  profile: string[];
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

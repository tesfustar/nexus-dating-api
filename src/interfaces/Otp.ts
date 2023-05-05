import { Document } from "mongoose";

export interface IOtp extends Document {
  phone: number;
  code: string;
  isUsed: boolean;
  isForForget: boolean;
}

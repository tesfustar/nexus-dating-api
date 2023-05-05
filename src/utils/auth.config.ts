import bcrypt from "bcryptjs";

export const generateSalt = async (): Promise<string> => {
  return bcrypt.genSalt(10);
};

export const hashedOtpOrPassword = async (data: string) => {
  const salt = await generateSalt();
  return bcrypt.hash(data, salt);
};

export function generateOTP() {
    // Generate a random number between 1000 and 9999
    let otp = Math.floor(Math.random() * 9000) + 1000;
    return otp;
  }
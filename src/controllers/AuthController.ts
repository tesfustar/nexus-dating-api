import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt, { Secret } from "jsonwebtoken";
import _ from "lodash";
import { z } from "zod";
import axios from "axios";
import {
  generateOTP,
  generateSalt,
  hashedOtpOrPassword,
} from "../utils/auth.config";
import Otp from "../models/Otp";
import { uploadImage } from "../config/multer.config";

//user sign in
export const SignIn = async (req: Request, res: Response) => {
  try {
    const userSchema = z.object({
      phone: z.number(),
      password: z.string(),
    });
    const userData = userSchema.parse(req.body);

    const oldUser = await User.findOne({ phone: userData.phone });

    if (!oldUser)
      return res.status(404).json({ message: "User doesn't exist" });
    const isPasswordCorrect = await bcrypt.compare(
      userData.password,
      oldUser.password
    );

    if (!isPasswordCorrect)
      return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      {
        phone: oldUser.phone,
        isAdmin: oldUser.isAdmin,
      },
      process.env.JWT_KEY as Secret,
      {
        expiresIn: "24h",
      }
    );
    const selectedProp = _.pick(oldUser, [
      "_id",
      "phone",
      "interest",
      "pets",
      "work",
      "education",
      "displayName",
      "location",
      "address",
      "bio",
      "profile",
      "birthDate",
      "createdAt",
      "updatedAt",
    ]);

    res.status(200).json({ result: selectedProp, token });
  } catch (error: any) {
    if (error instanceof z.ZodError)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: error.errors });
    res
      .status(500)
      .json({ message: "Something went wrong please try later!" + error });
  }
};

//registration
//first phone verification

export const SignUp = async (req: Request, res: Response) => {
  try {
    const userSchema = z.object({
      phone: z.number(),
    });
    const userData = userSchema.parse(req.body);
    //check user is already exist
    let oldPhone = await User.findOne({
      phone: userData.phone,
      otpVerified: true,
      hasFullInfo: true,
    });
    if (oldPhone)
      return res.status(400).json({ message: "phone already exist" });
    //send sms
    const generatedOtp = generateOTP();
    const payload = {
      username: "Nexus63695",
      password: `?#!n.!.>x"><<!sGv0'JLNl@B&<dQ`,
      to: userData.phone,
      text: `Your Dama Verification code is ${generatedOtp}`,
    };
    const sms_otp = await axios.post(process.env.SMS_URL!, payload);
    const hashedOtp = await hashedOtpOrPassword(generatedOtp.toString());
    //hash and store otp
    await Otp.create({
      phone: userData.phone,
      code: hashedOtp,
    });
    res.status(200).json({ message: "otp sent to your phone" });
  } catch (error) {
    if (error instanceof z.ZodError)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: error.errors });
    res.status(500).json({ message: "Internal server error" + error });
  }
};

//verify otp for registration

export const VerifyOtp = async (req: Request, res: Response) => {
  try {
    const otpSchema = z.object({
      phone: z.number(),
      code: z.string(),
    });
    const otpData = otpSchema.parse(req.body);

    //first find the otp
    const userOtp = await Otp.findOne({
      phone: otpData.phone,
      isUsed: false,
      isForForget: false,
    }).sort({
      createdAt: -1,
    });
    if (!userOtp) return res.status(403).json({ message: "Invalid gateway" });
    const isOtpCorrect = await bcrypt.compare(otpData.code, userOtp.code);

    if (!isOtpCorrect)
      return res.status(400).json({ message: "Invalid Otp code" });
    let oldPhone = await User.findOne({
      phone: otpData.phone,
      otpVerified: true,
      hasFullInfo: false,
    });
    if (!oldPhone) {
      const newUser = await User.create({
        phone: otpData.phone,
        otpVerified: true,
      });
      await Otp.findByIdAndUpdate(userOtp._id, { isUsed: true }, { new: true });
      res.status(200).json({
        message: "successfully verified",
        data: newUser._id,
      });
    } else {
      await Otp.findByIdAndUpdate(userOtp._id, { isUsed: true }, { new: true });
      res.status(200).json({
        message: "successfully verified",
        data: oldPhone._id,
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: error.errors });
    res.status(500).json({ message: "Internal server error" + error });
  }
};

//finish registration

export const RegisterUser = async (req: Request, res: Response) => {
  uploadImage.array("profile")(req, res, (err: any) => {
    try {
      if (err) {
        return res.status(500).json({ message: "Error uploading file" + err });
      }
      const files = req.files;
      if (!files || files.length == 0)
        return res.status(400).json({ message: "profile image is required" });

      const fileSchema = z.object({
        filename: z.string(),
      });
      const userSchema = z.object({
        phone: z.string(),
        password: z.string(),
        fullName: z.string(),
        displayName: z.string(),
        birthDate: z.string(),
        bio: z.string(),
        profile: z.array(fileSchema),
        location: z.string().array(),
        interest: z.string().array(),
        pets: z.string(),
        lookingFor: z.string(),
        education: z.string(),
        gender: z.string(),
        communication: z.string(),
      });

      const userData = userSchema.parse({ ...req.body, profile: req.files });
      (async () => {
        //check if he already finished registration
        const isRegisteredUser = await User.findOne({
          phone: userData.phone,
          otpVerified: true,
          hasFullInfo: true,
        });
        if (isRegisteredUser) {
          return res
            .status(400)
            .json({ message: "you already registered user!" });
        }
        //check if it is verified user
        const oldUser = await User.findOne({
          phone: userData.phone,
          otpVerified: true,
        });
        if (!oldUser) {
          return res
            .status(400)
            .json({ message: "you are not verified user!" });
        }
        const hashedPassword = await hashedOtpOrPassword(userData.password);
        const address = await axios
          .get(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userData.location[1]}&lon=${userData.location[0]}`
          )
          .then(async (response: any) => {
            const registeredUser = await User.findByIdAndUpdate(
              oldUser.id,
              {
                $set: {
                  ...userData,
                  password: hashedPassword,
                  hasFullInfo: true,
                  address:
                    response?.data?.address?.county +
                    " " +
                    response?.data?.address?.suburb && response?.data?.address?.suburb,
                },
              },
              { new: true }
            );
            const token = jwt.sign(
              {
                phone: registeredUser?.phone,
                isAdmin: registeredUser?.isAdmin,
              },
              process.env.JWT_KEY as Secret,
              {
                expiresIn: "30d",
              }
            );
            res
              .status(201)
              .json({ result: registeredUser, token, file: req.files });
          })
          .catch((error) => {
            res.status(400).json({ message: "please ty again later" });
          });
      })();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Internal server error" + error });
    }
  });
};

//forgot password has three step 

export const ForgotPassword = async (req: Request, res: Response) => {
  try {
    const userSchema = z.object({
      phone: z.number(),
    });
    const userData = userSchema.parse(req.body);
    //check if user is exist or not
    const oldUser = await User.findOne({
      phone: userData.phone,
      otpVerified: true,
      hasFullInfo: true,
    });
    if (!oldUser) return res.status(404).json({ message: "user not found!" });
    //send otp sms
    const generatedOtp = generateOTP();
    const payload = {
      username: "Nexus63695",
      password: `?#!n.!.>x"><<!sGv0'JLNl@B&<dQ`,
      to: userData.phone,
      text: `Your Dama Verification code is ${generatedOtp}`,
    };
    const sms_otp = await axios.post(process.env.SMS_URL!, payload);
    const hashedOtp = await hashedOtpOrPassword(generatedOtp.toString());
    //hash and store otp
    await Otp.create({
      phone: userData.phone,
      code: hashedOtp,
      isForForget: true,
    });
    res.status(200).json({
      message: "otp sent to your phone",
    });
  } catch (error) {
    if (error instanceof z.ZodError)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: error.errors });
    res.status(500).json({ message: "Internal server error" + error });
  }
};

//verify forgot password otp

export const ForgotPasswordOtpVerify = async (req: Request, res: Response) => {
  try {
    const userSchema = z.object({
      phone: z.number(),
      code: z.string(),
    });
    const userData = userSchema.parse(req.body);
    //find user otp
    const userOtp = await Otp.findOne({
      phone: userData.phone,
      isUsed: false,
      isForForget: true,
    }).sort({
      createdAt: -1,
    });
    if (!userOtp) return res.status(403).json({ message: "Invalid gateway" });
    //check if ot is correct
    const isOtpCorrect = await bcrypt.compare(userData.code, userOtp.code);

    if (!isOtpCorrect)
      return res.status(400).json({ message: "Invalid Otp code" });
    //update otp
    const updateOtp = await Otp.findByIdAndUpdate(
      userOtp._id,
      { isUsed: true },
      { new: true }
    );
    res.status(200).json({
      message: "successfully verified",
    });
  } catch (error) {
    if (error instanceof z.ZodError)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: error.errors });
    res.status(500).json({ message: "Internal server error" + error });
  }
};

//set new password

export const SetNewPassword = async (req: Request, res: Response) => {
  try {
    const userSchema = z.object({
      phone: z.number(),
      password: z.string(),
    });
    const userData = userSchema.parse(req.body);
    //check if the user is verified user or not
    const oldUser = await User.findOne({
      phone: userData.phone,
      otpVerified: true,
      hasFullInfo: true,
    });
    if (!oldUser)
      return res.status(400).json({ message: "you are not verified user!" });

    //has password
    const hashedPassword = await hashedOtpOrPassword(userData.password);
    const updateUserPassword = await User.findByIdAndUpdate(
      oldUser.id,
      {
        $set: { password: hashedPassword },
      },
      { new: true }
    );
    res
      .status(200)
      .json({ message: "your password changed!", data: updateUserPassword });
  } catch (error) {
    if (error instanceof z.ZodError)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: error.errors });
    res.status(500).json({ message: "Internal server error" + error });
  }
};

import { Request, Response } from "express";
import User from "../models/User";
import bcrypt from "bcryptjs";
import jwt, { Secret } from "jsonwebtoken";
import Joi from "@hapi/joi";
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
    const schema = Joi.object().keys({
      phone: Joi.number().required(),
      password: Joi.string().required(),
    });
    const joeResult = await schema.validateAsync(req.body);

    if (joeResult.error)
      return res
        .status(400)
        .json({ message: joeResult.error.details[0].message });

    const oldUser = await User.findOne({ phone: joeResult.phone });

    if (!oldUser)
      return res.status(404).json({ message: "User doesn't exist" });
    console.log(joeResult.password, oldUser.password);
    const isPasswordCorrect = await bcrypt.compare(
      joeResult.password,
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
    if (error.isJoi === true)
      return res.status(400).json({ message: error.details[0].message });
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
      username: process.env.SMS_USERNAME,
      password: process.env.SMS_PASSWORD,
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
  try {
    uploadImage.array("profile")(req, res, (err: any) => {
      if (err) {
        return res.status(500).json({ message: "Error uploading file" + err });
      }
      const files = req.files;
      // res.status(200).json(files);
      if (!files || files.length == 0)
        return res.status(400).json({ message: "profile image is required" });
      // const profileData = files?.map((file)=>file.path)

      const fileSchema = z.object({
        path: z.string(),
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
            const address = response?.address?.suburb;
            const registeredUser = await User.findByIdAndUpdate(
              oldUser.id,
              {
                $set: {
                  ...userData,
                  password: hashedPassword,
                  hasFullInfo: true,
                  address:
                    response?.address?.county + " " + response?.address?.suburb,
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
            res.status(201).json({ result: registeredUser, token });
          })
          .catch((error) => {
            res.status(400).json({ message: "please ty again later" });
          });
      })();
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: error.errors });
    }
    res.status(500).json({ message: "Internal server error" + error });
  }
};

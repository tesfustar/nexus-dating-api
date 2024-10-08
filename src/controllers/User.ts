import { Request, Response } from "express";
import User from "../models/User";
import Conversation from "../models/Conversation";
import Notification from "../models/Notification";
import Messages from "../models/Messages";
import MatchRequest from "../models/MatchRequest";
import Joi from "@hapi/joi";
import _ from "lodash";
import bcrypt from "bcryptjs";
import { uploadImage } from "../config/multer.config";
import multer from "multer";
import { z } from "zod";
import fs from "fs";
import path from "path";
export const UpdateUserInfo = async (req: Request, res: Response) => {
  try {
    //first find the user
    const oldUser = await User.findById(req.params.id);
    if (!oldUser) return res.status(400).json({ message: "user not found" });
    //then update the user info
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: req.body,
      },
      { new: true }
    );
    res.status(200).json({ success: true, data: updatedUser });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//update profile images
export const UpdateProfileImages = async (req: Request, res: Response) => {
  const { id } = req.params;
  uploadImage.array("profile", 4)(req, res, async (err: any) => {
    try {
      if (err instanceof multer.MulterError)
        return res.status(400).json({ message: "can't upload your images" });
      //the validate files
      const fileSchema = z.object({
        filename: z.string(),
      });
      const profileSchema = z.object({
        profile: z.array(fileSchema),
        isProfile: z.string().optional(),
      });
      const userData = profileSchema.parse({ ...req.body, profile: req.files });
      let isUserExist = await User.findOne({
        _id: id,
        otpVerified: true,
        hasFullInfo: true,
      });
      //check if user is verified or not
      if (!isUserExist)
        return res.status(400).json({ message: "user not found" });

      if (userData.isProfile == "Logo") {
        //  Update user's profile at first array
        const newProfile = userData.profile[0];
        await User.findByIdAndUpdate(
          id,
          { $push: { profile: { $each: [newProfile], $position: 0 } } },
          { new: true }
        );
        //the rest at the end of the array
        if (userData.profile.length > 1) {
          await User.findByIdAndUpdate(
            id,
            {
              $push: {
                profile: {
                  $each: userData.profile.slice(1),
                  $position: userData.profile.length - 1,
                },
              },
            },
            { new: true }
          );
        }
        res.status(200).json({ message: "profile image updated successfully" });
      } else {
        //push image at the last of array
        const profileLength = isUserExist.profile.length;
        if (profileLength >= 4) {
          return res
            .status(400)
            .json({ message: "You can't upload more than 4 profile images" });
        }
        for (const image of userData.profile) {
          await User.findByIdAndUpdate(
            id,
            { $push: { profile: image } },
            { new: true }
          );
        }
        res
          .status(200)
          .json({ message: "profile image uploaded successfully" });
      }
    } catch (error) {
      if (error instanceof z.ZodError)
        return res
          .status(400)
          .json({ message: "Validation failed", errors: error.errors });
      res
        .status(500)
        .json({ message: "Something went wrong please try later!", error });
    }
  });
};

//delete profile image
export const DeleteProfileImage = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { imageId } = req.body;
  try {
    // first find the user
    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ message: "user not found!" });
    // find the image
    const image: any = user?.profile.find(
      (profileImage: any) => profileImage._id == imageId
    );
    //remove the image from db
    const updateUser = await User.findByIdAndUpdate(
      userId,
      { $pull: { profile: { _id: imageId } } },
      { new: true }
    );
    // remove the image from the server
    const imagePath = path.resolve(__dirname, "..", "public", image?.filename); // Assuming the image files are stored in the 'public/images' folder
    fs.unlinkSync(imagePath); // Delete the image file from the folder
    res
      .status(200)
      .json({ message: "profile image deleted successfully", data: image });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};
//get my matches
export const GetMyMatches = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    //first check if the user exist
    if (!user) return res.status(400).json({ message: "user not found" });
    const matchRequest = (
      await MatchRequest.find({
        $or: [{ senderId: req.params.id }, { receiverId: req.params.id }],
        isAccepted: true,
      })
    )
      ?.map((item) => [item.receiverId, item.senderId])
      ?.flat();
    // const filteredRequest
    const myMatches = await User.find({
      $or: [
        { interest: { $in: user?.interest } },
        { pets: { $eq: user?.pets } },
        { communication: { $eq: user?.communication } },

        // {
        //   location: {
        //     $near: {
        //       $geometry: {
        //         type: "Point",
        //         coordinates: [user.location[0], user.location[1]],
        //       },
        //       $minDistance: 50,
        //       $maxDistance: 15000,
        //     },
        //   },
        // },
      ],
      _id: { $not: { $in: matchRequest } },
      gender: { $ne: user.gender.toLowerCase() },
    });
    const randomizeUsers = myMatches
      .map((value) => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);
    res.status(200).json({ success: true, data: randomizeUsers });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//get my profile
export const UserProfile = async (req: Request, res: Response) => {
  try {
    const profile = await User.findById(req.params.id);
    //first check if the user exist
    if (!profile) return res.status(400).json({ message: "user not found" });
    const myMatches = await MatchRequest.find({
      $or: [{ senderId: req.params.id }, { receiverId: req.params.id }],
      isAccepted: true,
      isUnMatched: false,
    }).count();
    const blockedUsers = profile?.blockedUsers?.length;
    const selectedProp = _.pick(profile, [
      "_id",
      "phone",
      "fullName",
      "interest",
      "pets",
      "lookingFor",
      "education",
      "communication",
      "displayName",
      "location",
      "address",
      "bio",
      "profile",
      "birthDate",
      "createdAt",
      "updatedAt",
    ]);
    const allInfo = { ...selectedProp, myMatches, blockedUsers };
    res.status(200).json({
      success: true,
      data: allInfo,
      // profile: selectedProp,
      // matches: myMatches,
      // blockedUsers: blockedUsers,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//change password

export const ChangePassword = async (req: Request, res: Response) => {
  try {
    const userSchema = z.object({
      old_password: z.string(),
      new_password: z.string(),
    });
    const userData = userSchema.parse(req.body);
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "user not found" });

    //check old password
    const isPasswordCorrect = await bcrypt.compare(
      userData.old_password,
      user.password
    );

    if (!isPasswordCorrect)
      return res.status(400).json({ message: "old password not correct" });
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(req.body.new_password, salt);
    req.body.new_password = hashed;
    await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: { password: hashed },
      },
      { new: true }
    );
    res.status(200).json({ message: "password changed successfully" });
  } catch (error) {
    if (error instanceof z.ZodError)
      return res
        .status(400)
        .json({ message: "Validation failed", errors: error.errors });
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//block user
export const BlockUser = async (req: Request, res: Response) => {
  const { blockedUserId } = req.body;
  try {
    //check the blocked user is exist
    const isBlockedUser = await User.findById(blockedUserId);
    if (!isBlockedUser)
      return res.status(404).json({ message: "blocked user not found" });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "user not found" });
    if (req.params.id == blockedUserId)
      return res.status(403).json({ message: "you can't block your self!" });
    //check if the user is already blocked
    if (user.blockedUsers.includes(blockedUserId))
      return res.status(404).json({ message: "user already blocked" });
    const blockUser = await User.findByIdAndUpdate(
      req.params.id,
      { $push: { blockedUsers: blockedUserId } },
      { new: true }
    );
    res.status(200).json({
      message: `you blocked ${isBlockedUser?.displayName}`,
      data: blockUser,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//unblock user

export const UnBlockUser = async (req: Request, res: Response) => {
  const { blockedUserId } = req.body;
  try {
    //check the blocked user is exist
    const isBlockedUser = await User.findById(blockedUserId);
    if (!isBlockedUser)
      return res.status(404).json({ message: "blocked user not found" });

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "user not found" });
    //check if the user send the same id
    if (req.params.id == blockedUserId)
      return res.status(403).json({ message: "you can't block your self!" });
    //check if the user is already blocked
    if (!user.blockedUsers.includes(blockedUserId))
      return res.status(404).json({ message: "blocked user not found" });
    const removeBlockedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $pull: { blockedUsers: blockedUserId } },
      { new: true }
    );
    res.status(200).json({
      message: `you unblock ${isBlockedUser?.displayName}`,
      data: removeBlockedUser,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//get my list of blocked users

export const GetBlockedUsers = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).populate("blockedUsers");
    if (!user) return res.status(404).json({ message: "user not found" });
    const selectedProps = _.map(user?.blockedUsers, (blockedUser) =>
      _.pick(blockedUser, [
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
      ])
    );
    res.status(200).json({ message: "success", data: selectedProps });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//filter matched user

export const FilterUser = async (req: Request, res: Response) => {
  const { min_age, max_age, distance, interest } = req.body;
  const { id } = req.params;
  try {
    const user = await User.findById(id);

    if (!user) return res.status(404).json({ message: "user not found" });

    //find his matches
    const matchRequest = (
      await MatchRequest.find({
        $or: [{ senderId: req.params.id }, { receiverId: req.params.id }],
        isAccepted: true,
      })
    )
      ?.map((item) => [item.receiverId, item.senderId])
      ?.flat();
    const lat = user.location[1];
    const long = user.location[0];

    const filteredMatched = await User.find({
      gender: { $ne: user.gender.toLowerCase() },
      _id: { $not: { $in: matchRequest } },
      $or: [
        { interest: interest ? { $in: interest } : { $in: [""] } },
        {
          birthDate:
            max_age && min_age
              ? {
                  $gt: new Date(new Date().valueOf() - max_age * 31536000000),
                  $lt: new Date(new Date().valueOf() - min_age * 31536000000),
                }
              : { $exists: true },
        },
      ],
      location: distance
        ? {
            $nearSphere: {
              $geometry: {
                type: "Point",
                coordinates: [long, lat],
              },
              $maxDistance: distance * 1000,
            },
          }
        : { $exists: true },
    });

    //randomize the results
    const randomizeUsers = filteredMatched
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);

    res.status(200).json({ success: true, data: randomizeUsers });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//delete my account

export const DeleteMyAccount = async (req: Request, res: Response) => {
  try {
    const deletedUser = await User.findById(req.params.id);
    if (!deletedUser)
      return res.status(400).json({ message: "user not found" });
    await User.findByIdAndDelete(req.params.id);
    await MatchRequest.deleteMany({
      $or: [{ senderId: req.params.id }, { receiverId: req.params.id }],
    });
    await Conversation.deleteMany({ members: { $in: [req.params.id] } });
    // await Notification.deleteMany({ userId: req.params.id });
    //delete his images
    deletedUser?.profile?.forEach((profileImage: any) => {
      const imagePath = path.resolve(
        __dirname,
        "..",
        "public",
        profileImage.filename
      );
      fs.unlinkSync(imagePath);
    });
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

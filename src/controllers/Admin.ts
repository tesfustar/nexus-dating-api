import { Request, Response } from "express";
import MatchRequest from "../models/MatchRequest";
import User from "../models/User";
import Messages from "../models/Messages";
import Conversation from "../models/Conversation";
import Notification from "../models/Notification";
import fs from "fs";
import path from "path";
//for dashboard Data
export const DashboardData = async (req: Request, res: Response) => {
  try {
    const users = await User.find().countDocuments();
    res.status(200).json({ success: true, users: users });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//get all users

export const UserDetailInfo = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) return res.status(400).json({ message: "user not found" });
    const userMatchesCount = await MatchRequest.find({
      $or: [{ senderId: id }, { receiverId: id }],
      isAccepted: true,
    }).count();
    const userMatches = await MatchRequest.find({
      $or: [{ senderId: id }, { receiverId: id }],
      isAccepted: true,
    });
    const userRejectedMatches = await MatchRequest.find({
      $or: [{ senderId: id }, { receiverId: id }],
      isRejected: true,
    });
    res.status(200).json({
      success: true,
      user: user,
      matchCount: userMatchesCount,
      userRejectedMatches: userRejectedMatches,
      userMatches: userMatches,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//get all users
export const GetAllUsers = async (req: Request, res: Response) => {
  try {
    const allUsers = await User.find();
    res.status(200).json({ success: true, data: allUsers });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//get single user
export const GetSingleUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(400).json({ message: "user not found! 😥" });
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//delete all users
export const DeleteAllUsers = async (req: Request, res: Response) => {
  try {
    await User.deleteMany();
    await MatchRequest.deleteMany();
    await Notification.deleteMany();
    await Messages.deleteMany();
    await Conversation.deleteMany();
    const publicFolderPath = path.resolve(__dirname, "..", "public");
    fs.readdir(publicFolderPath, (err, files) => {
      if (err) throw err;
      for (const file of files) {
        fs.unlinkSync(path.join(publicFolderPath, file));
      }
      res
        .status(200)
        .json({
          message: "all users and images deleted and database is cleared",
        });
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//delete single user
export const DeleteUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "user not found" });
    await User.findByIdAndDelete(req.params.id);
    await Notification.deleteMany({ userId: req.params.id });
    await MatchRequest.deleteMany({
      $or: [{ senderId: req.params.id }, { receiverId: req.params.id }],
    });
    res.status(200).json({ message: "user deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

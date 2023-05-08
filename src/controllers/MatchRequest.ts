import { Request, Response } from "express";
import MatchRequest from "../models/MatchRequest";
import Joi from "@hapi/joi";
import Notification from "../models/Notification";
import User from "../models/User";
import Conversation from "../models/Conversation";

//send request for his/his crush(match)
export const SendMatchRequest = async (req: Request, res: Response) => {
  try {
    const schema = Joi.object().keys({
      senderId: Joi.string().required(),
      receiverId: Joi.string().required(),
    });
    const joeResult = await schema.validateAsync(req.body);
    const user = await User.findOne({ _id: joeResult.receiverId });
    const senderUser = await User.findOne({ _id: joeResult.senderId });
    const oldRequest = await MatchRequest.findOne({
      senderId: joeResult.senderId,
      receiverId: joeResult.receiverId,
    });
    const isPreviousSent = await MatchRequest.findOne({
      senderId: joeResult.receiverId,
      receiverId: joeResult.senderId,
    });
    const isMatchedAccepted = await MatchRequest.findOne({
      $or: [
        {
          senderId: joeResult.senderId,
          receiverId: joeResult.receiverId,
        },
        {
          senderId: joeResult.receiverId,
          receiverId: joeResult.senderId,
        },
      ],
      isAccepted: true,
    });
    if (!user || !senderUser)
      return res.status(400).json({ message: "user not found! 😥" });
    if (isMatchedAccepted)
      return res.status(201).json({ message: "You are already matched" });
    if (oldRequest)
      return res
        .status(201)
        .json({ message: "You can not send request twice 😥" });
    if (user.gender === senderUser.gender)
      return res
        .status(400)
        .json({ message: "you can't send request to the same gender 😥" });
    if (isPreviousSent) {
      //update match request as accepted and create conversation
      const acceptRequest = await MatchRequest.findByIdAndUpdate(
        isPreviousSent.id,
        { isAccepted: true },
        { new: true }
      );

      //create new conversation
      const conversation = new Conversation({
        members: [joeResult.receiverId, joeResult.senderId],
      });
      const saveConversation = await conversation.save();
      const notification = new Notification({
        userId: joeResult.receiverId,
        profile: senderUser.profile[0]?.filename,
        message: `you have new like from ${senderUser.fullName}`,
      });
      const saveNotification = await notification.save();
      res.status(201).json({
        status: "Matched",
        message: "it's a match",
        data: [user, senderUser],
        // notification: saveNotification,
      });
      return;
    }
    const result = await MatchRequest.create({
      senderId: joeResult.senderId,
      receiverId: joeResult.receiverId,
    });
    const notification = new Notification({
      userId: joeResult.receiverId,
      profile: senderUser.profile[0]?.filename,
      message: `you have new like from ${senderUser.fullName}`,
    });
    const saveNotification = await notification.save();
    res.status(201).json({
      message: "match request succeed",
      data: joeResult,
      // notification: saveNotification,
    });
  } catch (error: any) {
    if (error.isJoi === true)
      return res.status(400).json({ message: error.details[0].message });

    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//accept match request
export const AcceptMatchRequest = async (req: Request, res: Response) => {
  try {
    const matchRequest = await MatchRequest.findOne({
      _id: req.params.id,
      isAccepted: false,
      isRejected: false,
    });
    if (!matchRequest)
      return res.status(400).json({ message: "request not found! 😥" });
    const receiverUser = await User.findOne({ _id: matchRequest.receiverId });
    if (!receiverUser)
      return res
        .status(400)
        .json({ message: "your account is not found sign in again 😥" });
    const acceptRequest = await MatchRequest.findByIdAndUpdate(
      req.params.id,
      { isAccepted: true },
      { new: true }
    );
    const notification = new Notification({
      userId: matchRequest.senderId,
      profile: receiverUser.profile[0]?.filename,
      message: `${receiverUser.fullName} accept your request, you can start chatting! 😍`,
    });

    //create conversation
    const conversation = new Conversation({
      members: [matchRequest.receiverId, matchRequest.senderId],
    });

    const saveConversation = await conversation.save();
    const saveNotification = await notification.save();
    res.status(200).json({
      message: "match request accepted successfully",
      data: acceptRequest,
      notification: saveNotification,
      conversation: saveConversation,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//reject match request

export const RejectMatchRequest = async (req: Request, res: Response) => {
  try {
    const matchRequest = await MatchRequest.findOne({
      _id: req.params.id,
      isAccepted: false,
      isRejected: false,
    });
    if (!matchRequest)
      return res.status(400).json({ message: "request not found! 😥" });
    const rejectRequest = await MatchRequest.findByIdAndUpdate(
      req.params.id,
      { isRejected: true },
      { new: true }
    );
    res.status(200).json({
      message: "match request rejected successfully",
      data: rejectRequest,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//get all match request
export const GetAllMyMatchRequest = async (req: Request, res: Response) => {
  try {
    const getAllMyRequest = await MatchRequest.find({
      receiverId: req.params.userId,
      isAccepted: false,
      isRejected: false,
    }).populate("senderId");
    res.status(200).json({
      message: "success",
      data: getAllMyRequest,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//get single match request
export const GetSingleMatchRequest = async (req: Request, res: Response) => {
    try {
      const getSingleRequest = await MatchRequest.findById(
        req.params.id
      ).populate("senderId");
      if (!getSingleRequest)
        return res.status(400).json({ message: "request not found! 😥" });
      res.status(200).json({
        message: "success",
        data: getSingleRequest,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Something went wrong please try later!", error });
    }
  };
  
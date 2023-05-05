import { Request, Response } from "express";
import mongoose from "mongoose";
import Conversation from "../models/Conversation";
import Messages from "../models/Messages";
import User from "../models/User";
import MatchRequest from "../models/MatchRequest";
//create conversation
export const CreateConversation = async (req: Request, res: Response) => {
  const newConversation = new Conversation(req.body);
  try {
    const saveConservation = await newConversation.save();
    res.status(201).json({ success: true, data: saveConservation });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};


//get my conversation

export const GetMyConversation = async (req: Request, res: Response) => {
    const { userId } = req.params;
    try {
     const changedId = new mongoose.Types.ObjectId(userId); // convert id to ObjectId
      // Get list of conversationId fields from messages collection
      const messages = await Messages.find({});
      const messagesFields = messages.map((message) => message.conversationId);
  
      //get conversation that are started message
      const conversations = await Conversation.find({
        members: { $in: [userId] },
        _id: { $in: messagesFields },
      }).populate("members");
      const filtered = conversations
        .map((item) => [
          {
            conversationId: item.id,
            members: item.members.filter((member:any) => member.id !== userId),
          },
        ])
        .flat();
  
      // Find conversation whose _id is not in the list of message fields
      const noMessageConversation = await Conversation.find({
        members: { $in: [userId] },
        _id: { $not: { $in: messagesFields } },
      }).populate("members");
      const filteredNoMessageConversation = noMessageConversation
        .map((item) => [
          {
            conversationId: item.id,
            members: item.members.filter((member:any) => member.id !== userId),
            createdAt: item?.createdAt,
          },
        ])
        .flat();
  
      //append last message on each conversation
      const lastMessage = await Conversation.aggregate([
        {
          $match: {
            members: { $in: [new mongoose.Types.ObjectId(userId)] },
          },
        },
        {
          $lookup: {
            from: "messages",
            localField: "_id",
            foreignField: "conversationId",
            as: "messages",
          },
        },
        {
          $unwind: "$messages",
        },
        {
          $sort: {
            "messages.createdAt": 1,
          },
        },
        {
          $group: {
            _id: "$_id",
            matchedAt: { $first: "$createdAt" },
            members: { $first: "$members" },
            last_message: { $last: "$messages" },
            unread_count: {
              $sum: {
                $cond: {
                  if: { $eq: ["$messages.readAt", null] },
                  then: 1,
                  else: 0,
                },
              },
            },
          },
        },
        {
          $sort: {
            "last_message.createdAt": -1,
          },
        },
        {
          $project: {
            matchedAt: 1,
            members: 1,
            last_message: 1,
            unread_count: {
              $cond: {
                if: { $ne: ["$last_message.senderId", userId] },
                then: "$unread_count",
                else: null,
              },
            },
          },
        },
      ]);
  
      await User.populate(lastMessage, { path: "members" });
      //filter members before send to the user
      const filterMembers = lastMessage
        .map((item) => [
          {
            conversationId: item._id,
            matchedAt: item.matchedAt,
            members: item.members.filter((member:any) => member.id !== userId),
            message: item.last_message,
            newMessageCount: item.unread_count,
          },
        ])
        .flat();
  
      res.status(200).json({
        success: true,
        data: filterMembers,
        noMessageConversation: filteredNoMessageConversation,
      });
    } catch (error) {
        res
        .status(500)
        .json({ message: "Something went wrong please try later!", error });
    }
};

//delete all conversation
export const DeleteAllConversation = async (req: Request, res: Response) => {
  try {
    await Conversation.deleteMany();

    res.status(200).json({ message: "all Conversation are deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//delete conversation
export const DeleteConversation = async (req: Request, res: Response) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if(!conversation) return res.status(400).json({message:"conversation not found!"})
    await MatchRequest.findOneAndUpdate(
      {
        $or: [
          {
            senderId: conversation.members[0],
            receiverId: conversation.members[1],
          },
          {
            senderId: conversation.members[1],
            receiverId: conversation.members[0],
          },
        ],
        isAccepted: true,
      },
      {
        $set: { isUnMatched: true },
      },
      { new: true }
    );
    await Conversation.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "conversation deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};
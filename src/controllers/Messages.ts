import { Request, Response } from "express";
import Messages from "../models/Messages";
import Conversation from "../models/Conversation";
import User from "../models/User";
//create Messages
export const CreateMessages = async (req: Request, res: Response) => {
  const newMessages = new Messages(req.body);
  try {
    const conversation = await Conversation.findById(req.body.conversationId);
    if (!conversation)
      return res.status(400).json({ message: "conversation not found! 😥" });
    const receiver = await User.findById(req.body.receiverId);
    if (!receiver)
      return res.status(400).json({ message: "receiver user not found! 😥" });
    console.log(receiver.blockedUsers.includes(req.body.senderId));
    if (receiver.blockedUsers.includes(req.body.senderId))
      return res
        .status(200)
        .json({ message: "you are blocked you can't send message 😥" });
    const saveMessages = await newMessages.save();
    res.status(201).json({ success: true, data: saveMessages });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//get my Messages

export const GetMyMessages = async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { userId } = req.query;
  try {
    const messages = await Messages.find({
      conversationId: conversationId,
    }).sort({
      createdAt: -1,
    });
    const conversation = await Conversation.findById(conversationId);
    if (!conversation)
      return res.status(400).json({ message: "conversation not found! 😥" });
    const user = conversation.members.some((member) => member == userId);
    if (!user)
      return res
        .status(400)
        .json({ message: "the user is not in this conversation!" });
    const lastMessage = await Messages.findOne({
      conversationId: conversationId,
    })
      .sort({
        createdAt: -1,
      })
      .limit(1);
    if (lastMessage?.receiverId == userId) {
      await Messages.updateMany(
        { conversationId: conversationId, readAt: null },
        { readAt: new Date() },
        { new: true }
      );
    }
    const updatedMessages = await Messages.find({
      conversationId: conversationId,
    }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, data: updatedMessages });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//get all message of the user

export const GetAllMyMessages = async (req: Request, res: Response) => {
  try {
    const allMessages = await Messages.find({
      $or: [{ senderId: req.params.id }, { receiverId: req.params.id }],
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({ success: true, data: allMessages });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//group message by day
export const GroupMessagesByDay = async (req: Request, res: Response) => {
  try {
    const messagesByDay = await Messages.aggregate([
      {
        $match: {
          $or: [{ senderId: req.params.id }, { receiverId: req.params.id }],
        },
      },
      {
        $project: {
          day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          conversationId: 1,
          text: 1,
          senderId: 1,
          receiverId: 1,
          readAt: 1,
          audio: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      },
      {
        $group: {
          _id: "$day",
          messages: { $push: "$$ROOT" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);
    res.status(200).json({ success: true, data: messagesByDay });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

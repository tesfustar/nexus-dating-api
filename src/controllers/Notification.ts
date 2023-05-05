import { Request, Response } from "express";
import Notification from "../models/Notification";
//get all notification
export const GetAllNotification = async (req: Request, res: Response) => {
  try {
    const getAllNotification = await Notification.find({
      userId: req.params.id,
    }).sort({
      createdAt: -1,
    });
    const getUnReadNotificationCount = await Notification.find({
      userId: req.params.id,
      readAt: null,
    }).count();
    res.status(200).json({
      message: "success",
      data: getAllNotification,
      count: getUnReadNotificationCount,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//get all notification
export const GetUnreadNotification = async (req: Request, res: Response) => {
  try {
    const getUnReadNotificationCount = await Notification.find({
      userId: req.params.id,
      readAt: null,
    }).count();
    res
      .status(200)
      .json({ message: "success", data: getUnReadNotificationCount });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//mark as read notification
export const MarkAsReadNotification = async (req: Request, res: Response) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification)
      return res.status(400).json({ message: "notification not found" });

    const updateNotification = await Notification.findByIdAndUpdate(
      req.params.id,
      { readAt: new Date() },
      { new: true }
    );
    res.status(200).json({ success: true, data: updateNotification });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

//mark all as read notification
export const MarkAllAsReadNotification = async (
  req: Request,
  res: Response
) => {
  try {
    const updateNotification = await Notification.updateMany(
      { userId: req.params.id, readAt: null },
      { readAt: new Date() },
      { new: true }
    );
    res.status(200).json({ success: true, data: updateNotification });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Something went wrong please try later!", error });
  }
};

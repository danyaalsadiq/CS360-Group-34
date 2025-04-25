import { NotificationModel, INotification } from '../models/notification';
import { UserModel } from '../models';

export class NotificationService {
  // Create a notification for a user
  async createNotification(notification: Partial<INotification>): Promise<INotification> {
    try {
      const newNotification = new NotificationModel(notification);
      return await newNotification.save();
    } catch (error: any) {
      throw new Error(`Error creating notification: ${error.message}`);
    }
  }

  // Create notifications for multiple users (e.g., both student and therapist)
  async createNotificationForMultipleUsers(userIds: string[], notificationData: Omit<Partial<INotification>, 'userId'>): Promise<INotification[]> {
    try {
      const notifications = await Promise.all(
        userIds.map(userId => this.createNotification({
          ...notificationData,
          userId
        }))
      );
      return notifications;
    } catch (error: any) {
      throw new Error(`Error creating notifications for multiple users: ${error.message}`);
    }
  }

  // Get all notifications for a user
  async getNotificationsByUserId(userId: string): Promise<INotification[]> {
    try {
      return await NotificationModel.find({ userId }).sort({ createdAt: -1 });
    } catch (error: any) {
      throw new Error(`Error fetching notifications: ${error.message}`);
    }
  }

  // Get unread notifications count for a user
  async getUnreadNotificationsCount(userId: string): Promise<number> {
    try {
      return await NotificationModel.countDocuments({ userId, isRead: false });
    } catch (error: any) {
      throw new Error(`Error counting unread notifications: ${error.message}`);
    }
  }

  // Mark a notification as read
  async markNotificationAsRead(notificationId: string): Promise<INotification | null> {
    try {
      return await NotificationModel.findByIdAndUpdate(
        notificationId,
        { isRead: true },
        { new: true }
      );
    } catch (error: any) {
      throw new Error(`Error marking notification as read: ${error.message}`);
    }
  }

  // Mark all notifications as read for a user
  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      await NotificationModel.updateMany(
        { userId, isRead: false },
        { isRead: true }
      );
    } catch (error: any) {
      throw new Error(`Error marking all notifications as read: ${error.message}`);
    }
  }

  // Delete a notification
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const result = await NotificationModel.findByIdAndDelete(notificationId);
      return !!result;
    } catch (error: any) {
      throw new Error(`Error deleting notification: ${error.message}`);
    }
  }
}
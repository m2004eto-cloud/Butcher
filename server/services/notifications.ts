/**
 * Unified Notification Service
 * Orchestrates SMS, Email, and Push notifications
 */

import type { NotificationType, NotificationChannel, Order, Notification } from "@shared/api";
import { db } from "../db";
import {
  sendSMS,
  sendOrderPlacedSMS,
  sendOrderConfirmedSMS,
  sendOrderProcessingSMS,
  sendOrderOutForDeliverySMS,
  sendOrderDeliveredSMS,
  sendOrderCancelledSMS,
  sendPaymentReceivedSMS,
  sendLowStockAlertSMS,
} from "./sms";
import {
  sendEmail,
  sendOrderPlacedEmail,
  sendOrderConfirmedEmail,
  sendOrderDeliveredEmail,
  sendOrderCancelledEmail,
  sendPaymentReceivedEmail,
  sendRefundEmail,
  sendLowStockAlertEmail,
} from "./email";

export interface NotificationResult {
  sms?: Notification;
  email?: Notification;
  push?: Notification;
}

// Check if user has notifications enabled for a channel
function isChannelEnabled(userId: string, channel: NotificationChannel): boolean {
  const user = db.users.get(userId);
  if (!user) return false;

  switch (channel) {
    case "sms":
      return user.preferences.smsNotifications;
    case "email":
      return user.preferences.emailNotifications;
    case "push":
      return true; // Push notifications always enabled by default
    default:
      return false;
  }
}

// Send order status notifications
export async function sendOrderNotification(
  order: Order,
  type: NotificationType,
  options?: {
    driverName?: string;
    driverPhone?: string;
    amount?: number;
  }
): Promise<NotificationResult> {
  const result: NotificationResult = {};
  const user = db.users.get(order.userId);

  // Determine which channels to use based on notification type and user preferences
  const channels: NotificationChannel[] = [];

  if (isChannelEnabled(order.userId, "sms")) {
    channels.push("sms");
  }
  if (isChannelEnabled(order.userId, "email")) {
    channels.push("email");
  }

  // Send notifications in parallel
  const promises: Promise<void>[] = [];

  if (channels.includes("sms")) {
    const smsPromise = (async () => {
      switch (type) {
        case "order_placed":
          result.sms = await sendOrderPlacedSMS(order);
          break;
        case "order_confirmed":
          result.sms = await sendOrderConfirmedSMS(order);
          break;
        case "order_processing":
          result.sms = await sendOrderProcessingSMS(order);
          break;
        case "order_shipped":
          result.sms = await sendOrderOutForDeliverySMS(order, options?.driverName, options?.driverPhone);
          break;
        case "order_delivered":
          result.sms = await sendOrderDeliveredSMS(order);
          break;
        case "order_cancelled":
          result.sms = await sendOrderCancelledSMS(order);
          break;
        case "payment_received":
          result.sms = await sendPaymentReceivedSMS(order);
          break;
      }
    })();
    promises.push(smsPromise);
  }

  if (channels.includes("email")) {
    const emailPromise = (async () => {
      switch (type) {
        case "order_placed":
          result.email = await sendOrderPlacedEmail(order);
          break;
        case "order_confirmed":
          result.email = await sendOrderConfirmedEmail(order);
          break;
        case "order_delivered":
          result.email = await sendOrderDeliveredEmail(order);
          break;
        case "order_cancelled":
          result.email = await sendOrderCancelledEmail(order);
          break;
        case "payment_received":
          result.email = await sendPaymentReceivedEmail(order);
          break;
        case "refund_processed":
          result.email = await sendRefundEmail(order, options?.amount || 0);
          break;
      }
    })();
    promises.push(emailPromise);
  }

  await Promise.all(promises);

  console.log(`📬 Sent ${type} notifications for order ${order.orderNumber}:`, {
    sms: result.sms?.status,
    email: result.email?.status,
  });

  return result;
}

// Send low stock alerts to admins
export async function sendLowStockNotifications(
  productName: string,
  quantity: number,
  threshold: number
): Promise<NotificationResult[]> {
  // Get all admin users
  const admins = Array.from(db.users.values()).filter((u) => u.role === "admin" && u.isActive);

  const results: NotificationResult[] = [];

  for (const admin of admins) {
    const result: NotificationResult = {};

    if (admin.preferences.smsNotifications) {
      result.sms = await sendLowStockAlertSMS(admin.mobile, productName, quantity);
    }

    if (admin.preferences.emailNotifications) {
      result.email = await sendLowStockAlertEmail(admin.email, productName, quantity, threshold);
    }

    results.push(result);
  }

  return results;
}

// Get notification history for a user
export function getUserNotifications(userId: string, limit = 50): Notification[] {
  return db.notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

// Get all notifications (admin)
export function getAllNotifications(limit = 100): Notification[] {
  return db.notifications
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

// Get notification stats
export function getNotificationStats(): {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  byType: Record<NotificationType, number>;
  byChannel: Record<NotificationChannel, number>;
} {
  const notifications = db.notifications;

  const byType: Record<string, number> = {};
  const byChannel: Record<string, number> = {};

  notifications.forEach((n) => {
    byType[n.type] = (byType[n.type] || 0) + 1;
    byChannel[n.channel] = (byChannel[n.channel] || 0) + 1;
  });

  return {
    total: notifications.length,
    sent: notifications.filter((n) => n.status === "sent" || n.status === "delivered").length,
    failed: notifications.filter((n) => n.status === "failed").length,
    pending: notifications.filter((n) => n.status === "pending").length,
    byType: byType as Record<NotificationType, number>,
    byChannel: byChannel as Record<NotificationChannel, number>,
  };
}

// Re-export individual services for direct use
export { sendSMS, sendEmail };

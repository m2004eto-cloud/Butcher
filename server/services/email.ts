/**
 * Email Notification Service
 * In production, integrate with SendGrid, Mailgun, AWS SES, or similar
 */

import type { EmailNotificationPayload, Notification, NotificationType, Order } from "@shared/api";
import { db, generateId } from "../db";

// Email Templates
const EMAIL_TEMPLATES: Record<NotificationType, { subject: { en: string; ar: string }; body: { en: string; ar: string } }> = {
  order_placed: {
    subject: {
      en: "Order Confirmed - #{orderNumber}",
      ar: "تم تأكيد الطلب - #{orderNumber}",
    },
    body: {
      en: `
        <h2>Thank you for your order!</h2>
        <p>Your order <strong>#{orderNumber}</strong> has been received and is being processed.</p>
        <h3>Order Summary</h3>
        <table style="width: 100%; border-collapse: collapse;">
          {itemsTable}
        </table>
        <p><strong>Subtotal:</strong> AED {subtotal}</p>
        <p><strong>VAT (5%):</strong> AED {vat}</p>
        <p><strong>Delivery:</strong> AED {deliveryFee}</p>
        <h3>Total: AED {total}</h3>
        <h3>Delivery Address</h3>
        <p>{deliveryAddress}</p>
        <p>Track your order: <a href="{trackingUrl}">{trackingUrl}</a></p>
        <p>Thank you for choosing Butcher Shop! 🥩</p>
      `,
      ar: `
        <h2 dir="rtl">شكراً لطلبك!</h2>
        <p dir="rtl">تم استلام طلبك <strong>#{orderNumber}</strong> وجاري معالجته.</p>
        <h3 dir="rtl">ملخص الطلب</h3>
        <table style="width: 100%; border-collapse: collapse;" dir="rtl">
          {itemsTable}
        </table>
        <p dir="rtl"><strong>المجموع الفرعي:</strong> {subtotal} درهم</p>
        <p dir="rtl"><strong>ضريبة القيمة المضافة (5%):</strong> {vat} درهم</p>
        <p dir="rtl"><strong>التوصيل:</strong> {deliveryFee} درهم</p>
        <h3 dir="rtl">الإجمالي: {total} درهم</h3>
        <h3 dir="rtl">عنوان التوصيل</h3>
        <p dir="rtl">{deliveryAddress}</p>
        <p dir="rtl">تتبع طلبك: <a href="{trackingUrl}">{trackingUrl}</a></p>
        <p dir="rtl">شكراً لاختياركم الجزار! 🥩</p>
      `,
    },
  },
  order_confirmed: {
    subject: {
      en: "Order #{orderNumber} Confirmed - Preparing Your Order",
      ar: "تم تأكيد الطلب #{orderNumber} - جاري تحضير طلبك",
    },
    body: {
      en: `
        <h2>Your order is confirmed!</h2>
        <p>Great news! Your order <strong>#{orderNumber}</strong> has been confirmed and our team is now preparing it.</p>
        <p><strong>Estimated Delivery:</strong> {estimatedTime}</p>
        <p>We'll notify you when your order is ready for delivery.</p>
      `,
      ar: `
        <h2 dir="rtl">تم تأكيد طلبك!</h2>
        <p dir="rtl">خبر رائع! تم تأكيد طلبك <strong>#{orderNumber}</strong> وفريقنا يقوم الآن بتحضيره.</p>
        <p dir="rtl"><strong>وقت التسليم المتوقع:</strong> {estimatedTime}</p>
        <p dir="rtl">سنخبرك عندما يكون طلبك جاهزاً للتوصيل.</p>
      `,
    },
  },
  order_processing: {
    subject: {
      en: "Order #{orderNumber} - Being Prepared",
      ar: "الطلب #{orderNumber} - جاري التحضير",
    },
    body: {
      en: `
        <h2>Your order is being prepared!</h2>
        <p>Our expert butchers are now preparing your order <strong>#{orderNumber}</strong> with care.</p>
        <p>We ensure only the freshest and highest quality meat for you.</p>
      `,
      ar: `
        <h2 dir="rtl">جاري تحضير طلبك!</h2>
        <p dir="rtl">جزارونا المحترفون يقومون الآن بتحضير طلبك <strong>#{orderNumber}</strong> بعناية.</p>
        <p dir="rtl">نضمن لكم أفضل جودة وأطزج لحوم.</p>
      `,
    },
  },
  order_ready: {
    subject: {
      en: "Order #{orderNumber} - Ready for Pickup",
      ar: "الطلب #{orderNumber} - جاهز للاستلام",
    },
    body: {
      en: `
        <h2>Your order is ready!</h2>
        <p>Your order <strong>#{orderNumber}</strong> has been prepared and is ready for pickup by our delivery team.</p>
        <p>Your delivery driver will pick it up shortly.</p>
      `,
      ar: `
        <h2 dir="rtl">طلبك جاهز!</h2>
        <p dir="rtl">تم تحضير طلبك <strong>#{orderNumber}</strong> وهو جاهز للاستلام من فريق التوصيل.</p>
        <p dir="rtl">سائق التوصيل سيستلمه قريباً.</p>
      `,
    },
  },
  order_shipped: {
    subject: {
      en: "Order #{orderNumber} - On Its Way! 🚗",
      ar: "الطلب #{orderNumber} - في الطريق إليك! 🚗",
    },
    body: {
      en: `
        <h2>Your order is on its way!</h2>
        <p>Your order <strong>#{orderNumber}</strong> is now out for delivery.</p>
        <h3>Delivery Driver</h3>
        <p><strong>Name:</strong> {driverName}</p>
        <p><strong>Phone:</strong> {driverPhone}</p>
        <p>Track your delivery: <a href="{trackingUrl}">{trackingUrl}</a></p>
      `,
      ar: `
        <h2 dir="rtl">طلبك في الطريق إليك!</h2>
        <p dir="rtl">طلبك <strong>#{orderNumber}</strong> الآن في طريقه إليك.</p>
        <h3 dir="rtl">سائق التوصيل</h3>
        <p dir="rtl"><strong>الاسم:</strong> {driverName}</p>
        <p dir="rtl"><strong>الهاتف:</strong> {driverPhone}</p>
        <p dir="rtl">تتبع التوصيل: <a href="{trackingUrl}">{trackingUrl}</a></p>
      `,
    },
  },
  order_delivered: {
    subject: {
      en: "Order #{orderNumber} Delivered - Enjoy Your Meal! 🥩",
      ar: "تم تسليم الطلب #{orderNumber} - بالعافية! 🥩",
    },
    body: {
      en: `
        <h2>Your order has been delivered!</h2>
        <p>Your order <strong>#{orderNumber}</strong> has been successfully delivered.</p>
        <p>We hope you enjoy your fresh meat! Thank you for choosing Butcher Shop.</p>
        <p>If you have any questions or feedback, please don't hesitate to contact us.</p>
        <p><a href="https://butcher.ae/feedback">Leave a Review</a></p>
      `,
      ar: `
        <h2 dir="rtl">تم تسليم طلبك!</h2>
        <p dir="rtl">تم تسليم طلبك <strong>#{orderNumber}</strong> بنجاح.</p>
        <p dir="rtl">نتمنى لكم وجبة شهية! شكراً لاختياركم الجزار.</p>
        <p dir="rtl">إذا كان لديكم أي استفسارات أو ملاحظات، لا تترددوا في التواصل معنا.</p>
        <p dir="rtl"><a href="https://butcher.ae/feedback">اترك تقييماً</a></p>
      `,
    },
  },
  order_cancelled: {
    subject: {
      en: "Order #{orderNumber} Cancelled",
      ar: "تم إلغاء الطلب #{orderNumber}",
    },
    body: {
      en: `
        <h2>Your order has been cancelled</h2>
        <p>Your order <strong>#{orderNumber}</strong> has been cancelled.</p>
        <p>If you paid by card, your refund will be processed within 3-5 business days.</p>
        <p>We're sorry to see you go. If you have any questions, please contact our support team.</p>
      `,
      ar: `
        <h2 dir="rtl">تم إلغاء طلبك</h2>
        <p dir="rtl">تم إلغاء طلبك <strong>#{orderNumber}</strong>.</p>
        <p dir="rtl">إذا دفعت بالبطاقة، سيتم استرداد المبلغ خلال 3-5 أيام عمل.</p>
        <p dir="rtl">نأسف لذلك. إذا كان لديكم أي استفسارات، يرجى التواصل مع فريق الدعم.</p>
      `,
    },
  },
  payment_received: {
    subject: {
      en: "Payment Received - Order #{orderNumber}",
      ar: "تم استلام الدفعة - الطلب #{orderNumber}",
    },
    body: {
      en: `
        <h2>Payment Received</h2>
        <p>We've received your payment of <strong>AED {amount}</strong> for order <strong>#{orderNumber}</strong>.</p>
        <p>Thank you for your payment!</p>
      `,
      ar: `
        <h2 dir="rtl">تم استلام الدفعة</h2>
        <p dir="rtl">تم استلام دفعتك بقيمة <strong>{amount} درهم</strong> للطلب <strong>#{orderNumber}</strong>.</p>
        <p dir="rtl">شكراً لكم!</p>
      `,
    },
  },
  payment_failed: {
    subject: {
      en: "Payment Failed - Order #{orderNumber}",
      ar: "فشل الدفع - الطلب #{orderNumber}",
    },
    body: {
      en: `
        <h2>Payment Failed</h2>
        <p>Unfortunately, the payment for order <strong>#{orderNumber}</strong> failed.</p>
        <p>Please update your payment method and try again, or contact your bank for assistance.</p>
        <p><a href="https://butcher.ae/orders/{orderId}/payment">Retry Payment</a></p>
      `,
      ar: `
        <h2 dir="rtl">فشل الدفع</h2>
        <p dir="rtl">للأسف، فشل الدفع للطلب <strong>#{orderNumber}</strong>.</p>
        <p dir="rtl">يرجى تحديث طريقة الدفع والمحاولة مرة أخرى، أو التواصل مع البنك للمساعدة.</p>
        <p dir="rtl"><a href="https://butcher.ae/orders/{orderId}/payment">إعادة المحاولة</a></p>
      `,
    },
  },
  refund_processed: {
    subject: {
      en: "Refund Processed - Order #{orderNumber}",
      ar: "تم معالجة الاسترداد - الطلب #{orderNumber}",
    },
    body: {
      en: `
        <h2>Refund Processed</h2>
        <p>A refund of <strong>AED {amount}</strong> has been processed for order <strong>#{orderNumber}</strong>.</p>
        <p>The refund will reflect in your account within 5-7 business days.</p>
      `,
      ar: `
        <h2 dir="rtl">تم معالجة الاسترداد</h2>
        <p dir="rtl">تم معالجة استرداد بقيمة <strong>{amount} درهم</strong> للطلب <strong>#{orderNumber}</strong>.</p>
        <p dir="rtl">سيظهر الاسترداد في حسابك خلال 5-7 أيام عمل.</p>
      `,
    },
  },
  low_stock: {
    subject: {
      en: "⚠️ Low Stock Alert - {productName}",
      ar: "⚠️ تنبيه انخفاض المخزون - {productName}",
    },
    body: {
      en: `
        <h2>Low Stock Alert</h2>
        <p>The following product is running low on stock:</p>
        <p><strong>Product:</strong> {productName}</p>
        <p><strong>Current Quantity:</strong> {quantity}</p>
        <p><strong>Threshold:</strong> {threshold}</p>
        <p>Please consider restocking soon to avoid stockouts.</p>
      `,
      ar: `
        <h2 dir="rtl">تنبيه انخفاض المخزون</h2>
        <p dir="rtl">المنتج التالي منخفض المخزون:</p>
        <p dir="rtl"><strong>المنتج:</strong> {productName}</p>
        <p dir="rtl"><strong>الكمية الحالية:</strong> {quantity}</p>
        <p dir="rtl"><strong>الحد الأدنى:</strong> {threshold}</p>
        <p dir="rtl">يرجى إعادة التوريد قريباً لتجنب نفاد المخزون.</p>
      `,
    },
  },
  promotional: {
    subject: {
      en: "{subject}",
      ar: "{subjectAr}",
    },
    body: {
      en: "{body}",
      ar: "{bodyAr}",
    },
  },
};

// Email wrapper template
function wrapEmailInTemplate(content: string, language: "en" | "ar" = "en"): string {
  const dir = language === "ar" ? "rtl" : "ltr";
  return `
    <!DOCTYPE html>
    <html dir="${dir}" lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          line-height: 1.6; 
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        h2 { color: #C41E3A; }
        h3 { color: #333; }
        a { color: #C41E3A; }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0;
        }
        th, td { 
          padding: 10px; 
          text-align: left; 
          border-bottom: 1px solid #ddd; 
        }
        th { background-color: #f5f5f5; }
        .footer { 
          margin-top: 40px; 
          padding-top: 20px; 
          border-top: 1px solid #ddd;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #C41E3A;">🥩 Butcher Shop</h1>
      </div>
      ${content}
      <div class="footer">
        <p>Butcher Shop - Premium Fresh Meat Delivered</p>
        <p>Dubai, UAE | support@butcher.ae | +971 50 123 4567</p>
        <p><a href="https://butcher.ae/unsubscribe">Unsubscribe</a></p>
      </div>
    </body>
    </html>
  `;
}

// Template variable replacer
function replaceTemplateVars(template: string, data: Record<string, unknown>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const value = data[key];
    return value !== undefined ? String(value) : `{${key}}`;
  });
}

// Email Gateway Integration (mock for demo)
async function sendEmailViaGateway(payload: EmailNotificationPayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // In production, integrate with actual email service:
  // - SendGrid: https://docs.sendgrid.com/
  // - Mailgun: https://documentation.mailgun.com/
  // - AWS SES: https://docs.aws.amazon.com/ses/
  // - Resend: https://resend.com/docs

  console.log(`📧 Email to ${payload.to}:`, payload.subject);

  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // Simulate success (98% success rate for email)
  if (Math.random() > 0.02) {
    return {
      success: true,
      messageId: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  return {
    success: false,
    error: "Email service temporarily unavailable",
  };
}

// Main email sending function
export async function sendEmail(
  to: string,
  type: NotificationType,
  data: Record<string, unknown>,
  language: "en" | "ar" = "en"
): Promise<Notification> {
  const template = EMAIL_TEMPLATES[type];
  const subject = replaceTemplateVars(language === "ar" ? template.subject.ar : template.subject.en, data);
  const bodyContent = replaceTemplateVars(language === "ar" ? template.body.ar : template.body.en, data);
  const body = wrapEmailInTemplate(bodyContent, language);

  const notification: Notification = {
    id: generateId("notif"),
    userId: data.userId as string || "",
    type,
    channel: "email",
    title: subject,
    message: bodyContent,
    status: "pending",
    metadata: data,
    createdAt: new Date().toISOString(),
  };

  try {
    const result = await sendEmailViaGateway({ to, subject, body });

    if (result.success) {
      notification.status = "sent";
      notification.sentAt = new Date().toISOString();
    } else {
      notification.status = "failed";
      notification.failureReason = result.error;
    }
  } catch (error) {
    notification.status = "failed";
    notification.failureReason = error instanceof Error ? error.message : "Unknown error";
  }

  // Store notification
  db.notifications.push(notification);

  return notification;
}

// Order-specific email helpers
export async function sendOrderPlacedEmail(order: Order): Promise<Notification> {
  const user = db.users.get(order.userId);
  const language = user?.preferences.language || "en";

  // Build items table
  const itemsTable = order.items.map((item) => `
    <tr>
      <td>${item.productName}</td>
      <td>${item.quantity}</td>
      <td>AED ${item.unitPrice.toFixed(2)}</td>
      <td>AED ${item.totalPrice.toFixed(2)}</td>
    </tr>
  `).join("");

  const address = order.deliveryAddress;
  const deliveryAddress = `${address.building}, ${address.street}, ${address.area}, ${address.emirate}`;

  return sendEmail(order.customerEmail, "order_placed", {
    userId: order.userId,
    orderNumber: order.orderNumber,
    itemsTable: `
      <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
      ${itemsTable}
    `,
    subtotal: order.subtotal.toFixed(2),
    vat: order.vatAmount.toFixed(2),
    deliveryFee: order.deliveryFee.toFixed(2),
    total: order.total.toFixed(2),
    deliveryAddress,
    trackingUrl: `https://butcher.ae/track/${order.orderNumber}`,
  }, language);
}

export async function sendOrderConfirmedEmail(order: Order): Promise<Notification> {
  const user = db.users.get(order.userId);
  const language = user?.preferences.language || "en";

  return sendEmail(order.customerEmail, "order_confirmed", {
    userId: order.userId,
    orderNumber: order.orderNumber,
    estimatedTime: order.estimatedDeliveryAt || "45-60 minutes",
  }, language);
}

export async function sendOrderDeliveredEmail(order: Order): Promise<Notification> {
  const user = db.users.get(order.userId);
  const language = user?.preferences.language || "en";

  return sendEmail(order.customerEmail, "order_delivered", {
    userId: order.userId,
    orderNumber: order.orderNumber,
  }, language);
}

export async function sendOrderCancelledEmail(order: Order): Promise<Notification> {
  const user = db.users.get(order.userId);
  const language = user?.preferences.language || "en";

  return sendEmail(order.customerEmail, "order_cancelled", {
    userId: order.userId,
    orderNumber: order.orderNumber,
  }, language);
}

export async function sendPaymentReceivedEmail(order: Order): Promise<Notification> {
  const user = db.users.get(order.userId);
  const language = user?.preferences.language || "en";

  return sendEmail(order.customerEmail, "payment_received", {
    userId: order.userId,
    orderNumber: order.orderNumber,
    amount: order.total.toFixed(2),
  }, language);
}

export async function sendRefundEmail(order: Order, amount: number): Promise<Notification> {
  const user = db.users.get(order.userId);
  const language = user?.preferences.language || "en";

  return sendEmail(order.customerEmail, "refund_processed", {
    userId: order.userId,
    orderNumber: order.orderNumber,
    amount: amount.toFixed(2),
  }, language);
}

export async function sendLowStockAlertEmail(adminEmail: string, productName: string, quantity: number, threshold: number): Promise<Notification> {
  return sendEmail(adminEmail, "low_stock", {
    productName,
    quantity,
    threshold,
  }, "en");
}

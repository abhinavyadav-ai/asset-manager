import { Resend } from 'resend';

// WARNING: Never cache the client - access tokens expire
// Always call getUncachableResendClient() to get a fresh client
async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  const connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

// Always create a new client per request - tokens expire
export async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  email: string | null;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  items: OrderItem[] | unknown;
  subtotal: number;
  discountCode: string | null;
  discountAmount: number | null;
  shipping: number | null;
  total: number;
  paymentMethod: string;
  paymentStatus: string | null;
  status: string | null;
  createdAt: Date | null;
}

function getPaymentMethodName(method: string): string {
  switch (method) {
    case 'upi': return 'UPI Direct';
    case 'razorpay': return 'Card/Netbanking (Razorpay)';
    default: return method;
  }
}

export async function sendInvoiceEmail(order: Order, invoiceUrl: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    if (!order.email) {
      return { success: false, error: 'Customer email not available' };
    }

    const items = order.items as OrderItem[];
    const itemsHtml = items.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
  <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <div style="background: linear-gradient(135deg, #F5A623 0%, #D4920A 100%); padding: 30px; text-align: center;">
      <h1 style="color: #000; font-size: 28px; font-weight: 700; letter-spacing: 3px; margin: 0;">LUXE CANDLE</h1>
      <p style="color: #000; opacity: 0.8; margin: 5px 0 0 0;">Premium Luxury Candles</p>
    </div>
    
    <div style="padding: 30px;">
      <h2 style="color: #333; margin: 0 0 20px 0;">Thank you for your order!</h2>
      <p style="color: #666; line-height: 1.6;">Dear ${order.customerName},</p>
      <p style="color: #666; line-height: 1.6;">Your order has been successfully placed. Please find your invoice details below.</p>
      
      <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #F5A623; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Order Details</h3>
        <p style="color: #333; margin: 5px 0;"><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p style="color: #333; margin: 5px 0;"><strong>Date:</strong> ${new Date(order.createdAt || new Date()).toLocaleDateString('en-IN')}</p>
        <p style="color: #333; margin: 5px 0;"><strong>Payment Method:</strong> ${getPaymentMethodName(order.paymentMethod)}</p>
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #333;">
            <th style="color: #F5A623; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase;">Item</th>
            <th style="color: #F5A623; padding: 12px; text-align: center; font-size: 12px; text-transform: uppercase;">Qty</th>
            <th style="color: #F5A623; padding: 12px; text-align: right; font-size: 12px; text-transform: uppercase;">Price</th>
            <th style="color: #F5A623; padding: 12px; text-align: right; font-size: 12px; text-transform: uppercase;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #666;">
          <span>Subtotal</span>
          <span>₹${order.subtotal.toFixed(2)}</span>
        </div>
        ${order.discountAmount && order.discountAmount > 0 ? `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #22c55e;">
          <span>Discount ${order.discountCode ? `(${order.discountCode})` : ''}</span>
          <span>-₹${order.discountAmount.toFixed(2)}</span>
        </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; padding: 8px 0; color: #666;">
          <span>Shipping</span>
          <span>${(order.shipping ?? 0) === 0 ? 'FREE' : `₹${(order.shipping ?? 0).toFixed(2)}`}</span>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 15px 0 0 0; margin-top: 10px; border-top: 1px solid #ddd; color: #F5A623; font-size: 20px; font-weight: 700;">
          <span>Total Amount</span>
          <span>₹${order.total.toFixed(2)}</span>
        </div>
      </div>
      
      <div style="background: #f9f9f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
        <h3 style="color: #F5A623; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px;">Delivery Address</h3>
        <p style="color: #333; margin: 5px 0;">${order.customerName}</p>
        <p style="color: #666; margin: 5px 0;">${order.address}</p>
        <p style="color: #666; margin: 5px 0;">${order.city}, ${order.state} - ${order.pincode}</p>
        <p style="color: #666; margin: 5px 0;">Phone: ${order.phone}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${invoiceUrl}" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #F5A623 0%, #D4920A 100%); color: #000; text-decoration: none; border-radius: 8px; font-weight: 600;">View Full Invoice</a>
      </div>
    </div>
    
    <div style="text-align: center; padding: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
      <p style="margin: 5px 0;">Thank you for shopping with Luxe Candle!</p>
      <p style="margin: 5px 0;">For queries: luxebyras@gmail.com | +91 9279547350</p>
    </div>
  </div>
</body>
</html>
    `;

    await client.emails.send({
      from: fromEmail,
      to: order.email,
      subject: `Your Luxe Candle Order Invoice - ${order.orderNumber}`,
      html: emailHtml
    });

    return { success: true };
  } catch (error: any) {
    console.error('Failed to send invoice email:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

import crypto from 'crypto';
import { getSettings } from './settings';

const hashData = (data: string) => {
  if (!data) return '';
  return crypto.createHash('sha256').update(data.trim().toLowerCase()).digest('hex');
};

export const sendCAPIPurchaseEvent = async (
  orderData: { name: string; phone: string; city: string; price: number },
  eventId: string,
  clientIp?: string,
  userAgent?: string,
  fbc?: string,
  fbp?: string
) => {
  const settings = await getSettings();
  const { facebookPixelId, facebookAccessToken } = settings;

  if (!facebookPixelId || !facebookAccessToken) {
    return; // CAPI not configured
  }

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        action_source: 'website',
        event_id: eventId,
        user_data: {
          client_ip_address: clientIp,
          client_user_agent: userAgent,
          fbc: fbc || undefined,
          fbp: fbp || undefined,
          ph: orderData.phone ? [hashData(orderData.phone.replace(/\D/g, ''))] : [],
          fn: orderData.name ? [hashData(orderData.name.split(' ')[0])] : [],
          ct: orderData.city ? [hashData(orderData.city)] : [],
          country: [hashData('ma')], // Assuming Morocco based on context
        },
        custom_data: {
          currency: 'MAD',
          value: orderData.price,
        },
      },
    ],
  };

  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${facebookPixelId}/events?access_token=${facebookAccessToken}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    if (!response.ok) {
      console.error('FB CAPI Error:', result);
    }
  } catch (error) {
    console.error('Failed to send FB CAPI Event:', error);
  }
};

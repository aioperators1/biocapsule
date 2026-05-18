export const generateEventId = () => {
  return 'evt_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
};

type TrackingEvent = 'PageView' | 'AddToCart' | 'InitiateCheckout' | 'Purchase';

const formatMoroccanPhone = (phone: string) => {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, ''); // Keep only digits
  if (cleaned.startsWith('0')) {
    cleaned = '212' + cleaned.substring(1);
  }
  return cleaned ? '+' + cleaned : '';
};

export const trackEvent = (eventName: TrackingEvent, data: any = {}, eventId?: string) => {
  if (typeof window === 'undefined') return;

  const w = window as any;

  // Standard main product info to auto-fill missing parameters
  const defaultProduct = {
    id: 'bio_capsule_2x',
    name: 'BIO-CAPSULE 2X PACK',
    price: 249,
    quantity: 1
  };

  const value = data.value || 249;
  const currency = data.currency || 'MAD';

  // 1. Prepare Facebook Data
  const fbData = { ...data };
  if (eventName === 'Purchase' || eventName === 'InitiateCheckout' || eventName === 'AddToCart') {
    fbData.value = value;
    fbData.currency = currency;
    if (!fbData.content_type) fbData.content_type = 'product';
    if (!fbData.contents) {
      fbData.contents = [{
        id: defaultProduct.id,
        quantity: defaultProduct.quantity
      }];
    }
  }

  // 2. Prepare Snapchat Data
  const snapData = { ...data };
  if (eventName === 'Purchase' || eventName === 'InitiateCheckout' || eventName === 'AddToCart') {
    snapData.price = value;
    snapData.currency = currency;
    if (!snapData.item_ids) snapData.item_ids = [defaultProduct.id];
  }

  // Facebook Pixel
  if (w.fbq) {
    w.fbq('track', eventName, fbData, { eventID: eventId });
  }

  // Snapchat Pixel
  if (w.snaptr) {
    const snapEventName = getSnapchatEventName(eventName);
    w.snaptr('track', snapEventName, snapData);
  }
};

const getSnapchatEventName = (eventName: TrackingEvent) => {
  switch (eventName) {
    case 'PageView': return 'PAGE_VIEW';
    case 'AddToCart': return 'ADD_CART';
    case 'InitiateCheckout': return 'START_CHECKOUT';
    case 'Purchase': return 'PURCHASE';
    default: return eventName;
  }
};

export const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
  return null;
};

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

  // 3. Prepare TikTok Data
  const ttData = { ...data };
  if (eventName === 'Purchase' || eventName === 'InitiateCheckout' || eventName === 'AddToCart') {
    ttData.value = value;
    ttData.currency = currency;
    if (!ttData.content_type) ttData.content_type = 'product';
    if (!ttData.contents) {
      ttData.contents = [{
        content_id: defaultProduct.id,
        content_type: 'product',
        content_name: defaultProduct.name,
        quantity: defaultProduct.quantity,
        price: defaultProduct.price
      }];
    }
  }

  // TikTok Advanced Matching
  if (w.ttq && data.phone) {
    const formattedPhone = formatMoroccanPhone(data.phone);
    if (formattedPhone) {
      w.ttq.identify({
        phone_number: formattedPhone
      });
    }
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

  // TikTok Pixel
  if (w.ttq) {
    const ttqEventName = getTikTokEventName(eventName);
    const options = eventId ? { event_id: eventId } : undefined;
    w.ttq.track(ttqEventName, ttData, options);
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

const getTikTokEventName = (eventName: TrackingEvent) => {
  switch (eventName) {
    case 'PageView': return 'ViewContent';
    case 'AddToCart': return 'AddToCart';
    case 'InitiateCheckout': return 'InitiateCheckout';
    case 'Purchase': return 'CompletePayment';
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

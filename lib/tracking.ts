export const generateEventId = () => {
  return 'evt_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
};

type TrackingEvent = 'PageView' | 'AddToCart' | 'InitiateCheckout' | 'Purchase';

export const trackEvent = (eventName: TrackingEvent, data: any = {}, eventId?: string) => {
  if (typeof window === 'undefined') return;

  const w = window as any;
  const fbc = getCookie('_fbc');
  const fbp = getCookie('_fbp');

  // Facebook Pixel
  if (w.fbq) {
    w.fbq('track', eventName, data, { eventID: eventId });
  }

  // Snapchat Pixel
  if (w.snaptr) {
    const snapEventName = getSnapchatEventName(eventName);
    w.snaptr('track', snapEventName, data);
  }

  // TikTok Pixel
  if (w.ttq) {
    const ttqEventName = getTikTokEventName(eventName);
    const options = eventId ? { event_id: eventId } : undefined;
    w.ttq.track(ttqEventName, data, options);
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

import { NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile } from '@/lib/data';
import { sendCAPIPurchaseEvent } from '@/lib/capi';

type Order = {
  id: string;
  name: string;
  phone: string;
  city: string;
  address: string;
  status: string;
  source: string;
  date: string;
  confirmedBy?: string;
};

export async function GET() {
  try {
    const orders = readJsonFile<Order[]>('orders.json', []);
    return NextResponse.json(orders);
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, city, address, source, eventId, fbc, fbp } = body;
    
    // Get headers for CAPI
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const userAgent = request.headers.get('user-agent') || '';

    // For normal orders, require fields. For whatsapp orders, use defaults.
    const isWhatsapp = source === 'whatsapp';
    
    if (!isWhatsapp && (!name || !phone || !city || !address)) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const orders = readJsonFile<Order[]>('orders.json', []);
    
    const newOrder: Order = {
      id: Date.now().toString(),
      name: name || (isWhatsapp ? 'طلب عبر الواتساب' : ''),
      phone: phone || (isWhatsapp ? 'واتساب' : ''),
      city: city || (isWhatsapp ? '-' : ''),
      address: address || (isWhatsapp ? '-' : ''),
      status: 'Pending',
      source: source || 'website',
      date: new Date().toISOString()
    };
    
    orders.push(newOrder);
    writeJsonFile('orders.json', orders);
    
    // Trigger Server-Side Tracking for non-whatsapp (since whatsapp goes away from site)
    if (!isWhatsapp && eventId) {
      sendCAPIPurchaseEvent(
        { name, phone, city, price: 249 },
        eventId,
        ip,
        userAgent,
        fbc,
        fbp
      );
    }
    
    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('Failed to save order:', error);
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 });
  }
}

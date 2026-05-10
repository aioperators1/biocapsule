import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { sendCAPIPurchaseEvent } from '@/lib/capi';

const dataFilePath = path.join(process.cwd(), 'data', 'orders.json');

// Helper to get orders
function getOrders() {
  if (!fs.existsSync(dataFilePath)) {
    fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
    fs.writeFileSync(dataFilePath, JSON.stringify([]));
  }
  const data = fs.readFileSync(dataFilePath, 'utf-8');
  return JSON.parse(data || '[]');
}

export async function GET() {
  try {
    const orders = getOrders();
    return NextResponse.json(orders);
  } catch (error) {
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

    const orders = getOrders();
    
    const newOrder = {
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
    fs.writeFileSync(dataFilePath, JSON.stringify(orders, null, 2));
    
    // Trigger Server-Side Tracking for non-whatsapp (since whatsapp goes away from site)
    if (!isWhatsapp && eventId) {
      sendCAPIPurchaseEvent(
        { name, phone, city, price: 249 }, // using the fixed price from earlier
        eventId,
        ip,
        userAgent,
        fbc,
        fbp
      );
    }
    
    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 });
  }
}

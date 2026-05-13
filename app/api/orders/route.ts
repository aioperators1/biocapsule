import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
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
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('date', { ascending: false });
      
    if (error) throw error;
    
    return NextResponse.json(orders || []);
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

    const newOrder = {
      name: name || (isWhatsapp ? 'طلب عبر الواتساب' : ''),
      phone: phone || (isWhatsapp ? 'واتساب' : ''),
      city: city || (isWhatsapp ? '-' : ''),
      address: address || (isWhatsapp ? '-' : ''),
      status: 'Pending',
      source: source || 'website',
      date: new Date().toISOString()
    };
    
    const { data: savedOrder, error } = await supabase
      .from('orders')
      .insert([newOrder])
      .select()
      .single();
      
    if (error) throw error;
    
    // Trigger Server-Side Tracking for non-whatsapp
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
    
    return NextResponse.json(savedOrder, { status: 201 });
  } catch (error) {
    console.error('Failed to save order:', error);
    return NextResponse.json({ error: 'Failed to save order' }, { status: 500 });
  }
}

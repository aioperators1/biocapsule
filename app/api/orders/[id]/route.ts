import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { status, confirmedBy, name, phone, city, address } = await request.json();
    const { id } = await params;
    
    const updateData: any = {};
    if (status) updateData.status = status;
    if (confirmedBy !== undefined) updateData.confirmedBy = confirmedBy;
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (city !== undefined) updateData.city = city;
    if (address !== undefined) updateData.address = address;
    
    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id);
      
    if (error) throw error;
    
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}

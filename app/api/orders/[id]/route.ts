import { NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile } from '@/lib/data';

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

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { status, confirmedBy, name, phone, city, address } = await request.json();
    const { id } = await params;
    
    const orders = readJsonFile<Order[]>('orders.json', []);
    
    const orderIndex = orders.findIndex((o) => o.id === id);
    if (orderIndex === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    if (status) orders[orderIndex].status = status;
    if (confirmedBy !== undefined) orders[orderIndex].confirmedBy = confirmedBy;
    if (name !== undefined) orders[orderIndex].name = name;
    if (phone !== undefined) orders[orderIndex].phone = phone;
    if (city !== undefined) orders[orderIndex].city = city;
    if (address !== undefined) orders[orderIndex].address = address;
    
    writeJsonFile('orders.json', orders);
    
    return NextResponse.json(orders[orderIndex]);
  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const orders = readJsonFile<Order[]>('orders.json', []);
    
    const orderIndex = orders.findIndex((o) => o.id === id);
    if (orderIndex === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    orders.splice(orderIndex, 1);
    writeJsonFile('orders.json', orders);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete order:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}

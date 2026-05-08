import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'orders.json');

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { status, confirmedBy, name, phone, city, address } = await request.json();
    const { id } = await params;
    
    if (!fs.existsSync(dataFilePath)) {
      return NextResponse.json({ error: 'No orders found' }, { status: 404 });
    }
    
    const data = fs.readFileSync(dataFilePath, 'utf-8');
    const orders = JSON.parse(data || '[]');
    
    const orderIndex = orders.findIndex((o: any) => o.id === id);
    if (orderIndex === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    if (status) orders[orderIndex].status = status;
    if (confirmedBy !== undefined) orders[orderIndex].confirmedBy = confirmedBy;
    if (name !== undefined) orders[orderIndex].name = name;
    if (phone !== undefined) orders[orderIndex].phone = phone;
    if (city !== undefined) orders[orderIndex].city = city;
    if (address !== undefined) orders[orderIndex].address = address;
    
    fs.writeFileSync(dataFilePath, JSON.stringify(orders, null, 2));
    
    return NextResponse.json(orders[orderIndex]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!fs.existsSync(dataFilePath)) {
      return NextResponse.json({ error: 'No orders found' }, { status: 404 });
    }
    
    const data = fs.readFileSync(dataFilePath, 'utf-8');
    let orders = JSON.parse(data || '[]');
    
    const orderIndex = orders.findIndex((o: any) => o.id === id);
    if (orderIndex === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    orders.splice(orderIndex, 1);
    fs.writeFileSync(dataFilePath, JSON.stringify(orders, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const usersFilePath = path.join(process.cwd(), 'data', 'users.json');

export async function GET() {
  if (!fs.existsSync(usersFilePath)) return NextResponse.json([]);
  const data = fs.readFileSync(usersFilePath, 'utf-8');
  const users = JSON.parse(data || '[]');
  // Send names, usernames, roles, and commission rates
  return NextResponse.json(users.map((u: any) => ({ 
    username: u.username, 
    name: u.name, 
    role: u.role,
    commissionRate: u.commissionRate || 0 
  })));
}

export async function POST(request: Request) {
  try {
    const newUser = await request.json(); // { username, password, name, role, commissionRate }
    if (!fs.existsSync(usersFilePath)) fs.writeFileSync(usersFilePath, '[]');
    
    const data = fs.readFileSync(usersFilePath, 'utf-8');
    const users = JSON.parse(data || '[]');
    
    if (users.find((u: any) => u.username === newUser.username)) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }
    
    users.push({ ...newUser, commissionRate: Number(newUser.commissionRate) || 0 });
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const updateData = await request.json(); // { username, name, password?, commissionRate }
    const data = fs.readFileSync(usersFilePath, 'utf-8');
    let users = JSON.parse(data || '[]');
    
    const userIndex = users.findIndex((u: any) => u.username === updateData.username);
    if (userIndex === -1) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    
    if (updateData.name) users[userIndex].name = updateData.name;
    if (updateData.password) users[userIndex].password = updateData.password;
    if (updateData.commissionRate !== undefined) users[userIndex].commissionRate = Number(updateData.commissionRate);
    
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { username } = await request.json();
    const data = fs.readFileSync(usersFilePath, 'utf-8');
    let users = JSON.parse(data || '[]');
    
    const filteredUsers = users.filter((u: any) => u.username !== username);
    fs.writeFileSync(usersFilePath, JSON.stringify(filteredUsers, null, 2));
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

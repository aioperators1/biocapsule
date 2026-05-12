import { NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile } from '@/lib/data';

type User = {
  username: string;
  password: string;
  name: string;
  role: string;
  commissionRate?: number;
};

const DEFAULT_USERS: User[] = [
  {
    username: "admin",
    password: "biocapsuleadmin02",
    name: "Admin",
    role: "admin"
  }
];

export async function GET() {
  try {
    const users = readJsonFile<User[]>('users.json', DEFAULT_USERS);
    // Send names, usernames, roles, and commission rates (never passwords)
    return NextResponse.json(users.map((u) => ({ 
      username: u.username, 
      name: u.name, 
      role: u.role,
      commissionRate: u.commissionRate || 0 
    })));
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const newUser = await request.json(); // { username, password, name, role, commissionRate }
    
    const users = readJsonFile<User[]>('users.json', DEFAULT_USERS);
    
    if (users.find((u) => u.username === newUser.username)) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }
    
    users.push({ ...newUser, commissionRate: Number(newUser.commissionRate) || 0 });
    writeJsonFile('users.json', users);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const updateData = await request.json(); // { username, name, password?, commissionRate }
    const users = readJsonFile<User[]>('users.json', DEFAULT_USERS);
    
    const userIndex = users.findIndex((u) => u.username === updateData.username);
    if (userIndex === -1) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    
    if (updateData.name) users[userIndex].name = updateData.name;
    if (updateData.password) users[userIndex].password = updateData.password;
    if (updateData.commissionRate !== undefined) users[userIndex].commissionRate = Number(updateData.commissionRate);
    
    writeJsonFile('users.json', users);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { username } = await request.json();
    const users = readJsonFile<User[]>('users.json', DEFAULT_USERS);
    
    const filteredUsers = users.filter((u) => u.username !== username);
    writeJsonFile('users.json', filteredUsers);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

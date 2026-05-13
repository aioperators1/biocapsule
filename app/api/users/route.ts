import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

type User = {
  username: string;
  password: string;
  name: string;
  role: string;
  commissionRate?: number;
};

const DEFAULT_ADMIN: User = {
  username: "admin",
  password: "biocapsuleadmin02",
  name: "Admin",
  role: "admin",
  commissionRate: 0
};

export async function GET() {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*');
      
    if (error) throw error;
    
    let activeUsers = users || [];
    
    if (activeUsers.length === 0) {
      // Seed default admin if no users exist
      await supabase.from('users').insert([DEFAULT_ADMIN]);
      activeUsers = [DEFAULT_ADMIN];
    }

    // Send names, usernames, roles, and commission rates (never passwords)
    return NextResponse.json(activeUsers.map((u) => ({ 
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
    const newUser = await request.json();
    
    const { data: existingUser } = await supabase
      .from('users')
      .select('username')
      .eq('username', newUser.username)
      .single();
      
    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
    }
    
    const { error } = await supabase.from('users').insert([{
      ...newUser,
      commissionRate: Number(newUser.commissionRate) || 0
    }]);
    
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to create user:', error);
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const updateData = await request.json();
    
    const updatePayload: any = {};
    if (updateData.name) updatePayload.name = updateData.name;
    if (updateData.password) updatePayload.password = updateData.password;
    if (updateData.commissionRate !== undefined) updatePayload.commissionRate = Number(updateData.commissionRate);
    
    const { error } = await supabase
      .from('users')
      .update(updatePayload)
      .eq('username', updateData.username);
      
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { username } = await request.json();
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('username', username);
      
    if (error) throw error;
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("bio_admin_session");

  if (session && session.value) {
    try {
      const sessionUser = JSON.parse(session.value);
      
      const { data: userDoc } = await supabase
        .from('users')
        .select('*')
        .eq('username', sessionUser.username)
        .single();
      
      if (userDoc) {
        const freshUser = userDoc;
        return NextResponse.json({ 
          authenticated: true, 
          user: {
            username: freshUser?.username,
            name: freshUser?.name,
            role: freshUser?.role,
            commissionRate: freshUser?.commissionRate || 0
          } 
        });
      }
      
      // User found in session but not in DB — still allow if session has valid data
      if (sessionUser.username && sessionUser.role) {
        return NextResponse.json({ authenticated: true, user: sessionUser });
      }
      
      return NextResponse.json({ authenticated: false }, { status: 401 });
    } catch {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}

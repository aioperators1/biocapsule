import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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

export async function POST(req: Request) {
  const { username, password } = await req.json();

  try {
    const { data: userDoc, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    let user: User | undefined;

    if (userDoc) {
      if (userDoc.password === password) {
        user = userDoc as User;
      }
    } else if (username === "admin" && password === "biocapsuleadmin02") {
      // Auto-seed and login if default admin
      await supabase.from('users').insert([DEFAULT_ADMIN]);
      user = DEFAULT_ADMIN;
    }

    if (user) {
      const response = NextResponse.json({ success: true, role: user.role });
      // Securely store user info in cookie
      const userData = JSON.stringify({ 
        username: user.username, 
        name: user.name, 
        role: user.role,
        commissionRate: user.commissionRate || 0
      });
      
      response.cookies.set("bio_admin_session", userData, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24, // 24 hours
        path: "/",
      });
      return response;
    }

    return NextResponse.json({ success: false, error: "بيانات الدخول غير صحيحة" }, { status: 401 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, error: "حدث خطأ أثناء تسجيل الدخول" }, { status: 500 });
  }
}

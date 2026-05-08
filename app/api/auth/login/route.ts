import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const usersFilePath = path.join(process.cwd(), 'data', 'users.json');

export async function POST(req: Request) {
  const { username, password } = await req.json();

  if (!fs.existsSync(usersFilePath)) {
    return NextResponse.json({ success: false, error: "قاعدة بيانات المستخدمين غير موجودة" }, { status: 500 });
  }

  const usersData = fs.readFileSync(usersFilePath, 'utf-8');
  const users = JSON.parse(usersData || '[]');

  const user = users.find((u: any) => u.username === username && u.password === password);

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
}

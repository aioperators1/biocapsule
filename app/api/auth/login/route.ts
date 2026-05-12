import { NextResponse } from "next/server";
import { readJsonFile } from "@/lib/data";

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
    role: "admin",
    commissionRate: 0
  }
];

export async function POST(req: Request) {
  const { username, password } = await req.json();

  const users = readJsonFile<User[]>('users.json', DEFAULT_USERS);

  // Find user by username and password
  let user = users.find((u) => u.username === username && u.password === password);
  
  // Fallback admin user if file doesn't have the admin (e.g. on Netlify cold start)
  if (!user && username === "admin" && password === "biocapsuleadmin02") {
    user = DEFAULT_USERS[0];
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
}

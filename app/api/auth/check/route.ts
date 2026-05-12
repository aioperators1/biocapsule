import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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
    role: "admin"
  }
];

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("bio_admin_session");

  if (session && session.value) {
    try {
      const sessionUser = JSON.parse(session.value);
      
      // Fetch fresh data from users.json to ensure commissionRate and other details are up-to-date
      const users = readJsonFile<User[]>('users.json', DEFAULT_USERS);
      const freshUser = users.find((u) => u.username === sessionUser.username);
      
      if (freshUser) {
        return NextResponse.json({ 
          authenticated: true, 
          user: {
            username: freshUser.username,
            name: freshUser.name,
            role: freshUser.role,
            commissionRate: freshUser.commissionRate || 0
          } 
        });
      }
      
      // User found in session but not in file — still allow if session has valid data
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

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "fs";
import path from "path";

const usersFilePath = path.join(process.cwd(), 'data', 'users.json');

export async function GET() {
  const cookieStore = await cookies();
  const session = cookieStore.get("bio_admin_session");

  if (session && session.value) {
    try {
      const sessionUser = JSON.parse(session.value);
      
      // Fetch fresh data from users.json to ensure commissionRate and other details are up-to-date
      if (fs.existsSync(usersFilePath)) {
        const usersData = fs.readFileSync(usersFilePath, 'utf-8');
        const users = JSON.parse(usersData || '[]');
        const freshUser = users.find((u: any) => u.username === sessionUser.username);
        
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
      }
      
      return NextResponse.json({ authenticated: true, user: sessionUser });
    } catch {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
  }

  return NextResponse.json({ authenticated: false }, { status: 401 });
}

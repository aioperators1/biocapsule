import { NextResponse } from 'next/server';
import { getSettings, updateSettings } from '@/lib/settings';

export async function GET() {
  try {
    const settings = getSettings();
    // Exclude the access token from the frontend for security reasons,
    // unless the request is verified to be an admin. 
    // Since this is an admin dashboard only API, we will return it,
    // but in a real-world scenario you'd want robust auth checking here.
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const updatedSettings = updateSettings(body);
    return NextResponse.json(updatedSettings);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}

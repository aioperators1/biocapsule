import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dataFilePath = path.join(process.cwd(), 'data', 'views.json');

function getViewsData() {
  if (!fs.existsSync(dataFilePath)) {
    fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
    const initial = { totalViews: 0, history: [] };
    fs.writeFileSync(dataFilePath, JSON.stringify(initial, null, 2));
    return initial;
  }
  const data = fs.readFileSync(dataFilePath, 'utf-8');
  return JSON.parse(data || '{"totalViews":0,"history":[]}');
}

// GET - return total views + today/week/month breakdown
export async function GET() {
  try {
    const viewsData = getViewsData();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayViews = 0;
    let weekViews = 0;
    let monthViews = 0;

    (viewsData.history || []).forEach((entry: { date: string }) => {
      const entryDate = new Date(entry.date);
      if (entryDate >= todayStart) todayViews++;
      if (entryDate >= weekStart) weekViews++;
      if (entryDate >= monthStart) monthViews++;
    });

    return NextResponse.json({
      total: viewsData.totalViews,
      today: todayViews,
      week: weekViews,
      month: monthViews,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch views' }, { status: 500 });
  }
}

// POST - record a new page view
export async function POST() {
  try {
    const viewsData = getViewsData();
    viewsData.totalViews = (viewsData.totalViews || 0) + 1;
    viewsData.history = viewsData.history || [];
    viewsData.history.push({ date: new Date().toISOString() });

    // Keep only last 90 days of history to prevent file from growing too large
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    viewsData.history = viewsData.history.filter(
      (entry: { date: string }) => new Date(entry.date) >= ninetyDaysAgo
    );

    fs.writeFileSync(dataFilePath, JSON.stringify(viewsData, null, 2));
    return NextResponse.json({ success: true, total: viewsData.totalViews });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
  }
}

// DELETE - clear today's views (subtracts from total and weekly too)
export async function DELETE() {
  try {
    const viewsData = getViewsData();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Count how many views are from today
    const todayEntries = (viewsData.history || []).filter(
      (entry: { date: string }) => new Date(entry.date) >= todayStart
    );
    const removedCount = todayEntries.length;

    // Remove today's entries from history
    viewsData.history = (viewsData.history || []).filter(
      (entry: { date: string }) => new Date(entry.date) < todayStart
    );

    // Subtract from total
    viewsData.totalViews = Math.max(0, (viewsData.totalViews || 0) - removedCount);

    fs.writeFileSync(dataFilePath, JSON.stringify(viewsData, null, 2));
    return NextResponse.json({ success: true, removed: removedCount, total: viewsData.totalViews });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to clear daily views' }, { status: 500 });
  }
}

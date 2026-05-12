import { NextResponse } from 'next/server';
import { readJsonFile, writeJsonFile } from '@/lib/data';

type ViewsData = {
  totalViews: number;
  history: { date: string }[];
};

const DEFAULT_VIEWS: ViewsData = { totalViews: 0, history: [] };

// GET - return total views + today/week/month breakdown
export async function GET() {
  try {
    const viewsData = readJsonFile<ViewsData>('views.json', DEFAULT_VIEWS);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    let todayViews = 0;
    let weekViews = 0;
    let monthViews = 0;

    (viewsData.history || []).forEach((entry) => {
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
    console.error('Failed to fetch views:', error);
    return NextResponse.json({ error: 'Failed to fetch views' }, { status: 500 });
  }
}

// POST - record a new page view
export async function POST() {
  try {
    const viewsData = readJsonFile<ViewsData>('views.json', DEFAULT_VIEWS);
    viewsData.totalViews = (viewsData.totalViews || 0) + 1;
    viewsData.history = viewsData.history || [];
    viewsData.history.push({ date: new Date().toISOString() });

    // Keep only last 90 days of history to prevent file from growing too large
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    viewsData.history = viewsData.history.filter(
      (entry) => new Date(entry.date) >= ninetyDaysAgo
    );

    writeJsonFile('views.json', viewsData);
    return NextResponse.json({ success: true, total: viewsData.totalViews });
  } catch (error) {
    console.error('Failed to record view:', error);
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
  }
}

// DELETE - clear today's views (subtracts from total and weekly too)
export async function DELETE() {
  try {
    const viewsData = readJsonFile<ViewsData>('views.json', DEFAULT_VIEWS);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Count how many views are from today
    const todayEntries = (viewsData.history || []).filter(
      (entry) => new Date(entry.date) >= todayStart
    );
    const removedCount = todayEntries.length;

    // Remove today's entries from history
    viewsData.history = (viewsData.history || []).filter(
      (entry) => new Date(entry.date) < todayStart
    );

    // Subtract from total
    viewsData.totalViews = Math.max(0, (viewsData.totalViews || 0) - removedCount);

    writeJsonFile('views.json', viewsData);
    return NextResponse.json({ success: true, removed: removedCount, total: viewsData.totalViews });
  } catch (error) {
    console.error('Failed to clear daily views:', error);
    return NextResponse.json({ error: 'Failed to clear daily views' }, { status: 500 });
  }
}

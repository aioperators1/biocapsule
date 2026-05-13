import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET - return total views + today/week/month breakdown
export async function GET() {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const { data: statsDoc } = await supabase
      .from('metadata')
      .select('data')
      .eq('id', 'views')
      .single();
      
    const totalViews = statsDoc?.data?.total || 0;

    const { data: viewsSnapshot } = await supabase
      .from('views')
      .select('date')
      .gte('date', monthStart);
    
    let todayViews = 0;
    let weekViews = 0;
    let monthViews = 0;

    if (viewsSnapshot) {
      viewsSnapshot.forEach(doc => {
        const date = doc.date;
        if (date >= todayStart) todayViews++;
        if (date >= weekStart) weekViews++;
        monthViews++;
      });
    }

    return NextResponse.json({
      total: totalViews,
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
    const now = new Date().toISOString();
    
    // Add to collection
    await supabase.from('views').insert([{ date: now }]);
    
    // Increment total in metadata (we can use an RPC function if we want atomic increments, 
    // but for simplicity we fetch and update here, or if high traffic, RPC is needed. 
    // Supabase has rpc 'increment_view_count')
    const { data: statsDoc } = await supabase
      .from('metadata')
      .select('data')
      .eq('id', 'views')
      .single();
      
    const currentTotal = statsDoc?.data?.total || 0;
    await supabase
      .from('metadata')
      .upsert({ id: 'views', data: { total: currentTotal + 1 } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to record view:', error);
    return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
  }
}

// DELETE - clear today's views
export async function DELETE() {
  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const { data: snapshot } = await supabase
      .from('views')
      .select('id')
      .gte('date', todayStart);
      
    const removedCount = snapshot?.length || 0;
    
    if (removedCount > 0) {
      await supabase
        .from('views')
        .delete()
        .gte('date', todayStart);
        
      // Decrement from total
      const { data: statsDoc } = await supabase
        .from('metadata')
        .select('data')
        .eq('id', 'views')
        .single();
        
      const currentTotal = statsDoc?.data?.total || 0;
      await supabase
        .from('metadata')
        .upsert({ id: 'views', data: { total: Math.max(0, currentTotal - removedCount) } });
    }

    return NextResponse.json({ success: true, removed: removedCount });
  } catch (error) {
    console.error('Failed to clear daily views:', error);
    return NextResponse.json({ error: 'Failed to clear daily views' }, { status: 500 });
  }
}

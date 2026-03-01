import { NextResponse } from 'next/server';
import { db } from '@/db';
import { purchaseOrders } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const targetDate = searchParams.get('targetDate');

  try {
    if (targetDate) {
      const pos = await db.select().from(purchaseOrders).where(eq(purchaseOrders.targetDate, targetDate));
      return NextResponse.json(pos);
    }
    
    // Fallback all POs
    const allPos = await db.select().from(purchaseOrders);
    return NextResponse.json(allPos);
  } catch (error) {
    console.error('Error fetching POs:', error);
    return NextResponse.json({ error: 'Failed to fetch POs' }, { status: 500 });
  }
}
import { db } from '@/db';
import { purchaseOrders, poLineItems, ingredients } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  const poId = parseInt(id, 10);
  
  const [po] = await db.select().from(purchaseOrders).where(eq(purchaseOrders.id, poId));
  
  if (!po) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const items = await db.select({
    id: poLineItems.id,
    ingredientId: poLineItems.ingredientId,
    ingredientName: ingredients.name,
    theoreticalQty: poLineItems.theoreticalQty,
    actualQty: poLineItems.actualQty,
    snapshotPricePerKg: poLineItems.snapshotPricePerKg,
  })
  .from(poLineItems)
  .leftJoin(ingredients, eq(poLineItems.ingredientId, ingredients.id))
  .where(eq(poLineItems.poId, poId));

  return NextResponse.json({ po, items });
}

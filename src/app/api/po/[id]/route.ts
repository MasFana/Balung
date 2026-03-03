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

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  const poId = parseInt(id, 10);

  try {
    // Delete line items first
    await db.delete(poLineItems).where(eq(poLineItems.poId, poId));
    
    // Then delete the PO
    await db.delete(purchaseOrders).where(eq(purchaseOrders.id, poId));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting PO:', error);
    return NextResponse.json({ error: 'Failed to delete PO' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  const poId = parseInt(id, 10);

  try {
    const body = await request.json();
    const { items } = body; // Array of { id, snapshotPricePerKg }

    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid items array' }, { status: 400 });
    }

    // Update each line item's price
    for (const item of items) {
      if (item.id && typeof item.snapshotPricePerKg === 'number') {
        await db.update(poLineItems)
          .set({ snapshotPricePerKg: item.snapshotPricePerKg })
          .where(eq(poLineItems.id, item.id));
      }
    }

    // Recalculate totalCost for the PO
    const allItems = await db.select().from(poLineItems).where(eq(poLineItems.poId, poId));
    const totalCost = allItems.reduce((acc, curr) => acc + (curr.actualQty * curr.snapshotPricePerKg), 0);

    await db.update(purchaseOrders)
      .set({ totalCost })
      .where(eq(purchaseOrders.id, poId));

    return NextResponse.json({ success: true, totalCost });
  } catch (error) {
    console.error('Error updating PO:', error);
    return NextResponse.json({ error: 'Failed to update PO' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { db } from '@/db';
import { purchaseOrders, poLineItems, patientCensus, recipes, ingredients } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { format } from 'date-fns';

export async function POST(request: Request) {
  try {
    const { targetDate } = await request.json();

    // Get patient census for targetDate
    const census = await db.select().from(patientCensus).where(eq(patientCensus.date, targetDate));
    if (census.length === 0) {
      return NextResponse.json({ error: 'No patient census found for this date' }, { status: 400 });
    }

    // Get all recipes and ingredients
    const allRecipes = await db.select().from(recipes);
    const allIngredients = await db.select().from(ingredients);
    
    // Calculate required ingredients
    const ingredientRequirements = new Map(); // ingredientId -> { totalGrams, price }

    for (const record of census) {
      const { dietId, patientCount } = record;
      
      const dietRecipes = allRecipes.filter(r => r.dietId === dietId);
      
      for (const recipe of dietRecipes) {
        const ing = allIngredients.find(i => i.id === recipe.ingredientId);
        if (!ing) continue;

        const totalGramsForDiet = recipe.gramPerPatientPerDay * patientCount;
        
        if (ingredientRequirements.has(ing.id)) {
          const current = ingredientRequirements.get(ing.id);
          ingredientRequirements.set(ing.id, {
            totalGrams: current.totalGrams + totalGramsForDiet,
            price: current.price,
          });
        } else {
          ingredientRequirements.set(ing.id, {
            totalGrams: totalGramsForDiet,
            price: ing.basePricePerKg,
          });
        }
      }
    }

    // Check if PO already exists for this targetDate
    const existingPoList = await db.select().from(purchaseOrders).where(eq(purchaseOrders.targetDate, targetDate));
    
    let poId;
    let existingLineItems: any[] = [];
    
    if (existingPoList.length > 0) {
      poId = existingPoList[0].id;
      existingLineItems = await db.select().from(poLineItems).where(eq(poLineItems.poId, poId));
      
      // Delete old line items
      await db.delete(poLineItems).where(eq(poLineItems.poId, poId));
      
      // Update PO status back to DRAFT just in case it was locked, though we remove strictly locked logic.
      await db.update(purchaseOrders)
        .set({ status: 'DRAFT' })
        .where(eq(purchaseOrders.id, poId));
    } else {
      const [insertedPo] = await db.insert(purchaseOrders).values({
        poDate: format(new Date(), 'yyyy-MM-dd'),
        targetDate: targetDate,
        status: 'DRAFT', // No longer immediately locked
        totalCost: 0,
      }).returning();
      poId = insertedPo.id;
    }

    // Map existing snapshot prices
    const existingPriceMap = new Map();
    existingLineItems.forEach(item => {
      existingPriceMap.set(item.ingredientId, item.snapshotPricePerKg);
    });

    let totalCost = 0;
    const lineItemsData = [];

    for (const [ingredientId, data] of ingredientRequirements.entries()) {
      const theoreticalQty = data.totalGrams / 1000; // convert to kg
      const actualQty = theoreticalQty;
      
      // Keep previously edited snapshot_price if it existed
      const snapshotPrice = existingPriceMap.has(ingredientId) ? existingPriceMap.get(ingredientId) : data.price;
      const lineCost = actualQty * snapshotPrice;
      totalCost += lineCost;

      lineItemsData.push({
        poId: poId,
        ingredientId,
        theoreticalQty,
        actualQty,
        snapshotPricePerKg: snapshotPrice,
      });
    }

    if (lineItemsData.length > 0) {
      await db.insert(poLineItems).values(lineItemsData);
    }

    await db.update(purchaseOrders)
      .set({ totalCost })
      .where(eq(purchaseOrders.id, poId));

    return NextResponse.json({ success: true, poId: poId });
  } catch (error) {
    console.error('Error generating PO:', error);
    return NextResponse.json({ error: 'Failed to generate PO' }, { status: 500 });
  }
}
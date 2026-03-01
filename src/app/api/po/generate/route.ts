import { NextResponse } from 'next/server';
import { db } from '@/db';
import { purchaseOrders, poLineItems, patientCensus, recipes, ingredients } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { format } from 'date-fns';

export async function POST(request: Request) {
  try {
    const { targetDate } = await request.json();

    // Check if PO already exists for this targetDate
    const existingPo = await db.select().from(purchaseOrders).where(eq(purchaseOrders.targetDate, targetDate));
    if (existingPo.length > 0) {
      return NextResponse.json({ error: 'PO already exists for this date' }, { status: 400 });
    }

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
            price: ing.basePricePerKg,
          });
        } else {
          ingredientRequirements.set(ing.id, {
            totalGrams: totalGramsForDiet,
            price: ing.basePricePerKg,
          });
        }
      }
    }

    // Insert PO
    const [insertedPo] = await db.insert(purchaseOrders).values({
      poDate: format(new Date(), 'yyyy-MM-dd'),
      targetDate: targetDate,
      status: 'LOCKED',
      totalCost: 0, // Will update shortly
    }).returning();

    let totalCost = 0;
    const lineItemsData = [];

    for (const [ingredientId, data] of ingredientRequirements.entries()) {
      const theoreticalQty = data.totalGrams / 1000; // convert to kg
      const actualQty = theoreticalQty; // For generation, actual = theoretical initially
      const snapshotPrice = data.price;
      const lineCost = actualQty * snapshotPrice;
      totalCost += lineCost;

      lineItemsData.push({
        poId: insertedPo.id,
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
      .where(eq(purchaseOrders.id, insertedPo.id));

    return NextResponse.json({ success: true, poId: insertedPo.id });
  } catch (error) {
    console.error('Error generating PO:', error);
    return NextResponse.json({ error: 'Failed to generate PO' }, { status: 500 });
  }
}

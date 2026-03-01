import { db } from './index';
import { ingredients, diets, recipes, patientCensus, purchaseOrders, poLineItems } from './schema';
import { addDays, format, subDays } from 'date-fns';
import { eq } from 'drizzle-orm';

async function seed() {
  console.log('Seeding database...');
  
  // 1. Ingredients
  const ingData = [
    { name: 'Beras', type: 'DRY', basePricePerKg: 12000 },
    { name: 'Ayam', type: 'WET', basePricePerKg: 35000 },
    { name: 'Tempe', type: 'WET', basePricePerKg: 15000 },
    { name: 'Sayur', type: 'WET', basePricePerKg: 10000 },
    { name: 'Telur', type: 'DRY', basePricePerKg: 28000 },
  ];
  
  const insertedIngredients = await db.insert(ingredients).values(ingData).returning();
  const getIngId = (name: string) => insertedIngredients.find(i => i.name === name)!.id;

  // 2. Diets
  const dietData = [
    { name: 'Normal' },
    { name: 'High-Protein' },
    { name: 'Low-Sodium' },
  ];
  const insertedDiets = await db.insert(diets).values(dietData).returning();
  const getDietId = (name: string) => insertedDiets.find(d => d.name === name)!.id;

  // 3. Recipes (grams per patient per day)
  const recipeData = [
    // Normal Diet
    { dietId: getDietId('Normal'), ingredientId: getIngId('Beras'), gramPerPatientPerDay: 300 },
    { dietId: getDietId('Normal'), ingredientId: getIngId('Ayam'), gramPerPatientPerDay: 150 },
    { dietId: getDietId('Normal'), ingredientId: getIngId('Tempe'), gramPerPatientPerDay: 100 },
    { dietId: getDietId('Normal'), ingredientId: getIngId('Sayur'), gramPerPatientPerDay: 150 },
    { dietId: getDietId('Normal'), ingredientId: getIngId('Telur'), gramPerPatientPerDay: 50 },
    
    // High-Protein Diet
    { dietId: getDietId('High-Protein'), ingredientId: getIngId('Beras'), gramPerPatientPerDay: 250 },
    { dietId: getDietId('High-Protein'), ingredientId: getIngId('Ayam'), gramPerPatientPerDay: 250 },
    { dietId: getDietId('High-Protein'), ingredientId: getIngId('Tempe'), gramPerPatientPerDay: 150 },
    { dietId: getDietId('High-Protein'), ingredientId: getIngId('Sayur'), gramPerPatientPerDay: 150 },
    { dietId: getDietId('High-Protein'), ingredientId: getIngId('Telur'), gramPerPatientPerDay: 100 },
    
    // Low-Sodium Diet
    { dietId: getDietId('Low-Sodium'), ingredientId: getIngId('Beras'), gramPerPatientPerDay: 300 },
    { dietId: getDietId('Low-Sodium'), ingredientId: getIngId('Ayam'), gramPerPatientPerDay: 100 }, // Less Ayam
    { dietId: getDietId('Low-Sodium'), ingredientId: getIngId('Sayur'), gramPerPatientPerDay: 250 }, // More Sayur
  ];
  await db.insert(recipes).values(recipeData);

  // 4. Daily Census (past 30 days)
  const today = new Date();
  const censusData = [];
  for (let i = 0; i <= 30; i++) {
    const d = subDays(today, i);
    const dateStr = format(d, 'yyyy-MM-dd');
    
    // Randomize patient counts a bit
    censusData.push({ date: dateStr, dietId: getDietId('Normal'), patientCount: 150 + Math.floor(Math.random() * 20) });
    censusData.push({ date: dateStr, dietId: getDietId('High-Protein'), patientCount: 30 + Math.floor(Math.random() * 10) });
    censusData.push({ date: dateStr, dietId: getDietId('Low-Sodium'), patientCount: 20 + Math.floor(Math.random() * 5) });
  }
  await db.insert(patientCensus).values(censusData);

  // 5. Purchase Orders (Historical Locked POs)
  // Let's create POs for every 2 days (for WET) for the past 20 days.
  for (let i = 2; i <= 20; i += 2) {
    const poDate = format(subDays(today, i), 'yyyy-MM-dd');
    const targetDate = format(subDays(today, i - 1), 'yyyy-MM-dd'); // Target is the next day after PO
    
    // A little variation in base price over time
    const priceMultiplier = 1 + (Math.random() * 0.1 - 0.05); // +/- 5%
    
    // Insert PO
    const [insertedPo] = await db.insert(purchaseOrders).values({
      poDate: poDate,
      targetDate: targetDate,
      status: 'LOCKED',
      totalCost: 0, // Will update below
    }).returning();
    
    let totalCost = 0;
    
    // Generate Line Items
    const lineItemsData = insertedIngredients.map(ing => {
      // Calculate theoretical based on census from the target date (let's use average census ~200 pts)
      let avgGrams = 0;
      if (ing.name === 'Ayam') avgGrams = 170;
      else if (ing.name === 'Beras') avgGrams = 280;
      else if (ing.name === 'Tempe') avgGrams = 120;
      else if (ing.name === 'Sayur') avgGrams = 160;
      else avgGrams = 50;
      
      const theoreticalQty = (200 * avgGrams * 2) / 1000; // 2 days, kg
      const actualQty = theoreticalQty * (1 + (Math.random() * 0.1)); // slightly higher due to buffer/spillage
      const snapshotPrice = ing.basePricePerKg * priceMultiplier;
      
      totalCost += actualQty * snapshotPrice;
      
      return {
        poId: insertedPo.id,
        ingredientId: ing.id,
        theoreticalQty: Number(theoreticalQty.toFixed(2)),
        actualQty: Number(actualQty.toFixed(2)),
        snapshotPricePerKg: Number(snapshotPrice.toFixed(2)),
      };
    });
    
    await db.insert(poLineItems).values(lineItemsData);
    await db.update(purchaseOrders)
      .set({ totalCost: Number(totalCost.toFixed(2)) })
      .where(eq(purchaseOrders.id, insertedPo.id));
  }

  // Create one draft PO for today
  const [draftPo] = await db.insert(purchaseOrders).values({
    poDate: format(today, 'yyyy-MM-dd'),
    targetDate: format(addDays(today, 1), 'yyyy-MM-dd'),
    status: 'DRAFT',
    totalCost: 1500000,
  }).returning();

  await db.insert(poLineItems).values([
    { poId: draftPo.id, ingredientId: getIngId('Ayam'), theoreticalQty: 68, actualQty: 70, snapshotPricePerKg: 35000 },
    { poId: draftPo.id, ingredientId: getIngId('Tempe'), theoreticalQty: 48, actualQty: 50, snapshotPricePerKg: 15000 },
    { poId: draftPo.id, ingredientId: getIngId('Sayur'), theoreticalQty: 64, actualQty: 65, snapshotPricePerKg: 10000 },
  ]);

  console.log('Seeding completed successfully.');
}

seed().catch(e => console.error(e));

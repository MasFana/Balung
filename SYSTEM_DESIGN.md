# Hospital Nutrition Ledger & Procurement System (NCL V3.0) - System Design

## 1. Business Logic
The system is designed for a hospital's nutrition team to manage the procurement of ingredients based on patient census, diet types, and exact recipe grammage. 
Key requirements:
- **Master Data**: Ingredients are categorized into Wet (purchased every 2 days) and Dry (purchased monthly).
- **Patient Census**: Daily input of patient count by diet type (e.g., Normal, High-Protein, Low-Sodium).
- **Procurement Calculation**: 
  - Required Qty = (Patient Count × Recipe Grammage × Days) + Buffer%
- **Immutable Ledger (Purchase Orders - POs)**: 
  - Users generate POs based on the calculated requirements.
  - They can manually adjust the `Actual_Qty` and the `Snapshot_Price`.
  - Once a PO is saved, the price and quantity are locked forever (immutable ledger), regardless of future changes to the master ingredient price.

## 2. User Flow
1. **Daily Operations**: Nutritionist inputs the daily patient census.
2. **PO Generation**: Nutritionist creates a new PO for an upcoming period (e.g., next 2 days for Wet ingredients). The system calculates the theoretical required quantities.
3. **PO Adjustment**: Nutritionist reviews the PO in a spreadsheet-like view (Ledger), adjusts actual quantities to be bought, and updates current prices.
4. **PO Finalization**: The PO is saved and locked.
5. **Review via Calendar**: The Chief Nutritionist views all POs on a Calendar interface. Clicking a PO opens a side drawer showing the locked ledger details.
6. **Analytics**: Management reviews variance (Theoretical vs Actual Volume) and Price Volatility on the Dashboard to optimize future procurement and budget.

## 3. Data Flow
`Master Data (Ingredients, Diets, Recipes)` -> `Daily Census` -> `Calculated Requirements` -> `Editable Draft PO` -> `Locked Immutable PO (Ledger)`.

## 4. Drizzle Schema Definition (SQLite)

### Ingredients
- `id`: integer primary key
- `name`: text
- `type`: text ('WET', 'DRY')
- `base_price_per_kg`: real

### Diets
- `id`: integer primary key
- `name`: text (e.g., 'Normal', 'High-Protein')

### Recipes
- `id`: integer primary key
- `diet_id`: integer references Diets
- `ingredient_id`: integer references Ingredients
- `gram_per_patient_per_day`: real

### Patient_Census
- `date`: text (YYYY-MM-DD) primary key part 1
- `diet_id`: integer references Diets, primary key part 2
- `patient_count`: integer

### Purchase_Orders (POs)
- `id`: integer primary key
- `po_date`: text (YYYY-MM-DD) - when it was created
- `target_date`: text (YYYY-MM-DD) - what period it covers
- `status`: text ('DRAFT', 'LOCKED')
- `total_cost`: real

### PO_Line_Items (The Immutable Ledger)
- `id`: integer primary key
- `po_id`: integer references Purchase_Orders
- `ingredient_id`: integer references Ingredients
- `theoretical_qty`: real (calculated)
- `actual_qty`: real (manual adjustment)
- `snapshot_price_per_kg`: real (locked price at the time of PO)

## 5. Structural Wireframes

### Layout
- Top/Side Navigation: "Calendar Ledger" | "Analytics Dashboard" | "Master Data"

### Calendar Ledger UI
- **Main View**: A month/week Calendar grid.
- **Events**: Pills representing POs (e.g., "PO: Wet Ingredients - $500", "PO: Dry - $2000").
- **Interaction**: Clicking an event slides out a right drawer.
- **Side Drawer**:
  - PO Header (ID, Date, Status, Total).
  - Data Table (Ledger): Ingredient | Theoretical Qty | Actual Qty | Locked Price/Kg | Total.

### Analytics Dashboard UI
- **Chart 1: Volume Variance (Dual-axis Line/Bar)**
  - X-Axis: Time (Days/Weeks).
  - Y1 (Bar): Theoretical Usage (kg).
  - Y2 (Line): Actual Procured Volume (kg).
- **Chart 2: Price Volatility (Line)**
  - X-Axis: Time (POs over months).
  - Y (Line): Price per Kg of selected ingredients (e.g., Ayam, Beras) showing fluctuations across historical locked POs.

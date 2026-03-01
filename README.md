# Hospital Nutrition Ledger & Procurement System (NCL V3.0)

A comprehensive prototype designed for hospital nutrition teams to manage daily patient census, procurement needs, and an immutable ledger of purchase orders. Built with a modern Next.js stack to handle complex volume variances and price tracking seamlessly.

## Key Features

1. **Procurement Calendar**: A Google Calendar-style visual representation of Purchase Orders (POs).
2. **Immutable Ledger Drawer**: Clicking any PO on the calendar slides out a detailed, immutable spreadsheet of line items (Theoretical Quantity vs Actual Adjusted Quantity) alongside locked prices.
3. **Analytics Dashboard**: 
   - **Dual-axis Chart**: Volume Tracking showing Theoretical Needs against Actual Procured Amounts over time.
   - **Price Volatility Line Chart**: Tracks historical lock-in prices for key ingredients to analyze spending and market shifts.

## Tech Stack

- **Framework**: Next.js 15+ (App Router, Server Components)
- **Styling**: Tailwind CSS v4 
- **Database**: SQLite (`better-sqlite3`) 
- **ORM**: Drizzle ORM
- **Visuals**: Chart.js (via `react-chartjs-2`), FullCalendar (`@fullcalendar/react`), Lucide React

## Setup & Running

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup & Seeding**
   This will create the SQLite database, apply the schema, and populate it with 30+ days of historical data and locked Purchase Orders.
   ```bash
   npx drizzle-kit push
   npx tsx src/db/seed.ts
   ```

3. **Start the Application**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to explore the prototype.

## Architecture

See `SYSTEM_DESIGN.md` for full data flow, schema definition, and structural mockups.

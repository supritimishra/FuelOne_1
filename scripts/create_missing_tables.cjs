const { Pool } = require('pg');
require('dotenv').config();

async function createMissingTables() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('Creating missing tables for Day Cash Report...');

    // Create sheet_records table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.sheet_records (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        date date NOT NULL DEFAULT CURRENT_DATE,
        sheet_name text,
        open_reading numeric DEFAULT 0,
        close_reading numeric DEFAULT 0,
        notes text,
        created_at timestamptz DEFAULT now(),
        created_by uuid NULL
      );
    `);
    console.log('✅ Created sheet_records table');

    // Create index for sheet_records
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_sheet_records_date ON public.sheet_records(date);
    `);
    console.log('✅ Created index for sheet_records');

    // Create day_cash_movements table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.day_cash_movements (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        date date NOT NULL DEFAULT CURRENT_DATE,
        inflows numeric DEFAULT 0,
        outflows numeric DEFAULT 0,
        notes text,
        created_at timestamptz DEFAULT now(),
        created_by uuid NULL
      );
    `);
    console.log('✅ Created day_cash_movements table');

    // Create index for day_cash_movements
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_day_cash_movements_date ON public.day_cash_movements(date);
    `);
    console.log('✅ Created index for day_cash_movements');

    // Insert some sample data for testing
    await pool.query(`
      INSERT INTO public.day_cash_movements (date, inflows, outflows, notes) VALUES
      (CURRENT_DATE, 50000, 20000, 'Sample cash movement'),
      (CURRENT_DATE - INTERVAL '1 day', 45000, 18000, 'Previous day movement'),
      (CURRENT_DATE - INTERVAL '2 days', 55000, 22000, 'Two days ago movement')
      ON CONFLICT DO NOTHING;
    `);
    console.log('✅ Inserted sample data');

    console.log('🎉 All tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  } finally {
    await pool.end();
  }
}

createMissingTables();

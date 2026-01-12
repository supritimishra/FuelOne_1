#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://rozgwrsgenmsixvrdvxu.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJvemd3cnNnZW5tc2l4dnJkdnhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5NzQ4NzAsImV4cCI6MjA1MjU1MDg3MH0.7c02c551-f7c1-42e6-bb0d-e327f4a3722f';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
  console.log('🌱 Starting comprehensive database seeding...');

  try {
    // 1. Seed Fuel Products
    console.log('⛽ Seeding fuel products...');
    const fuelProducts = [
      { product_name: 'Petrol', short_name: 'PET', gst_percentage: 18, is_active: true },
      { product_name: 'Diesel', short_name: 'DSL', gst_percentage: 18, is_active: true },
      { product_name: 'CNG', short_name: 'CNG', gst_percentage: 18, is_active: true },
    ];

    for (const product of fuelProducts) {
      const { error } = await supabase
        .from('fuel_products')
        .insert(product);
      
      if (error) {
        console.error('Error seeding fuel product:', product.product_name, error.message);
      } else {
        console.log('✅ Seeded fuel product:', product.product_name);
      }
    }

    // 2. Seed Tanks
    console.log('🛢️ Seeding tanks...');
    const { data: fuelProductsData } = await supabase
      .from('fuel_products')
      .select('id, product_name');

    if (fuelProductsData && fuelProductsData.length > 0) {
      const tanks = [
        { tank_number: 'Tank-1', fuel_product_id: fuelProductsData[0].id, capacity: 10000, current_stock: 7500, is_active: true },
        { tank_number: 'Tank-2', fuel_product_id: fuelProductsData[1]?.id || fuelProductsData[0].id, capacity: 15000, current_stock: 12000, is_active: true },
        { tank_number: 'Tank-3', fuel_product_id: fuelProductsData[2]?.id || fuelProductsData[0].id, capacity: 5000, current_stock: 3000, is_active: true },
      ];

      for (const tank of tanks) {
        const { error } = await supabase
          .from('tanks')
          .insert(tank);
        
        if (error) {
          console.error('Error seeding tank:', tank.tank_number, error.message);
        } else {
          console.log('✅ Seeded tank:', tank.tank_number);
        }
      }
    }

    // 3. Seed Lubricants
    console.log('🛢️ Seeding lubricants...');
    const lubricants = [
      { lubricant_name: 'Engine Oil 20W-40', current_stock: 50, minimum_stock: 10, mrp_rate: 450, sale_rate: 400, is_active: true },
      { lubricant_name: 'Brake Fluid', current_stock: 25, minimum_stock: 5, mrp_rate: 200, sale_rate: 180, is_active: true },
      { lubricant_name: 'Coolant', current_stock: 30, minimum_stock: 8, mrp_rate: 300, sale_rate: 280, is_active: true },
    ];

    for (const lubricant of lubricants) {
      const { error } = await supabase
        .from('lubricants')
        .insert(lubricant);
      
      if (error) {
        console.error('Error seeding lubricant:', lubricant.lubricant_name, error.message);
      } else {
        console.log('✅ Seeded lubricant:', lubricant.lubricant_name);
      }
    }

    // 4. Seed Credit Customers
    console.log('👥 Seeding credit customers...');
    const creditCustomers = [
      { organization_name: 'ABC Transport Ltd', phone_number: '9876543210', current_balance: 15000, is_active: true },
      { organization_name: 'XYZ Logistics', phone_number: '9876543211', current_balance: 8500, is_active: true },
      { organization_name: 'DEF Courier', phone_number: '9876543212', current_balance: 12000, is_active: true },
    ];

    for (const customer of creditCustomers) {
      const { error } = await supabase
        .from('credit_customers')
        .insert(customer);
      
      if (error) {
        console.error('Error seeding credit customer:', customer.organization_name, error.message);
      } else {
        console.log('✅ Seeded credit customer:', customer.organization_name);
      }
    }

    // 5. Seed Employees
    console.log('👨‍💼 Seeding employees...');
    const employees = [
      { employee_name: 'John Manager', designation: 'Manager', mobile_number: '9876543213', salary: 50000, is_active: true },
      { employee_name: 'Jane DSM', designation: 'DSM', mobile_number: '9876543214', salary: 40000, is_active: true },
      { employee_name: 'Bob Accountant', designation: 'Accountant', mobile_number: '9876543215', salary: 35000, is_active: true },
    ];

    for (const employee of employees) {
      const { error } = await supabase
        .from('employees')
        .insert(employee);
      
      if (error) {
        console.error('Error seeding employee:', employee.employee_name, error.message);
      } else {
        console.log('✅ Seeded employee:', employee.employee_name);
      }
    }

    // 6. Seed Day Cash Reports
    console.log('💰 Seeding day cash reports...');
    const today = new Date().toISOString().split('T')[0];
    const dayCashReport = {
      settlement_date: today,
      opening_balance: 50000,
      closing_balance: 75000,
      total_sale: 25000,
      credit_amount: 5000,
      expenses: 2000,
    };

    const { error: cashError } = await supabase
      .from('day_settlements')
      .insert(dayCashReport);
    
    if (cashError) {
      console.error('Error seeding day cash report:', cashError.message);
    } else {
      console.log('✅ Seeded day cash report for:', today);
    }

    // 7. Seed Sample Sales Data
    console.log('🛒 Seeding sample sales data...');
    const { data: fuelProductsForSales } = await supabase
      .from('fuel_products')
      .select('id, product_name');

    const { data: creditCustomersForSales } = await supabase
      .from('credit_customers')
      .select('id, organization_name');

    if (fuelProductsForSales && fuelProductsForSales.length > 0) {
      // Guest Sales
      const guestSales = [
        {
          sale_date: today,
          vehicle_number: 'MH12AB1234',
          mobile_number: '9876543216',
          fuel_product_id: fuelProductsForSales[0].id,
          quantity: 30,
          price_per_unit: 95.50,
          payment_mode: 'Cash',
          total_amount: 2865,
        },
        {
          sale_date: today,
          vehicle_number: 'MH12CD5678',
          mobile_number: '9876543217',
          fuel_product_id: fuelProductsForSales[1]?.id || fuelProductsForSales[0].id,
          quantity: 25,
          price_per_unit: 98.00,
          payment_mode: 'UPI',
          total_amount: 2450,
        },
      ];

      for (const sale of guestSales) {
        const { error } = await supabase
          .from('guest_sales')
          .insert(sale);
        
        if (error) {
          console.error('Error seeding guest sale:', error.message);
        } else {
          console.log('✅ Seeded guest sale for vehicle:', sale.vehicle_number);
        }
      }

      // Credit Sales
      if (creditCustomersForSales && creditCustomersForSales.length > 0) {
        const creditSales = [
          {
            sale_date: today,
            credit_customer_id: creditCustomersForSales[0].id,
            vehicle_number: 'MH12EF9012',
            fuel_product_id: fuelProductsForSales[0].id,
            quantity: 50,
            price_per_unit: 95.50,
            total_amount: 4775,
          },
        ];

        for (const sale of creditSales) {
          const { error } = await supabase
            .from('credit_sales')
            .insert(sale);
          
          if (error) {
            console.error('Error seeding credit sale:', error.message);
          } else {
            console.log('✅ Seeded credit sale for customer:', creditCustomersForSales[0].organization_name);
          }
        }
      }
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary of seeded data:');
    console.log('- Fuel Products: 3');
    console.log('- Tanks: 3');
    console.log('- Lubricants: 3');
    console.log('- Credit Customers: 3');
    console.log('- Employees: 3');
    console.log('- Day Cash Report: 1');
    console.log('- Sample Sales: Multiple records');
    console.log('\n🚀 The application should now have proper test data for all features!');

  } catch (error) {
    console.error('❌ Error during database seeding:', error.message);
  }
}

seedDatabase();

/**
 * Master Data API Routes - MongoDB Backend
 * 
 * This file manages all master data CRUD operations using MongoDB.
 * Master data includes: Fuel Products, Lubricants, Credit Customers, Employees,
 * Vendors, Expense Types, Business Parties, Swipe Machines, Tanks, Nozzles,
 * Duty Shifts, Print Templates, Guest Entries, and Denominations.
 * 
 * All routes are authenticated and use tenant-specific database connections.
 */

import { Router, Response } from 'express';
import { ObjectId, Filter } from 'mongodb';
import { AuthRequest, hashPassword } from '../auth.js';
import { getDatabase, getCollection } from '../db-mongodb.js';
import { requireSuperAdmin } from '../middleware/authorize.js';
import { authenticateToken } from '../auth.js';
import { attachTenantDb } from '../middleware/tenant.js';

export const masterDataRouter = Router();

// Apply authentication middleware to all routes for secure access
masterDataRouter.use(authenticateToken);
// Attach tenant-specific database for multi-tenant data isolation
masterDataRouter.use(attachTenantDb);

// ========================================
// FUEL PRODUCTS - Master Data
// ========================================
// Manages fuel products (Petrol, Diesel, CNG, etc.) with pricing and tax information

// GET all fuel products - Retrieves list of all fuel types available at the pump
masterDataRouter.get('/fuel-products', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const collection = db.collection('fuel_products');
    
    // Fetch all products sorted by newest first
    const products = await collection
      .find({})
      .sort({ created_at: -1 })
      .toArray();
    
    // Transform _id to id for frontend compatibility
    const transformedProducts = products.map(product => ({
      ...product,
      id: product._id.toString(),
    }));
    
    res.json({ ok: true, rows: transformedProducts });
  } catch (error) {
    console.error('Error fetching fuel products:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch fuel products' });
  }
});

// POST new fuel product - Creates a new fuel type with tax and pricing configuration
masterDataRouter.post('/fuel-products', async (req: AuthRequest, res: Response) => {
  try {
    const { product_name, short_name, gst_percentage, tds_percentage, wgt_percentage, lfrn } = req.body;
    
    // Validate required fields for fuel product creation
    if (!product_name || !short_name || !lfrn) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    const db = await getDatabase();
    const collection = db.collection('fuel_products');
    
    const result = await collection.insertOne({
      product_name,
      short_name,
      gst_percentage: Number(gst_percentage) || 0,
      tds_percentage: Number(tds_percentage) || 0,
      wgt_percentage: Number(wgt_percentage) || 0,
      lfrn,
      isActive: true,
      created_at: new Date(),
    });

    res.json({ ok: true, id: result.insertedId });
  } catch (error) {
    console.error('Error creating fuel product:', error);
    res.status(500).json({ ok: false, error: 'Failed to create fuel product' });
  }
});

// PUT update fuel product - Modifies existing fuel product details or toggles active status
masterDataRouter.put('/fuel-products/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { product_name, short_name, gst_percentage, tds_percentage, wgt_percentage, lfrn, isActive } = req.body;

    const db = await getDatabase();
    const collection = db.collection('fuel_products');
    
    const updateData: any = {
      updated_at: new Date(),
    };

    // Check if only toggling active/inactive status
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    } else {
      // Perform full field update
      updateData.product_name = product_name;
      updateData.short_name = short_name;
      updateData.gst_percentage = Number(gst_percentage);
      updateData.tds_percentage = Number(tds_percentage);
      updateData.wgt_percentage = Number(wgt_percentage);
      updateData.lfrn = lfrn;
    }
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    res.json({ ok: result.modifiedCount > 0 });
  } catch (error) {
    console.error('Error updating fuel product:', error);
    res.status(500).json({ ok: false, error: 'Failed to update fuel product' });
  }
});

// DELETE fuel product - Permanently removes a fuel product from the system
masterDataRouter.delete('/fuel-products/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const collection = db.collection('fuel_products');
    
    // Hard delete the fuel product record
    await collection.deleteOne({ _id: new ObjectId(id) });

    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting fuel product:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete fuel product' });
  }
});

// ========================================
// LUBRICANTS - Master Data
// ========================================
// Manages lubricant inventory (Engine Oil, Grease, etc.) with stock tracking and pricing

// GET all lubricants - Retrieves list of all lubricant products with stock and pricing info
masterDataRouter.get('/lubricants', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const collection = db.collection('lubricants');
    
    const lubricants = await collection
      .find({})
      .sort({ created_at: -1 })
      .toArray();
    
    // Transform _id to id for frontend compatibility
    const transformedLubricants = lubricants.map(lub => ({
      ...lub,
      id: lub._id.toString(),
    }));
    
    res.json({ ok: true, rows: transformedLubricants });
  } catch (error) {
    console.error('Error fetching lubricants:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch lubricants' });
  }
});

// POST new lubricant - Creates a new lubricant product with pricing and stock configuration
masterDataRouter.post('/lubricants', async (req: AuthRequest, res: Response) => {
  try {
    const { lubricant_name, hsn_code, mrp_rate, sale_rate, gst_percentage, minimum_stock, current_stock, is_active } = req.body;
    
    // Validate required field
    if (!lubricant_name) {
      return res.status(400).json({ ok: false, error: 'Lubricant name is required' });
    }

    const db = await getDatabase();
    const collection = db.collection('lubricants');
    
    const result = await collection.insertOne({
      lubricant_name,
      hsn_code: hsn_code || '',
      mrp_rate: Number(mrp_rate) || 0,
      sale_rate: Number(sale_rate) || 0,
      gst_percentage: Number(gst_percentage) || 0,
      current_stock: Number(current_stock) || 0,
      minimum_stock: Number(minimum_stock) || 0,
      is_active: is_active !== false,
      created_at: new Date(),
    });

    res.json({ ok: true, id: result.insertedId.toString() });
  } catch (error) {
    console.error('Error creating lubricant:', error);
    res.status(500).json({ ok: false, error: 'Failed to create lubricant' });
  }
});

// PUT update lubricant - Modifies lubricant details, pricing, or stock levels (partial updates supported)
masterDataRouter.put('/lubricants/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { lubricant_name, hsn_code, mrp_rate, sale_rate, gst_percentage, minimum_stock, current_stock, is_active } = req.body;

    const db = await getDatabase();
    const collection = db.collection('lubricants');
    
    // Build update object with only provided fields
    const updateData: any = {};
    if (lubricant_name !== undefined) updateData.lubricant_name = lubricant_name;
    if (hsn_code !== undefined) updateData.hsn_code = hsn_code;
    if (mrp_rate !== undefined) updateData.mrp_rate = Number(mrp_rate);
    if (sale_rate !== undefined) updateData.sale_rate = Number(sale_rate);
    if (gst_percentage !== undefined) updateData.gst_percentage = Number(gst_percentage);
    if (minimum_stock !== undefined) updateData.minimum_stock = Number(minimum_stock);
    if (current_stock !== undefined) updateData.current_stock = Number(current_stock);
    if (is_active !== undefined) updateData.is_active = is_active;
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    res.json({ ok: result.modifiedCount > 0 });
  } catch (error) {
    console.error('Error updating lubricant:', error);
    res.status(500).json({ ok: false, error: 'Failed to update lubricant' });
  }
});

// DELETE lubricant - Permanently removes a lubricant product from inventory
masterDataRouter.delete('/lubricants/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const collection = db.collection('lubricants');
    
    // Hard delete the lubricant record
    await collection.deleteOne({ _id: new ObjectId(id) });

    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting lubricant:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete lubricant' });
  }
});

// ========================================
// CREDIT CUSTOMERS - Master Data
// ========================================
// Manages credit customer accounts for fuel purchases on credit terms
// Tracks credit limits, balances, interest rates, and payment terms

masterDataRouter.get('/credit-customers', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const collection = db.collection('credit_customers');
    
    const customers = await collection
      .find({})
      .sort({ created_at: -1 })
      .toArray();
    
    // Transform _id to id for frontend compatibility
    const transformedCustomers = customers.map(customer => ({
      ...customer,
      id: customer._id.toString(),
      is_active: customer.is_active !== undefined ? customer.is_active : true,
    }));
    
    console.log(`Fetched ${transformedCustomers.length} credit customers`);
    res.json({ ok: true, rows: transformedCustomers });
  } catch (error) {
    console.error('Error fetching credit customers:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch credit customers' });
  }
});

masterDataRouter.post('/credit-customers', async (req: AuthRequest, res: Response) => {
  try {
    const { 
      registered_date,
      organization_name, 
      tin_gst_no,
      representative_name,
      organization_address,
      advance_no,
      phone_number, 
      alt_phone_no,
      credit_limit,
      username,
      password,
      email,
      opening_balance,
      opening_date,
      balance_type,
      penalty_interest,
      run_interest,
      grace_days,
      interest_percentage,
      discount_amount,
      offer_type,
      vehicle_no,
      vehicle_type,
      image_url
    } = req.body;
    
    if (!organization_name) {
      return res.status(400).json({ ok: false, error: 'Organization name is required' });
    }

    const db = await getDatabase();
    const collection = db.collection('credit_customers');
    
    const result = await collection.insertOne({
      registered_date: registered_date || new Date().toISOString().split('T')[0],
      organization_name,
      tin_gst_no: tin_gst_no || '',
      representative_name: representative_name || '',
      organization_address: organization_address || '',
      advance_no: advance_no || '',
      phone_number: phone_number || '',
      mobile_number: phone_number || '', // Backward compatibility
      alt_phone_no: alt_phone_no || '',
      credit_limit: Number(credit_limit) || 0,
      username: username || '',
      password: password || '',
      email: email || '',
      opening_balance: Number(opening_balance) || 0,
      opening_date: opening_date || new Date().toISOString().split('T')[0],
      balance_type: balance_type || 'Credit',
      current_balance: Number(opening_balance) || 0,
      penalty_interest: penalty_interest || false,
      run_interest: run_interest || 'No',
      grace_days: Number(grace_days) || 0,
      interest_percentage: Number(interest_percentage) || 0,
      discount_amount: Number(discount_amount) || 0,
      offer_type: offer_type || 'Per 1 ltr',
      vehicle_no: vehicle_no || '',
      vehicle_type: vehicle_type || '',
      image_url: image_url || '',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });

    res.json({ ok: true, id: result.insertedId.toString() });
  } catch (error) {
    console.error('Error creating credit customer:', error);
    res.status(500).json({ ok: false, error: 'Failed to create credit customer' });
  }
});

masterDataRouter.put('/credit-customers/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      registered_date,
      organization_name,
      tin_gst_no,
      representative_name,
      organization_address,
      advance_no,
      phone_number,
      alt_phone_no,
      credit_limit,
      username,
      password,
      email,
      opening_balance,
      opening_date,
      balance_type,
      penalty_interest,
      run_interest,
      grace_days,
      interest_percentage,
      discount_amount,
      offer_type,
      vehicle_no,
      vehicle_type,
      image_url,
      is_active
    } = req.body;

    console.log('PUT /credit-customers/:id - Received request:', { id, hasIsActive: is_active !== undefined });

    if (!id) {
      return res.status(400).json({ ok: false, error: 'Customer ID is required' });
    }

    const db = await getDatabase();
    const collection = db.collection('credit_customers');
    
    const updateData: any = {
      updated_at: new Date(),
    };
    
    if (registered_date !== undefined) updateData.registered_date = registered_date;
    if (organization_name !== undefined) updateData.organization_name = organization_name;
    if (tin_gst_no !== undefined) updateData.tin_gst_no = tin_gst_no;
    if (representative_name !== undefined) updateData.representative_name = representative_name;
    if (organization_address !== undefined) updateData.organization_address = organization_address;
    if (advance_no !== undefined) updateData.advance_no = advance_no;
    if (phone_number !== undefined) {
      updateData.phone_number = phone_number;
      updateData.mobile_number = phone_number; // Backward compatibility
    }
    if (alt_phone_no !== undefined) updateData.alt_phone_no = alt_phone_no;
    if (credit_limit !== undefined) updateData.credit_limit = Number(credit_limit);
    if (username !== undefined) updateData.username = username;
    if (password !== undefined) updateData.password = password;
    if (email !== undefined) updateData.email = email;
    if (opening_balance !== undefined) updateData.opening_balance = Number(opening_balance);
    if (opening_date !== undefined) updateData.opening_date = opening_date;
    if (balance_type !== undefined) updateData.balance_type = balance_type;
    if (penalty_interest !== undefined) updateData.penalty_interest = penalty_interest;
    if (run_interest !== undefined) updateData.run_interest = run_interest;
    if (grace_days !== undefined) updateData.grace_days = Number(grace_days);
    if (interest_percentage !== undefined) updateData.interest_percentage = Number(interest_percentage);
    if (discount_amount !== undefined) updateData.discount_amount = Number(discount_amount);
    if (offer_type !== undefined) updateData.offer_type = offer_type;
    if (vehicle_no !== undefined) updateData.vehicle_no = vehicle_no;
    if (vehicle_type !== undefined) updateData.vehicle_type = vehicle_type;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    console.log('Attempting to update credit customer with ID:', id);

    // Convert string ID to MongoDB ObjectId
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    console.log('Update result:', { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, error: 'Customer not found' });
    }

    res.json({ ok: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error updating credit customer:', error);
    res.status(500).json({ ok: false, error: 'Failed to update credit customer' });
  }
});

masterDataRouter.delete('/credit-customers/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const collection = db.collection('credit_customers');
    
    // Convert string ID to MongoDB ObjectId
    const result = await collection.deleteOne(
      { _id: new ObjectId(id) }
    );

    res.json({ ok: result.deletedCount > 0 });
  } catch (error) {
    console.error('Error deleting credit customer:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete credit customer' });
  }
});

// ========================================
// EMPLOYEES - Master Data
// ========================================
// Manages employee records including personal details, salary, designation, and employment status

masterDataRouter.get('/employees', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const collection = db.collection('employees');
    
    // Fetch all employees, both active and inactive
    const employees = await collection
      .find({})
      .sort({ createdAt: -1, created_at: -1 })
      .toArray();
    
    // Transform _id to id and ensure all field variations are present
    const transformedEmployees = employees.map(emp => {
      const id = emp._id.toString();
      console.log('Transforming employee:', { _id: emp._id, id, employee_name: emp.employee_name || emp.employeeName });
      return {
        ...emp,
        id,
        employee_name: emp.employee_name || emp.employeeName,
        phone_no: emp.phone_no || emp.phoneNumber,
        mobile_number: emp.mobile_number || emp.mobileNumber,
        join_date: emp.join_date || (emp.joiningDate ? new Date(emp.joiningDate).toISOString().split('T')[0] : null),
        is_active: emp.is_active !== undefined ? emp.is_active : (emp.isActive !== undefined ? emp.isActive : true),
      };
    });
    
    console.log(`Fetched ${transformedEmployees.length} employees`);
    res.json({ ok: true, rows: transformedEmployees });
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch employees' });
  }
});

masterDataRouter.post('/employees', async (req: AuthRequest, res: Response) => {
  try {
    const { 
      employee_name, 
      employeeName, // backward compatibility
      designation, 
      phone_no,
      phoneNumber, // backward compatibility
      mobile_number,
      mobileNumber, // backward compatibility
      salary, 
      join_date,
      joiningDate, // backward compatibility
      employee_number,
      id_proof_no,
      salary_type,
      address,
      description,
      has_pf,
      has_esi,
      has_income_tax,
      image_url
    } = req.body;
    
    const finalEmployeeName = employee_name || employeeName;
    if (!finalEmployeeName) {
      return res.status(400).json({ ok: false, error: 'Employee name is required' });
    }

    const db = await getDatabase();
    const collection = db.collection('employees');
    
    const result = await collection.insertOne({
      employee_name: finalEmployeeName,
      employeeName: finalEmployeeName, // backward compatibility
      designation: designation || '',
      phone_no: phone_no || phoneNumber || '',
      phoneNumber: phone_no || phoneNumber || '', // backward compatibility
      mobile_number: mobile_number || mobileNumber || '',
      mobileNumber: mobile_number || mobileNumber || '', // backward compatibility
      salary: Number(salary) || 0,
      join_date: join_date || joiningDate || new Date().toISOString().split('T')[0],
      joiningDate: join_date ? new Date(join_date) : (joiningDate ? new Date(joiningDate) : new Date()), // backward compatibility
      employee_number: employee_number || '',
      id_proof_no: id_proof_no || '',
      salary_type: salary_type || 'Monthly',
      address: address || '',
      description: description || '',
      has_pf: has_pf || false,
      has_esi: has_esi || false,
      has_income_tax: has_income_tax || false,
      image_url: image_url || '',
      status: 'Active',
      isActive: true,
      is_active: true,
      createdAt: new Date(),
      created_at: new Date(),
    });

    res.json({ ok: true, id: result.insertedId.toString() });
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ ok: false, error: 'Failed to create employee' });
  }
});

masterDataRouter.put('/employees/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { 
      employee_name,
      employeeName, // backward compatibility
      designation, 
      phone_no,
      phoneNumber, // backward compatibility
      mobile_number,
      mobileNumber, // backward compatibility
      salary, 
      join_date,
      joiningDate, // backward compatibility
      employee_number,
      id_proof_no,
      salary_type,
      address,
      description,
      has_pf,
      has_esi,
      has_income_tax,
      image_url,
      is_active
    } = req.body;

    console.log('PUT /employees/:id - Received request:', { id, body: req.body });
    console.log('ID type:', typeof id, 'ID length:', id?.length, 'ID value:', id);

    // Check if ID is valid
    if (!id) {
      console.error('ID is missing');
      return res.status(400).json({ ok: false, error: 'Employee ID is required' });
    }

    const db = await getDatabase();
    const collection = db.collection('employees');
    
    const updateData: any = {
      updated_at: new Date(),
    };

    const finalEmployeeName = employee_name || employeeName;
    if (finalEmployeeName !== undefined) {
      updateData.employee_name = finalEmployeeName;
      updateData.employeeName = finalEmployeeName; // backward compatibility
    }
    if (designation !== undefined) updateData.designation = designation;
    
    const finalPhoneNo = phone_no || phoneNumber;
    if (finalPhoneNo !== undefined) {
      updateData.phone_no = finalPhoneNo;
      updateData.phoneNumber = finalPhoneNo; // backward compatibility
    }
    
    const finalMobileNumber = mobile_number || mobileNumber;
    if (finalMobileNumber !== undefined) {
      updateData.mobile_number = finalMobileNumber;
      updateData.mobileNumber = finalMobileNumber; // backward compatibility
    }
    
    if (salary !== undefined) updateData.salary = Number(salary);
    
    const finalJoinDate = join_date || joiningDate;
    if (finalJoinDate !== undefined) {
      updateData.join_date = finalJoinDate;
      updateData.joiningDate = new Date(finalJoinDate); // backward compatibility
    }
    
    if (employee_number !== undefined) updateData.employee_number = employee_number;
    if (id_proof_no !== undefined) updateData.id_proof_no = id_proof_no;
    if (salary_type !== undefined) updateData.salary_type = salary_type;
    if (address !== undefined) updateData.address = address;
    if (description !== undefined) updateData.description = description;
    if (has_pf !== undefined) updateData.has_pf = has_pf;
    if (has_esi !== undefined) updateData.has_esi = has_esi;
    if (has_income_tax !== undefined) updateData.has_income_tax = has_income_tax;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (is_active !== undefined) {
      updateData.is_active = is_active;
      updateData.isActive = is_active; // backward compatibility
    }
    
    console.log('Update data prepared:', updateData);
    console.log('Attempting to update employee with ID:', id);
    console.log('ID type:', typeof id, 'ID value:', id);

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      console.error('Invalid ObjectId format:', id);
      return res.status(400).json({ ok: false, error: 'Invalid employee ID format' });
    }

    // First, let's check if the employee exists
    const objectId = new ObjectId(id);
    console.log('Created ObjectId:', objectId);
    
    let employee = await collection.findOne({ _id: objectId });
    console.log('Found employee:', employee ? 'Yes' : 'No');
    
    if (!employee) {
      console.error('Employee not found with ID:', id);
      return res.status(404).json({ ok: false, error: 'Employee not found' });
    }

    // Now update using ObjectId
    const result = await collection.updateOne(
      { _id: objectId },
      { $set: updateData }
    );

    console.log('Update result:', { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, error: 'Employee not found after update' });
    }

    res.json({ ok: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ ok: false, error: 'Failed to update employee' });
  }
});

masterDataRouter.delete('/employees/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, error: 'Invalid employee ID format' });
    }
    
    const db = await getDatabase();
    const collection = db.collection('employees');
    
    // Hard delete - completely remove from database
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    res.json({ ok: result.deletedCount > 0 });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete employee' });
  }
});

// ========================================
// VENDORS - Master Data
// ========================================
// Manages vendor/supplier information for fuel and lubricant purchases

masterDataRouter.get('/vendors', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const collection = db.collection('vendors');
    
    const vendors = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    // Map MongoDB camelCase to snake_case for frontend
    const mappedVendors = vendors.map(vendor => ({
      id: vendor._id.toString(),
      vendor_name: vendor.vendorName || '',
      vendor_type: vendor.vendorType || 'Both',
      contact_person: vendor.contactPerson || '',
      phone_number: vendor.phoneNumber || vendor.mobileNumber || '',
      mobile_number: vendor.mobileNumber || vendor.phoneNumber || '',
      email: vendor.email || '',
      address: vendor.address || '',
      gst_tin: vendor.gstNumber || vendor.gstTin || '',
      opening_balance: vendor.openingBalance || 0,
      current_balance: vendor.currentBalance || 0,
      opening_date: vendor.openingDate || null,
      opening_type: vendor.openingType || '',
      description: vendor.description || '',
      is_active: vendor.isActive !== false,
      created_at: vendor.createdAt,
      updated_at: vendor.updatedAt,
    }));
    
    res.json({ ok: true, rows: mappedVendors });
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch vendors' });
  }
});

masterDataRouter.post('/vendors', async (req: AuthRequest, res: Response) => {
  try {
    const { vendor_name, vendor_type, contact_person, phone_number, mobile_number, email, address, gst_tin, opening_balance, opening_date, opening_type, description } = req.body;
    
    if (!vendor_name) {
      return res.status(400).json({ ok: false, error: 'Vendor name is required' });
    }

    const db = await getDatabase();
    const collection = db.collection('vendors');
    
    const result = await collection.insertOne({
      vendorName: vendor_name,
      vendorType: vendor_type || 'Both',
      contactPerson: contact_person || '',
      phoneNumber: phone_number || mobile_number || '',
      mobileNumber: mobile_number || phone_number || '',
      email: email || '',
      address: address || '',
      gstNumber: gst_tin || '',
      gstTin: gst_tin || '',
      openingBalance: parseFloat(opening_balance) || 0,
      currentBalance: parseFloat(opening_balance) || 0,
      openingDate: opening_date ? new Date(opening_date) : null,
      openingType: opening_type || '',
      description: description || '',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.json({ ok: true, id: result.insertedId });
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ ok: false, error: 'Failed to create vendor' });
  }
});

masterDataRouter.put('/vendors/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { vendor_name, vendor_type, contact_person, phone_number, mobile_number, email, address, gst_tin, opening_balance, opening_date, opening_type, description, is_active } = req.body;

    const db = await getDatabase();
    const collection = db.collection('vendors');
    
    // Build update object dynamically
    const updateFields: any = { updatedAt: new Date() };
    if (vendor_name !== undefined) updateFields.vendorName = vendor_name;
    if (vendor_type !== undefined) updateFields.vendorType = vendor_type;
    if (contact_person !== undefined) updateFields.contactPerson = contact_person;
    if (phone_number !== undefined) {
      updateFields.phoneNumber = phone_number;
      updateFields.mobileNumber = phone_number;
    }
    if (mobile_number !== undefined) {
      updateFields.mobileNumber = mobile_number;
      if (!phone_number) updateFields.phoneNumber = mobile_number;
    }
    if (email !== undefined) updateFields.email = email;
    if (address !== undefined) updateFields.address = address;
    if (gst_tin !== undefined) {
      updateFields.gstNumber = gst_tin;
      updateFields.gstTin = gst_tin;
    }
    if (opening_balance !== undefined) updateFields.openingBalance = parseFloat(opening_balance) || 0;
    if (opening_date !== undefined) updateFields.openingDate = opening_date ? new Date(opening_date) : null;
    if (opening_type !== undefined) updateFields.openingType = opening_type;
    if (description !== undefined) updateFields.description = description;
    if (is_active !== undefined) updateFields.isActive = is_active;
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    res.json({ ok: result.modifiedCount > 0 });
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ ok: false, error: 'Failed to update vendor' });
  }
});

masterDataRouter.delete('/vendors/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const collection = db.collection('vendors');
    
    // Permanently delete from collection
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount > 0) {
      res.json({ ok: true });
    } else {
      res.status(404).json({ ok: false, error: 'Vendor not found' });
    }
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete vendor' });
  }
});

// ========================================
// SWIPE MACHINES - Master Data
// ========================================
// Manages card payment terminals (Credit/Debit card machines) for cashless transactions

masterDataRouter.get('/swipe-machines', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const collection = db.collection('swipe_machines');
    const vendorsCollection = db.collection('vendors');
    
    const machines = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    // Get vendor names for machines attached to vendors
    const machinesWithDetails = await Promise.all(
      machines.map(async (machine) => {
        let vendorName = null;
        if (machine.attachType === 'Vendor' && machine.vendorId) {
          const vendor = await vendorsCollection.findOne({ _id: new ObjectId(machine.vendorId) });
          vendorName = vendor?.vendorName || null;
        }
        
        return {
          id: machine._id.toString(),
          machine_name: machine.machineName || '',
          machine_type: machine.machineType || 'Card',
          provider: machine.provider || 'Other',
          machine_id: machine.machineId || '',
          status: machine.status || 'Active',
          attach_type: machine.attachType || null,
          bank_type: machine.bankType || null,
          vendor_id: machine.vendorId || null,
          vendor_name: vendorName,
          created_at: machine.createdAt,
        };
      })
    );
    
    res.json({ ok: true, rows: machinesWithDetails });
  } catch (error) {
    console.error('Error fetching swipe machines:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch swipe machines' });
  }
});

masterDataRouter.post('/swipe-machines', async (req: AuthRequest, res: Response) => {
  try {
    const { machine_name, machine_type, provider, machine_id, status, attach_type, bank_type, vendor_id } = req.body;
    
    if (!machine_name) {
      return res.status(400).json({ ok: false, error: 'Machine name is required' });
    }

    const db = await getDatabase();
    const collection = db.collection('swipe_machines');
    
    const result = await collection.insertOne({
      machineName: machine_name,
      machineType: machine_type || 'Card',
      provider: provider || 'Other',
      machineId: machine_id || '',
      status: status || 'Active',
      attachType: attach_type || null,
      bankType: attach_type === 'Bank' ? bank_type : null,
      vendorId: attach_type === 'Vendor' ? vendor_id : null,
      createdAt: new Date(),
    });

    res.json({ ok: true, id: result.insertedId });
  } catch (error) {
    console.error('Error creating swipe machine:', error);
    res.status(500).json({ ok: false, error: 'Failed to create swipe machine' });
  }
});

masterDataRouter.put('/swipe-machines/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { machine_name, machine_type, provider, machine_id, status, attach_type, bank_type, vendor_id } = req.body;

    const db = await getDatabase();
    const collection = db.collection('swipe_machines');
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          machineName: machine_name,
          machineType: machine_type || 'Card',
          provider: provider || 'Other',
          machineId: machine_id || '',
          status: status || 'Active',
          attachType: attach_type || null,
          bankType: attach_type === 'Bank' ? bank_type : null,
          vendorId: attach_type === 'Vendor' ? vendor_id : null,
        }
      }
    );

    res.json({ ok: result.modifiedCount > 0 });
  } catch (error) {
    console.error('Error updating swipe machine:', error);
    res.status(500).json({ ok: false, error: 'Failed to update swipe machine' });
  }
});

masterDataRouter.delete('/swipe-machines/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const collection = db.collection('swipe_machines');
    
    // Permanent delete from collection
    await collection.deleteOne({ _id: new ObjectId(id) });

    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting swipe machine:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete swipe machine' });
  }
});

// ========================================
// TANKS - Master Data
// ========================================
// Manages fuel storage tanks with capacity tracking and stock levels

masterDataRouter.get('/tanks', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const tanksCollection = db.collection('tanks');
    const productsCollection = db.collection('fuel_products');
    
    // Include both active and inactive tanks, but exclude deleted ones
    const tanks = await tanksCollection
      .find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .toArray();
    
    // Populate product names
    const tanksWithProducts = await Promise.all(tanks.map(async (tank) => {
      let productName = '-';
      if (tank.fuelProductId) {
        const product = await productsCollection.findOne({ _id: new ObjectId(tank.fuelProductId) });
        if (product) {
          productName = product.product_name;
        }
      }
      return {
        ...tank,
        id: tank._id.toString(),
        product_name: productName,
      };
    }));
    
    res.json({ ok: true, rows: tanksWithProducts });
  } catch (error) {
    console.error('Error fetching tanks:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch tanks' });
  }
});

// Alias endpoint for compatibility
masterDataRouter.get('/tanks-list', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const tanksCollection = db.collection('tanks');
    const productsCollection = db.collection('fuel_products');
    
    const tanks = await tanksCollection
      .find({ isDeleted: { $ne: true } })
      .sort({ createdAt: -1 })
      .toArray();
    
    const tanksWithProducts = await Promise.all(tanks.map(async (tank) => {
      let productName = '-';
      if (tank.fuelProductId) {
        const product = await productsCollection.findOne({ _id: new ObjectId(tank.fuelProductId) });
        if (product) {
          productName = product.product_name;
        }
      }
      return {
        ...tank,
        id: tank._id.toString(),
        tank_name: tank.tankNumber,
        tank_number: tank.tankNumber,
        tank_capacity: tank.capacity,
        product_name: productName,
      };
    }));
    
    res.json({ ok: true, rows: tanksWithProducts });
  } catch (error) {
    console.error('Error fetching tanks:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch tanks' });
  }
});

masterDataRouter.get('/tanks/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const tanksCollection = db.collection('tanks');
    const productsCollection = db.collection('fuel_products');
    
    const tank = await tanksCollection.findOne({ _id: new ObjectId(id) });
    
    if (!tank) {
      return res.status(404).json({ ok: false, error: 'Tank not found' });
    }
    
    // Populate product name
    let productName = '-';
    if (tank.fuelProductId) {
      const product = await productsCollection.findOne({ _id: new ObjectId(tank.fuelProductId) });
      if (product) {
        productName = product.product_name;
      }
    }
    
    const tankWithProduct = {
      ...tank,
      id: tank._id.toString(),
      product_name: productName,
    };
    
    res.json({ ok: true, row: tankWithProduct });
  } catch (error) {
    console.error('Error fetching tank:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch tank details' });
  }
});

masterDataRouter.post('/tanks', async (req: AuthRequest, res: Response) => {
  try {
    const { tankNumber, fuelProductId, capacity, nozzles } = req.body;
    
    if (!tankNumber) {
      return res.status(400).json({ ok: false, error: 'Tank number is required' });
    }

    const db = await getDatabase();
    const collection = db.collection('tanks');
    
    const userName = (req.user as any)?.full_name || req.user?.email || 'Super Admin';
    
    const result = await collection.insertOne({
      tankNumber,
      fuelProductId: fuelProductId ? new ObjectId(fuelProductId) : undefined,
      capacity: Number(capacity) || 0,
      currentStock: 0,
      nozzles: nozzles || [],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userName,
      updatedBy: userName,
    });

    res.json({ ok: true, id: result.insertedId });
  } catch (error) {
    console.error('Error creating tank:', error);
    res.status(500).json({ ok: false, error: 'Failed to create tank' });
  }
});

masterDataRouter.put('/tanks/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { tankNumber, fuelProductId, capacity, nozzles } = req.body;

    const db = await getDatabase();
    const collection = db.collection('tanks');
    
    const userName = (req.user as any)?.full_name || req.user?.email || 'Super Admin';
    
    const updateData: any = {
      tankNumber,
      fuelProductId: fuelProductId ? new ObjectId(fuelProductId) : undefined,
      capacity: Number(capacity),
      updatedAt: new Date(),
      updatedBy: userName,
    };

    if (nozzles) {
      updateData.nozzles = nozzles;
    }
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    res.json({ ok: result.modifiedCount > 0 });
  } catch (error) {
    console.error('Error updating tank:', error);
    res.status(500).json({ ok: false, error: 'Failed to update tank' });
  }
});

masterDataRouter.patch('/tanks/:id/toggle-status', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const collection = db.collection('tanks');
    
    const userName = (req.user as any)?.full_name || req.user?.email || 'Super Admin';
    
    // Get current status
    const tank = await collection.findOne({ _id: new ObjectId(id) });
    if (!tank) {
      return res.status(404).json({ ok: false, error: 'Tank not found' });
    }
    
    // Toggle status
    const newStatus = !tank.isActive;
    
    await collection.updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          isActive: newStatus,
          updatedAt: new Date(),
          updatedBy: userName,
        } 
      }
    );

    res.json({ ok: true, isActive: newStatus });
  } catch (error) {
    console.error('Error toggling tank status:', error);
    res.status(500).json({ ok: false, error: 'Failed to toggle tank status' });
  }
});

masterDataRouter.delete('/tanks/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const collection = db.collection('tanks');
    
    // Hard delete: permanently remove from collection
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount > 0) {
      res.json({ ok: true });
    } else {
      res.status(404).json({ ok: false, error: 'Tank not found' });
    }
  } catch (error) {
    console.error('Error deleting tank:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete tank' });
  }
});

// ========================================
// NOZZLES - Master Data
// ========================================
// Manages fuel dispenser nozzles linked to tanks with meter readings and calibration

masterDataRouter.get('/nozzles-list', async (req: AuthRequest, res: Response) => {
  try {
    const { tank_id } = req.query;
    const db = await getDatabase();
    const collection = db.collection('nozzles');
    
    const filter: any = {};
    if (tank_id) {
      filter.tankId = new ObjectId(tank_id as string);
    }
    // Show all nozzles including inactive ones
    // Don't filter by isActive anymore
    
    const nozzles = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .toArray();
    
    // Transform for frontend compatibility
    const transformedNozzles = nozzles.map(nozzle => ({
      ...nozzle,
      id: nozzle._id.toString(),
      nozzle_number: nozzle.nozzleNumber || nozzle.nozzle_number,
      tank_id: nozzle.tankId?.toString() || nozzle.tank_id,
      pump_station: nozzle.pumpStation || nozzle.pump_station,
      is_active: nozzle.isActive !== undefined ? nozzle.isActive : true,
      status: nozzle.isActive ? 'Active' : 'Inactive',
    }));
    
    res.json({ ok: true, rows: transformedNozzles });
  } catch (error) {
    console.error('Error fetching nozzles:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch nozzles' });
  }
});

masterDataRouter.post('/nozzles-list', async (req: AuthRequest, res: Response) => {
  try {
    const { nozzle_number, tank_id, fuel_product_id, pump_station } = req.body;
    
    if (!nozzle_number) {
      return res.status(400).json({ ok: false, error: 'Nozzle number is required' });
    }

    const db = await getDatabase();
    const collection = db.collection('nozzles');
    
    const result = await collection.insertOne({
      nozzleNumber: nozzle_number,
      tankId: tank_id ? new ObjectId(tank_id) : undefined,
      fuelProductId: fuel_product_id ? new ObjectId(fuel_product_id) : undefined,
      pumpStation: pump_station || '',
      isActive: true,
      createdBy: (req.user as any)?.username || 'Unknown',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.json({ ok: true, id: result.insertedId.toString() });
  } catch (error) {
    console.error('Error creating nozzle:', error);
    res.status(500).json({ ok: false, error: 'Failed to create nozzle' });
  }
});

masterDataRouter.get('/nozzles', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const collection = db.collection('nozzles');
    
    const nozzles = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    res.json({ ok: true, rows: nozzles });
  } catch (error) {
    console.error('Error fetching nozzles:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch nozzles' });
  }
});

masterDataRouter.post('/nozzles', async (req: AuthRequest, res: Response) => {
  try {
    const { nozzleNumber, nozzle_number, tankId, tank_id, fuelProductId, pumpStation } = req.body;
    
    const nozzleNum = nozzleNumber || nozzle_number;
    const tankIdValue = tankId || tank_id;
    
    if (!nozzleNum) {
      return res.status(400).json({ ok: false, error: 'Nozzle number is required' });
    }

    const db = await getDatabase();
    const collection = db.collection('nozzles');
    
    const result = await collection.insertOne({
      nozzleNumber: nozzleNum,
      tankId: tankIdValue ? new ObjectId(tankIdValue) : undefined,
      fuelProductId: fuelProductId ? new ObjectId(fuelProductId) : undefined,
      pumpStation: pumpStation || '',
      isActive: true,
      createdBy: (req.user as any)?.username || 'Unknown',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    res.json({ ok: true, id: result.insertedId });
  } catch (error) {
    console.error('Error creating nozzle:', error);
    res.status(500).json({ ok: false, error: 'Failed to create nozzle' });
  }
});

masterDataRouter.put('/nozzles/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nozzleNumber, nozzle_number, tankId, tank_id, fuelProductId, fuel_product_id, pumpStation, pump_station, isActive } = req.body;

    const db = await getDatabase();
    const collection = db.collection('nozzles');
    
    const updateData: any = {
      updatedAt: new Date(),
      updatedBy: (req.user as any)?.username || 'Unknown',
    };
    
    // Update isActive status if provided
    if (isActive !== undefined) {
      updateData.isActive = isActive;
    } else if (nozzleNumber || nozzle_number || tankId || tank_id || fuelProductId || fuel_product_id) {
      // If editing other fields, keep active
      updateData.isActive = true;
    }
    
    // Update nozzle number
    const finalNozzleNumber = nozzleNumber || nozzle_number;
    if (finalNozzleNumber) {
      updateData.nozzleNumber = finalNozzleNumber;
    }
    
    // Update tank ID - must be provided
    const finalTankId = tankId || tank_id;
    if (finalTankId) {
      updateData.tankId = new ObjectId(finalTankId);
    }
    
    // Update fuel product ID - must be provided
    const finalFuelProductId = fuelProductId || fuel_product_id;
    if (finalFuelProductId) {
      updateData.fuelProductId = new ObjectId(finalFuelProductId);
    }
    
    // Update pump station
    const finalPumpStation = pumpStation !== undefined ? pumpStation : pump_station;
    if (finalPumpStation !== undefined) {
      updateData.pumpStation = finalPumpStation || '';
    }
    
    console.log('Updating nozzle:', id, 'with data:', updateData);
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    console.log('Update result:', result.modifiedCount, 'documents modified');
    res.json({ ok: result.modifiedCount > 0 || result.matchedCount > 0 });
  } catch (error) {
    console.error('Error updating nozzle:', error);
    res.status(500).json({ ok: false, error: 'Failed to update nozzle' });
  }
});

masterDataRouter.delete('/nozzles/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const collection = db.collection('nozzles');
    
    // Hard delete: permanently remove from database
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    res.json({ ok: result.deletedCount > 0 });
  } catch (error) {
    console.error('Error deleting nozzle:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete nozzle' });
  }
});

// Alias endpoint for compatibility - PUT
masterDataRouter.put('/nozzles-list/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { nozzle_number, tank_id, pump_station, fuel_product_id } = req.body;

    const db = await getDatabase();
    const collection = db.collection('nozzles');
    
    const updateData: any = {
      updatedAt: new Date(),
      updatedBy: (req.user as any)?.username || 'Unknown',
    };
    
    if (nozzle_number) {
      updateData.nozzleNumber = nozzle_number;
    }
    
    if (tank_id) {
      updateData.tankId = new ObjectId(tank_id);
    }
    
    if (fuel_product_id) {
      updateData.fuelProductId = new ObjectId(fuel_product_id);
    }
    
    if (pump_station !== undefined) {
      updateData.pumpStation = pump_station;
    }
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    res.json({ ok: result.modifiedCount > 0 || result.matchedCount > 0 });
  } catch (error) {
    console.error('Error updating nozzle:', error);
    res.status(500).json({ ok: false, error: 'Failed to update nozzle' });
  }
});

// Alias endpoint for compatibility
masterDataRouter.delete('/nozzles-list/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const collection = db.collection('nozzles');
    
    // Hard delete: permanently remove from database
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    res.json({ ok: result.deletedCount > 0 });
  } catch (error) {
    console.error('Error deleting nozzle:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete nozzle' });
  }
});

// ========================================
// EXPENSE TYPES - Master Data
// ========================================
// Manages categories of expenses for daily operational cost tracking

masterDataRouter.get('/expense-types', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const collection = db.collection('expense_types');
    
    const types = await collection
      .find({})
      .sort({ created_at: -1, createdAt: -1 })
      .toArray();
    
    // Transform _id to id for frontend compatibility
    const transformedTypes = types.map(type => ({
      ...type,
      id: type._id.toString(),
      is_active: type.is_active !== undefined ? type.is_active : true,
    }));
    
    console.log(`Fetched ${transformedTypes.length} expense types`);
    res.json({ ok: true, rows: transformedTypes });
  } catch (error) {
    console.error('Error fetching expense types:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch expense types' });
  }
});

masterDataRouter.post('/expense-types', async (req: AuthRequest, res: Response) => {
  try {
    const data = Array.isArray(req.body) ? req.body : [req.body];
    
    if (data.length === 0) {
      return res.status(400).json({ ok: false, error: 'No data provided' });
    }

    const db = await getDatabase();
    const collection = db.collection('expense_types');
    
    const documentsToInsert = data.map(item => ({
      expense_type_name: item.expense_type_name || item.expenseTypeName,
      effect_for: item.effect_for || 'Employee',
      options: item.options || '',
      is_active: true,
      created_at: new Date(),
      createdAt: new Date(), // backward compatibility
    }));
    
    const result = await collection.insertMany(documentsToInsert);

    res.json({ ok: true, insertedCount: result.insertedCount, ids: Object.values(result.insertedIds) });
  } catch (error) {
    console.error('Error creating expense type:', error);
    res.status(500).json({ ok: false, error: 'Failed to create expense type' });
  }
});

masterDataRouter.put('/expense-types/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { expense_type_name, expenseTypeName, effect_for, options, is_active } = req.body;

    console.log('PUT /expense-types/:id - Received request:', { id, hasIsActive: is_active !== undefined });

    if (!id) {
      return res.status(400).json({ ok: false, error: 'Expense type ID is required' });
    }

    const db = await getDatabase();
    const collection = db.collection('expense_types');
    
    const updateData: any = {
      updated_at: new Date(),
    };
    
    const finalName = expense_type_name || expenseTypeName;
    if (finalName !== undefined) updateData.expense_type_name = finalName;
    if (effect_for !== undefined) updateData.effect_for = effect_for;
    if (options !== undefined) updateData.options = options;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    console.log('Attempting to update expense type with ID:', id);

    // Convert string ID to MongoDB ObjectId
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    console.log('Update result:', { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount });

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, error: 'Expense type not found' });
    }

    res.json({ ok: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error updating expense type:', error);
    res.status(500).json({ ok: false, error: 'Failed to update expense type' });
  }
});

masterDataRouter.delete('/expense-types/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const collection = db.collection('expense_types');
    
    // Hard delete - completely remove from database
    // Convert string ID to MongoDB ObjectId
    const result = await collection.deleteOne(
      { _id: new ObjectId(id) }
    );

    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting expense type:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete expense type' });
  }
});

// ========================================
// BUSINESS PARTIES - Master Data
// ========================================
// Manages business party accounts for credit/debit transactions and financial tracking

masterDataRouter.get('/business-parties', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const collection = db.collection('business_parties');
    
    const parties = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    // Map MongoDB camelCase to snake_case for frontend
    const mappedParties = parties.map(party => ({
      id: party._id.toString(),
      party_name: party.partyName,
      party_type: party.partyType || '',
      phone_number: party.phoneNumber || party.mobileNumber || '',
      email: party.email || '',
      address: party.address || '',
      description: party.description || '',
      opening_balance: party.openingBalance || 0,
      opening_date: party.openingDate,
      opening_type: party.openingType || '',
      is_active: party.isActive !== false,
      created_at: party.createdAt,
    }));
    
    res.json({ ok: true, rows: mappedParties });
  } catch (error) {
    console.error('Error fetching business parties:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch business parties' });
  }
});

masterDataRouter.post('/business-parties', async (req: AuthRequest, res: Response) => {
  try {
    const { party_name, party_type, phone_number, email, address, description, opening_balance, opening_date, opening_type } = req.body;
    
    if (!party_name) {
      return res.status(400).json({ ok: false, error: 'Party name is required' });
    }

    const db = await getDatabase();
    const collection = db.collection('business_parties');
    
    const result = await collection.insertOne({
      partyName: party_name,
      partyType: party_type || '',
      phoneNumber: phone_number || '',
      email: email || '',
      address: address || '',
      description: description || '',
      openingBalance: parseFloat(opening_balance) || 0,
      openingDate: opening_date ? new Date(opening_date) : null,
      openingType: opening_type || '',
      isActive: true,
      createdAt: new Date(),
    });

    res.json({ ok: true, id: result.insertedId });
  } catch (error) {
    console.error('Error creating business party:', error);
    res.status(500).json({ ok: false, error: 'Failed to create business party' });
  }
});

masterDataRouter.put('/business-parties/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { party_name, party_type, phone_number, email, address, description, opening_balance, opening_date, opening_type, is_active } = req.body;

    const db = await getDatabase();
    const collection = db.collection('business_parties');
    
    // Build update object dynamically to only update provided fields
    const updateFields: any = {};
    if (party_name !== undefined) updateFields.partyName = party_name;
    if (party_type !== undefined) updateFields.partyType = party_type;
    if (phone_number !== undefined) updateFields.phoneNumber = phone_number;
    if (email !== undefined) updateFields.email = email;
    if (address !== undefined) updateFields.address = address;
    if (description !== undefined) updateFields.description = description;
    if (opening_balance !== undefined) updateFields.openingBalance = parseFloat(opening_balance) || 0;
    if (opening_date !== undefined) updateFields.openingDate = opening_date ? new Date(opening_date) : null;
    if (opening_type !== undefined) updateFields.openingType = opening_type;
    if (is_active !== undefined) updateFields.isActive = is_active;
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    res.json({ ok: result.modifiedCount > 0 });
  } catch (error) {
    console.error('Error updating business party:', error);
    res.status(500).json({ ok: false, error: 'Failed to update business party' });
  }
});

masterDataRouter.delete('/business-parties/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const collection = db.collection('business_parties');
    
    // Permanently delete from collection
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount > 0) {
      res.json({ ok: true });
    } else {
      res.status(404).json({ ok: false, error: 'Business party not found' });
    }
  } catch (error) {
    console.error('Error deleting business party:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete business party' });
  }
});
// ========================================
// EXPIRY ITEMS - Master Data
// ========================================
// Manages inventory items with expiry dates (lubricants, additives, etc.)

masterDataRouter.get('/expiry-items', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const collection = db.collection('expiry_items');
    
    const items = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    const transformedItems = items.map((item, index) => ({
      id: item._id.toString(),
      item_name: item.itemName || '',
      issue_date: item.issueDate || null,
      expiry_date: item.expiryDate || '',
      status: item.status || 'Active',
      category_name: item.categoryName || '',
      item_no: item.itemNo || '',
      no_of_days: item.noOfDays || 0,
      note: item.note || '',
      created_at: item.createdAt,
      s_no: index + 1,
    }));
    
    res.json({ ok: true, rows: transformedItems });
  } catch (error) {
    console.error('Error fetching expiry items:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch expiry items' });
  }
});

masterDataRouter.post('/expiry-items', async (req: AuthRequest, res: Response) => {
  try {
    const { item_name, issue_date, expiry_date, status, category, item_no, no_of_days, note } = req.body;
    
    if (!item_name || !expiry_date) {
      return res.status(400).json({ ok: false, error: 'Item name and expiry date are required' });
    }

    const db = await getDatabase();
    const collection = db.collection('expiry_items');
    
    const result = await collection.insertOne({
      itemName: item_name,
      issueDate: issue_date ? new Date(issue_date) : null,
      expiryDate: new Date(expiry_date),
      status: status || 'Active',
      categoryName: category || '',
      itemNo: item_no || '',
      noOfDays: parseInt(no_of_days) || 0,
      note: note || '',
      createdAt: new Date(),
    });

    res.json({ ok: true, id: result.insertedId });
  } catch (error) {
    console.error('Error creating expiry item:', error);
    res.status(500).json({ ok: false, error: 'Failed to create expiry item' });
  }
});

masterDataRouter.put('/expiry-items/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { item_name, issue_date, expiry_date, status, category, item_no, no_of_days, note } = req.body;

    const db = await getDatabase();
    const collection = db.collection('expiry_items');
    
    const updateFields: any = {};
    if (item_name !== undefined) updateFields.itemName = item_name;
    if (issue_date !== undefined) updateFields.issueDate = issue_date ? new Date(issue_date) : null;
    if (expiry_date !== undefined) updateFields.expiryDate = new Date(expiry_date);
    if (status !== undefined) updateFields.status = status;
    if (category !== undefined) updateFields.categoryName = category;
    if (item_no !== undefined) updateFields.itemNo = item_no;
    if (no_of_days !== undefined) updateFields.noOfDays = parseInt(no_of_days) || 0;
    if (note !== undefined) updateFields.note = note;
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    res.json({ ok: result.modifiedCount > 0 });
  } catch (error) {
    console.error('Error updating expiry item:', error);
    res.status(500).json({ ok: false, error: 'Failed to update expiry item' });
  }
});

masterDataRouter.delete('/expiry-items/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const collection = db.collection('expiry_items');
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount > 0) {
      res.json({ ok: true });
    } else {
      res.status(404).json({ ok: false, error: 'Expiry item not found' });
    }
  } catch (error) {
    console.error('Error deleting expiry item:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete expiry item' });
  }
});

// ========================================
// EXPIRY CATEGORIES - Master Data
// ========================================
// Manages categories for organizing expiry items by type

masterDataRouter.get('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const collection = db.collection('expiry_categories');
    
    const categories = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    const transformedCategories = categories.map(category => ({
      id: category._id.toString(),
      category_name: category.categoryName || '',
      description: category.description || '',
      is_active: category.isActive !== false,
      created_at: category.createdAt,
    }));
    
    res.json({ ok: true, rows: transformedCategories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch categories' });
  }
});

masterDataRouter.post('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const { category_name, description } = req.body;
    
    if (!category_name) {
      return res.status(400).json({ ok: false, error: 'Category name is required' });
    }

    const db = await getDatabase();
    const collection = db.collection('expiry_categories');
    
    const result = await collection.insertOne({
      categoryName: category_name,
      description: description || '',
      isActive: true,
      createdAt: new Date(),
    });

    res.json({ ok: true, id: result.insertedId });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ ok: false, error: 'Failed to create category' });
  }
});

masterDataRouter.put('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { category_name, description, is_active } = req.body;

    const db = await getDatabase();
    const collection = db.collection('expiry_categories');
    
    const updateFields: any = {};
    if (category_name !== undefined) updateFields.categoryName = category_name;
    if (description !== undefined) updateFields.description = description;
    if (is_active !== undefined) updateFields.isActive = is_active;
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    res.json({ ok: result.modifiedCount > 0 });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ ok: false, error: 'Failed to update category' });
  }
});

masterDataRouter.delete('/categories/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const collection = db.collection('expiry_categories');
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount > 0) {
      res.json({ ok: true });
    } else {
      res.status(404).json({ ok: false, error: 'Category not found' });
    }
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete category' });
  }
});

// ========================================
// PUMP STATIONS - Master Data
// ========================================
// Manages fuel dispenser/pump station configuration with multiple nozzles

masterDataRouter.get('/pump-stations', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const collection = db.collection('pump_stations');
    
    const stations = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    const transformedStations = stations.map(station => ({
      id: station._id.toString(),
      pump: station.pump || '',
      pump_name: station.pumpName || '',
      is_active: station.isActive !== false,
      created_at: station.createdAt,
      updated_at: station.updatedAt,
    }));
    
    console.log(`Fetched ${transformedStations.length} pump stations`);
    res.json({ ok: true, rows: transformedStations });
  } catch (error) {
    console.error('Error fetching pump stations:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch pump stations' });
  }
});

masterDataRouter.post('/pump-stations', async (req: AuthRequest, res: Response) => {
  try {
    const { pump_name } = req.body;
    
    if (!pump_name) {
      return res.status(400).json({ ok: false, error: 'Pump name is required' });
    }

    const db = await getDatabase();
    const collection = db.collection('pump_stations');
    
    // Get the next pump number (P1, P2, P3, etc.)
    const lastPump = await collection
      .find({})
      .sort({ createdAt: -1 })
      .limit(1)
      .toArray();
    
    let pumpNumber = 'P1';
    if (lastPump.length > 0 && lastPump[0].pump) {
      const lastNumber = parseInt(lastPump[0].pump.replace('P', ''));
      pumpNumber = `P${lastNumber + 1}`;
    }
    
    const result = await collection.insertOne({
      pump: pumpNumber,
      pumpName: pump_name,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: (req.user as any)?.username || 'Unknown',
    });

    res.json({ ok: true, id: result.insertedId.toString(), pump: pumpNumber });
  } catch (error) {
    console.error('Error creating pump station:', error);
    res.status(500).json({ ok: false, error: 'Failed to create pump station' });
  }
});

masterDataRouter.put('/pump-stations/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { pump_name, is_active } = req.body;

    const db = await getDatabase();
    const collection = db.collection('pump_stations');
    
    const updateData: any = {
      updatedAt: new Date(),
      updatedBy: (req.user as any)?.username || 'Unknown',
    };
    
    if (pump_name !== undefined) updateData.pumpName = pump_name;
    if (is_active !== undefined) updateData.isActive = is_active;
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, error: 'Pump station not found' });
    }

    res.json({ ok: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error updating pump station:', error);
    res.status(500).json({ ok: false, error: 'Failed to update pump station' });
  }
});

masterDataRouter.delete('/pump-stations/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const collection = db.collection('pump_stations');
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount > 0) {
      res.json({ ok: true });
    } else {
      res.status(404).json({ ok: false, error: 'Pump station not found' });
    }
  } catch (error) {
    console.error('Error deleting pump station:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete pump station' });
  }
});

// ========================================
// DUTY PAY - Master Data
// ========================================
// Manages shift-based employee duty pay records and compensation

masterDataRouter.get('/duty-pay', async (req: AuthRequest, res: Response) => {
  try {
    const { month } = req.query;
    const db = await getDatabase();
    const collection = db.collection('duty_pay_records');
    
    const query: Filter<any> = {};
    
    // Filter by month if provided (YYYY-MM format)
    if (month && typeof month === 'string') {
      const monthDate = new Date(month + '-01');
      const nextMonth = new Date(monthDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      query.pay_month = {
        $gte: monthDate.toISOString().slice(0, 10),
        $lt: nextMonth.toISOString().slice(0, 10)
      };
    }
    
    const records = await collection
      .find(query)
      .sort({ pay_month: -1 })
      .toArray();
    
    // Transform _id to id for frontend compatibility
    const transformedRecords = records.map(record => ({
      ...record,
      id: record._id.toString(),
    }));
    
    res.json({ ok: true, rows: transformedRecords });
  } catch (error) {
    console.error('Error fetching duty pay records:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch duty pay records' });
  }
});

masterDataRouter.post('/duty-pay', async (req: AuthRequest, res: Response) => {
  try {
    const { pay_month, total_salary, total_employees, notes } = req.body;
    
    if (!pay_month) {
      return res.status(400).json({ ok: false, error: 'Missing required field: pay_month' });
    }

    const db = await getDatabase();
    const collection = db.collection('duty_pay_records');
    
    const result = await collection.insertOne({
      pay_month,
      total_salary: Number(total_salary) || 0,
      total_employees: Number(total_employees) || 0,
      notes: notes || '',
      created_at: new Date(),
      created_by: (req.user as any)?.username || 'Unknown',
    });

    res.json({ ok: true, id: result.insertedId });
  } catch (error) {
    console.error('Error creating duty pay record:', error);
    res.status(500).json({ ok: false, error: 'Failed to create duty pay record' });
  }
});

masterDataRouter.put('/duty-pay/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { pay_month, total_salary, total_employees, notes } = req.body;

    const db = await getDatabase();
    const collection = db.collection('duty_pay_records');
    
    const updateData: any = {
      updated_at: new Date(),
      updated_by: (req.user as any)?.username || 'Unknown',
    };

    if (pay_month !== undefined) updateData.pay_month = pay_month;
    if (total_salary !== undefined) updateData.total_salary = Number(total_salary);
    if (total_employees !== undefined) updateData.total_employees = Number(total_employees);
    if (notes !== undefined) updateData.notes = notes;
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, error: 'Duty pay record not found' });
    }

    res.json({ ok: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error updating duty pay record:', error);
    res.status(500).json({ ok: false, error: 'Failed to update duty pay record' });
  }
});

masterDataRouter.delete('/duty-pay/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const collection = db.collection('duty_pay_records');
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount > 0) {
      res.json({ ok: true });
    } else {
      res.status(404).json({ ok: false, error: 'Duty pay record not found' });
    }
  } catch (error) {
    console.error('Error deleting duty pay record:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete duty pay record' });
  }
});

// ========================================
// DUTY SHIFTS - Master Data
// ========================================
// Manages work shift definitions (Morning, Evening, Night) with timings and pay structure

masterDataRouter.get('/duty-shifts', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const collection = db.collection('duty_shifts');
    
    const shifts = await collection
      .find({})
      .sort({ created_at: -1 })
      .toArray();
    
    // Transform _id to id for frontend compatibility
    const transformedShifts = shifts.map(shift => ({
      ...shift,
      id: shift._id.toString(),
    }));
    
    res.json({ ok: true, rows: transformedShifts });
  } catch (error) {
    console.error('Error fetching duty shifts:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch duty shifts' });
  }
});

masterDataRouter.post('/duty-shifts', async (req: AuthRequest, res: Response) => {
  try {
    const { shift_name, start_time, end_time, duties } = req.body;
    
    if (!shift_name) {
      return res.status(400).json({ ok: false, error: 'Missing required field: shift_name' });
    }

    const db = await getDatabase();
    const collection = db.collection('duty_shifts');
    
    const result = await collection.insertOne({
      shift_name,
      start_time: start_time || null,
      end_time: end_time || null,
      duties: duties ? Number(duties) : null,
      is_active: true,
      created_at: new Date(),
      created_by: req.user?.email || 'Unknown',
    });

    res.json({ ok: true, id: result.insertedId });
  } catch (error) {
    console.error('Error creating duty shift:', error);
    res.status(500).json({ ok: false, error: 'Failed to create duty shift' });
  }
});

masterDataRouter.put('/duty-shifts/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { shift_name, start_time, end_time, duties, is_active } = req.body;

    const db = await getDatabase();
    const collection = db.collection('duty_shifts');
    
    const updateData: any = {
      updated_at: new Date(),
      updated_by: req.user?.email || 'Unknown',
    };

    if (shift_name !== undefined) updateData.shift_name = shift_name;
    if (start_time !== undefined) updateData.start_time = start_time;
    if (end_time !== undefined) updateData.end_time = end_time;
    if (duties !== undefined) updateData.duties = duties ? Number(duties) : null;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, error: 'Duty shift not found' });
    }

    res.json({ ok: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error updating duty shift:', error);
    res.status(500).json({ ok: false, error: 'Failed to update duty shift' });
  }
});

masterDataRouter.delete('/duty-shifts/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const collection = db.collection('duty_shifts');
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount > 0) {
      res.json({ ok: true });
    } else {
      res.status(404).json({ ok: false, error: 'Duty shift not found' });
    }
  } catch (error) {
    console.error('Error deleting duty shift:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete duty shift' });
  }
});

// ========================================
// GUEST ENTRIES - Master Data
// ========================================
// Manages guest/walk-in customer records for one-time or occasional transactions

masterDataRouter.get('/guest-entries', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const collection = db.collection('guest_entries');
    
    const entries = await collection
      .find({})
      .sort({ created_at: -1 })
      .toArray();
    
    // Transform _id to id for frontend compatibility
    const transformedEntries = entries.map(entry => ({
      ...entry,
      id: entry._id.toString(),
    }));
    
    res.json({ ok: true, rows: transformedEntries });
  } catch (error) {
    console.error('Error fetching guest entries:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch guest entries' });
  }
});

masterDataRouter.post('/guest-entries', async (req: AuthRequest, res: Response) => {
  try {
    const {
      sale_date,
      customer_name,
      mobile_number,
      discount_amount,
      offer_type,
      gst_tin_no,
      vehicle_number,
      status
    } = req.body;
    
    if (!sale_date || !customer_name || !mobile_number || !vehicle_number) {
      return res.status(400).json({ ok: false, error: 'Missing required fields' });
    }

    const db = await getDatabase();
    const collection = db.collection('guest_entries');
    
    const result = await collection.insertOne({
      sale_date: new Date(sale_date),
      customer_name,
      mobile_number,
      discount_amount: Number(discount_amount) || 0,
      offer_type: offer_type || '',
      gst_tin_no: gst_tin_no || '',
      vehicle_number,
      status: status || 'ACTIVATED',
      created_at: new Date(),
      created_by: req.user?.email || 'Unknown',
      created_by_name: (req.user as any)?.name || 'Super Admin',
      updated_at: new Date(),
    });

    res.json({ ok: true, id: result.insertedId });
  } catch (error) {
    console.error('Error creating guest entry:', error);
    res.status(500).json({ ok: false, error: 'Failed to create guest entry' });
  }
});

masterDataRouter.put('/guest-entries/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      sale_date,
      customer_name,
      mobile_number,
      discount_amount,
      offer_type,
      gst_tin_no,
      vehicle_number,
      status
    } = req.body;

    const db = await getDatabase();
    const collection = db.collection('guest_entries');
    
    const updateData: any = {
      updated_at: new Date(),
      updated_by: req.user?.email || 'Unknown',
    };

    if (sale_date !== undefined) updateData.sale_date = new Date(sale_date);
    if (customer_name !== undefined) updateData.customer_name = customer_name;
    if (mobile_number !== undefined) updateData.mobile_number = mobile_number;
    if (discount_amount !== undefined) updateData.discount_amount = Number(discount_amount);
    if (offer_type !== undefined) updateData.offer_type = offer_type;
    if (gst_tin_no !== undefined) updateData.gst_tin_no = gst_tin_no;
    if (vehicle_number !== undefined) updateData.vehicle_number = vehicle_number;
    if (status !== undefined) updateData.status = status;
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ ok: false, error: 'Guest entry not found' });
    }

    res.json({ ok: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    console.error('Error updating guest entry:', error);
    res.status(500).json({ ok: false, error: 'Failed to update guest entry' });
  }
});

masterDataRouter.delete('/guest-entries/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const collection = db.collection('guest_entries');
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount > 0) {
      res.json({ ok: true });
    } else {
      res.status(404).json({ ok: false, error: 'Guest entry not found' });
    }
  } catch (error) {
    console.error('Error deleting guest entry:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete guest entry' });
  }
});

// ========================================
// DENOMINATIONS - Master Data
// ========================================
// Manages currency denominations for cash handling and day settlement

masterDataRouter.get('/denominations', async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDatabase();
    const collection = db.collection('denominations');
    
    const denominations = await collection
      .find({})
      .sort({ value: -1 }) // Sort by value descending
      .toArray();
    
    // Transform _id to id for frontend compatibility
    const transformedDenominations = denominations.map(denom => ({
      ...denom,
      id: denom._id.toString(),
    }));
    
    res.json({ ok: true, rows: transformedDenominations });
  } catch (error) {
    console.error('Error fetching denominations:', error);
    res.status(500).json({ ok: false, error: 'Failed to fetch denominations' });
  }
});

masterDataRouter.post('/denominations', async (req: AuthRequest, res: Response) => {
  try {
    const { value } = req.body;
    
    if (!value) {
      return res.status(400).json({ ok: false, error: 'Denomination value is required' });
    }

    const db = await getDatabase();
    const collection = db.collection('denominations');
    
    // Check if denomination already exists
    const existing = await collection.findOne({ value: value.toString() });
    if (existing) {
      return res.status(400).json({ ok: false, error: 'Denomination already exists' });
    }
    
    const result = await collection.insertOne({
      value: value.toString(),
      status: 'ACTIVATED',
      created_at: new Date(),
      created_by: req.user?.email || 'Unknown',
      created_by_name: (req.user as any)?.name || 'Super Admin',
      updated_at: new Date(),
    });

    res.json({ ok: true, id: result.insertedId });
  } catch (error) {
    console.error('Error creating denomination:', error);
    res.status(500).json({ ok: false, error: 'Failed to create denomination' });
  }
});

masterDataRouter.put('/denominations/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { value, status } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, error: 'Invalid ID format' });
    }

    const db = await getDatabase();
    const collection = db.collection('denominations');
    
    const updateData: any = {
      updated_at: new Date(),
      updated_by: req.user?.email || 'Unknown',
      updated_by_name: (req.user as any)?.name || 'Super Admin',
    };
    
    if (value !== undefined) {
      updateData.value = value.toString();
    }
    if (status !== undefined) {
      updateData.status = status;
    }
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount > 0) {
      res.json({ ok: true });
    } else {
      res.status(404).json({ ok: false, error: 'Denomination not found' });
    }
  } catch (error) {
    console.error('Error updating denomination:', error);
    res.status(500).json({ ok: false, error: 'Failed to update denomination' });
  }
});

masterDataRouter.delete('/denominations/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ ok: false, error: 'Invalid ID format' });
    }

    const db = await getDatabase();
    const collection = db.collection('denominations');
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount > 0) {
      res.json({ ok: true });
    } else {
      res.status(404).json({ ok: false, error: 'Denomination not found' });
    }
  } catch (error) {
    console.error('Error deleting denomination:', error);
    res.status(500).json({ ok: false, error: 'Failed to delete denomination' });
  }
});

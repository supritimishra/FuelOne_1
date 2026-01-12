export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      attendance: {
        Row: {
          attendance_date: string
          created_at: string | null
          created_by: string | null
          employee_id: string
          id: string
          notes: string | null
          shift_id: string | null
          status: string | null
        }
        Insert: {
          attendance_date?: string
          created_at?: string | null
          created_by?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          shift_id?: string | null
          status?: string | null
        }
        Update: {
          attendance_date?: string
          created_at?: string | null
          created_by?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          shift_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "duty_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      business_transactions: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          party_name: string
          transaction_date: string
          transaction_type: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          party_name: string
          transaction_date?: string
          transaction_type?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          party_name?: string
          transaction_date?: string
          transaction_type?: string | null
        }
        Relationships: []
      }
      credit_customers: {
        Row: {
          address: string | null
          created_at: string | null
          credit_limit: number | null
          current_balance: number | null
          email: string | null
          id: string
          is_active: boolean | null
          mobile_number: string | null
          opening_balance: number | null
          organization_name: string
          phone_number: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          mobile_number?: string | null
          opening_balance?: number | null
          organization_name: string
          phone_number?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          credit_limit?: number | null
          current_balance?: number | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          mobile_number?: string | null
          opening_balance?: number | null
          organization_name?: string
          phone_number?: string | null
        }
        Relationships: []
      }
      credit_requests: {
        Row: {
          created_at: string | null
          created_by: string | null
          credit_customer_id: string
          fuel_product_id: string | null
          id: string
          notes: string | null
          ordered_quantity: number | null
          request_date: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          credit_customer_id: string
          fuel_product_id?: string | null
          id?: string
          notes?: string | null
          ordered_quantity?: number | null
          request_date?: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          credit_customer_id?: string
          fuel_product_id?: string | null
          id?: string
          notes?: string | null
          ordered_quantity?: number | null
          request_date?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_requests_credit_customer_id_fkey"
            columns: ["credit_customer_id"]
            isOneToOne: false
            referencedRelation: "credit_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_requests_fuel_product_id_fkey"
            columns: ["fuel_product_id"]
            isOneToOne: false
            referencedRelation: "fuel_products"
            referencedColumns: ["id"]
          },
        ]
      }
      credit_sales: {
        Row: {
          created_at: string | null
          created_by: string | null
          credit_customer_id: string
          employee_id: string | null
          fuel_product_id: string | null
          id: string
          price_per_unit: number
          quantity: number
          sale_date: string
          total_amount: number | null
          vehicle_number: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          credit_customer_id: string
          employee_id?: string | null
          fuel_product_id?: string | null
          id?: string
          price_per_unit: number
          quantity: number
          sale_date?: string
          total_amount?: number | null
          vehicle_number?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          credit_customer_id?: string
          employee_id?: string | null
          fuel_product_id?: string | null
          id?: string
          price_per_unit?: number
          quantity?: number
          sale_date?: string
          total_amount?: number | null
          vehicle_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_sales_credit_customer_id_fkey"
            columns: ["credit_customer_id"]
            isOneToOne: false
            referencedRelation: "credit_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_sales_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_sales_fuel_product_id_fkey"
            columns: ["fuel_product_id"]
            isOneToOne: false
            referencedRelation: "fuel_products"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_sale_rates: {
        Row: {
          close_rate: number | null
          created_at: string | null
          created_by: string | null
          fuel_product_id: string
          id: string
          open_rate: number | null
          rate_date: string
          variation_amount: number | null
        }
        Insert: {
          close_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          fuel_product_id: string
          id?: string
          open_rate?: number | null
          rate_date?: string
          variation_amount?: number | null
        }
        Update: {
          close_rate?: number | null
          created_at?: string | null
          created_by?: string | null
          fuel_product_id?: string
          id?: string
          open_rate?: number | null
          rate_date?: string
          variation_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_sale_rates_fuel_product_id_fkey"
            columns: ["fuel_product_id"]
            isOneToOne: false
            referencedRelation: "fuel_products"
            referencedColumns: ["id"]
          },
        ]
      }
      day_settlements: {
        Row: {
          closing_balance: number | null
          created_at: string | null
          created_by: string | null
          credit_amount: number | null
          expenses: number | null
          id: string
          lubricant_sale: number | null
          meter_sale: number | null
          notes: string | null
          opening_balance: number | null
          settlement_date: string
          shortage: number | null
          total_sale: number | null
        }
        Insert: {
          closing_balance?: number | null
          created_at?: string | null
          created_by?: string | null
          credit_amount?: number | null
          expenses?: number | null
          id?: string
          lubricant_sale?: number | null
          meter_sale?: number | null
          notes?: string | null
          opening_balance?: number | null
          settlement_date?: string
          shortage?: number | null
          total_sale?: number | null
        }
        Update: {
          closing_balance?: number | null
          created_at?: string | null
          created_by?: string | null
          credit_amount?: number | null
          expenses?: number | null
          id?: string
          lubricant_sale?: number | null
          meter_sale?: number | null
          notes?: string | null
          opening_balance?: number | null
          settlement_date?: string
          shortage?: number | null
          total_sale?: number | null
        }
        Relationships: []
      }
      denominations: {
        Row: {
          created_at: string | null
          denomination_value: number
          id: string
          is_active: boolean | null
        }
        Insert: {
          created_at?: string | null
          denomination_value: number
          id?: string
          is_active?: boolean | null
        }
        Update: {
          created_at?: string | null
          denomination_value?: number
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      duty_shifts: {
        Row: {
          created_at: string | null
          from_time: string | null
          id: string
          is_active: boolean | null
          number_of_duties: number | null
          shift_name: string
          shift_type: string | null
          to_time: string | null
        }
        Insert: {
          created_at?: string | null
          from_time?: string | null
          id?: string
          is_active?: boolean | null
          number_of_duties?: number | null
          shift_name: string
          shift_type?: string | null
          to_time?: string | null
        }
        Update: {
          created_at?: string | null
          from_time?: string | null
          id?: string
          is_active?: boolean | null
          number_of_duties?: number | null
          shift_name?: string
          shift_type?: string | null
          to_time?: string | null
        }
        Relationships: []
      }
      employee_cash_recovery: {
        Row: {
          balance_amount: number | null
          collection_amount: number
          created_at: string | null
          created_by: string | null
          employee_id: string
          id: string
          notes: string | null
          recovery_date: string
          shortage_amount: number | null
          total_recovery_cash: number | null
        }
        Insert: {
          balance_amount?: number | null
          collection_amount: number
          created_at?: string | null
          created_by?: string | null
          employee_id: string
          id?: string
          notes?: string | null
          recovery_date?: string
          shortage_amount?: number | null
          total_recovery_cash?: number | null
        }
        Update: {
          balance_amount?: number | null
          collection_amount?: number
          created_at?: string | null
          created_by?: string | null
          employee_id?: string
          id?: string
          notes?: string | null
          recovery_date?: string
          shortage_amount?: number | null
          total_recovery_cash?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_cash_recovery_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string | null
          designation: string | null
          esi_amount: number | null
          id: string
          income_tax: number | null
          is_active: boolean | null
          mobile_number: string | null
          name: string
          pf_amount: number | null
          salary: number | null
          salary_type: string | null
        }
        Insert: {
          created_at?: string | null
          designation?: string | null
          esi_amount?: number | null
          id?: string
          income_tax?: number | null
          is_active?: boolean | null
          mobile_number?: string | null
          name: string
          pf_amount?: number | null
          salary?: number | null
          salary_type?: string | null
        }
        Update: {
          created_at?: string | null
          designation?: string | null
          esi_amount?: number | null
          id?: string
          income_tax?: number | null
          is_active?: boolean | null
          mobile_number?: string | null
          name?: string
          pf_amount?: number | null
          salary?: number | null
          salary_type?: string | null
        }
        Relationships: []
      }
      expense_types: {
        Row: {
          affects_employee: boolean | null
          affects_profit: boolean | null
          created_at: string | null
          expense_name: string
          id: string
          is_active: boolean | null
        }
        Insert: {
          affects_employee?: boolean | null
          affects_profit?: boolean | null
          created_at?: string | null
          expense_name: string
          id?: string
          is_active?: boolean | null
        }
        Update: {
          affects_employee?: boolean | null
          affects_profit?: boolean | null
          created_at?: string | null
          expense_name?: string
          id?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          description: string | null
          employee_id: string | null
          expense_date: string
          expense_type_id: string | null
          flow_type: string | null
          id: string
          payment_mode: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          employee_id?: string | null
          expense_date?: string
          expense_type_id?: string | null
          flow_type?: string | null
          id?: string
          payment_mode?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          employee_id?: string | null
          expense_date?: string
          expense_type_id?: string | null
          flow_type?: string | null
          id?: string
          payment_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_expense_type_id_fkey"
            columns: ["expense_type_id"]
            isOneToOne: false
            referencedRelation: "expense_types"
            referencedColumns: ["id"]
          },
        ]
      }
      expiry_items: {
        Row: {
          category: string | null
          created_at: string | null
          days_before_alert: number | null
          expiry_date: string | null
          id: string
          is_active: boolean | null
          item_name: string
          item_number: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          days_before_alert?: number | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          item_name: string
          item_number?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          days_before_alert?: number | null
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          item_name?: string
          item_number?: string | null
        }
        Relationships: []
      }
      fuel_products: {
        Row: {
          created_at: string | null
          gst_percentage: number | null
          id: string
          is_active: boolean | null
          lfrn: string | null
          product_name: string
          short_name: string
          tds_percentage: number | null
          wgt_percentage: number | null
        }
        Insert: {
          created_at?: string | null
          gst_percentage?: number | null
          id?: string
          is_active?: boolean | null
          lfrn?: string | null
          product_name: string
          short_name: string
          tds_percentage?: number | null
          wgt_percentage?: number | null
        }
        Update: {
          created_at?: string | null
          gst_percentage?: number | null
          id?: string
          is_active?: boolean | null
          lfrn?: string | null
          product_name?: string
          short_name?: string
          tds_percentage?: number | null
          wgt_percentage?: number | null
        }
        Relationships: []
      }
      guest_sales: {
        Row: {
          created_at: string | null
          created_by: string | null
          discount: number | null
          fuel_product_id: string
          id: string
          mobile_number: string | null
          payment_mode: string | null
          price_per_unit: number
          quantity: number
          sale_date: string
          total_amount: number | null
          vehicle_number: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          discount?: number | null
          fuel_product_id: string
          id?: string
          mobile_number?: string | null
          payment_mode?: string | null
          price_per_unit: number
          quantity: number
          sale_date?: string
          total_amount?: number | null
          vehicle_number?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          discount?: number | null
          fuel_product_id?: string
          id?: string
          mobile_number?: string | null
          payment_mode?: string | null
          price_per_unit?: number
          quantity?: number
          sale_date?: string
          total_amount?: number | null
          vehicle_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_sales_fuel_product_id_fkey"
            columns: ["fuel_product_id"]
            isOneToOne: false
            referencedRelation: "fuel_products"
            referencedColumns: ["id"]
          },
        ]
      }
      interest_transactions: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          interest_amount: number | null
          loan_amount: number | null
          notes: string | null
          party_name: string
          principal_paid: number | null
          transaction_date: string
          transaction_type: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          interest_amount?: number | null
          loan_amount?: number | null
          notes?: string | null
          party_name: string
          principal_paid?: number | null
          transaction_date?: string
          transaction_type?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          interest_amount?: number | null
          loan_amount?: number | null
          notes?: string | null
          party_name?: string
          principal_paid?: number | null
          transaction_date?: string
          transaction_type?: string | null
        }
        Relationships: []
      }
      lubricant_sales: {
        Row: {
          created_at: string | null
          created_by: string | null
          credit_customer_id: string | null
          discount: number | null
          employee_id: string | null
          id: string
          lubricant_id: string | null
          quantity: number
          sale_date: string
          sale_rate: number | null
          sale_type: string | null
          total_amount: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          credit_customer_id?: string | null
          discount?: number | null
          employee_id?: string | null
          id?: string
          lubricant_id?: string | null
          quantity: number
          sale_date?: string
          sale_rate?: number | null
          sale_type?: string | null
          total_amount?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          credit_customer_id?: string | null
          discount?: number | null
          employee_id?: string | null
          id?: string
          lubricant_id?: string | null
          quantity?: number
          sale_date?: string
          sale_rate?: number | null
          sale_type?: string | null
          total_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lubricant_sales_credit_customer_id_fkey"
            columns: ["credit_customer_id"]
            isOneToOne: false
            referencedRelation: "credit_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lubricant_sales_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lubricant_sales_lubricant_id_fkey"
            columns: ["lubricant_id"]
            isOneToOne: false
            referencedRelation: "lubricants"
            referencedColumns: ["id"]
          },
        ]
      }
      lubricants: {
        Row: {
          created_at: string | null
          current_stock: number | null
          gst_percentage: number | null
          hsn_code: string | null
          id: string
          is_active: boolean | null
          maximum_stock: number | null
          mrp_rate: number | null
          product_name: string
          sale_rate: number | null
        }
        Insert: {
          created_at?: string | null
          current_stock?: number | null
          gst_percentage?: number | null
          hsn_code?: string | null
          id?: string
          is_active?: boolean | null
          maximum_stock?: number | null
          mrp_rate?: number | null
          product_name: string
          sale_rate?: number | null
        }
        Update: {
          created_at?: string | null
          current_stock?: number | null
          gst_percentage?: number | null
          hsn_code?: string | null
          id?: string
          is_active?: boolean | null
          maximum_stock?: number | null
          mrp_rate?: number | null
          product_name?: string
          sale_rate?: number | null
        }
        Relationships: []
      }
      nozzles: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          nozzle_number: string
          pump_station: string | null
          tank_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          nozzle_number: string
          pump_station?: string | null
          tank_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          nozzle_number?: string
          pump_station?: string | null
          tank_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nozzles_tank_id_fkey"
            columns: ["tank_id"]
            isOneToOne: false
            referencedRelation: "tanks"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_details: {
        Row: {
          bank_address: string | null
          bank_name: string | null
          company_name: string
          contact_number: string | null
          created_at: string | null
          email: string | null
          id: string
          logo_url: string | null
          sms_api_key: string | null
          subscription_end_date: string | null
          subscription_start_date: string | null
          tin_gst_number: string | null
          updated_at: string | null
        }
        Insert: {
          bank_address?: string | null
          bank_name?: string | null
          company_name?: string
          contact_number?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          sms_api_key?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          tin_gst_number?: string | null
          updated_at?: string | null
        }
        Update: {
          bank_address?: string | null
          bank_name?: string | null
          company_name?: string
          contact_number?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          logo_url?: string | null
          sms_api_key?: string | null
          subscription_end_date?: string | null
          subscription_start_date?: string | null
          tin_gst_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      recoveries: {
        Row: {
          created_at: string | null
          created_by: string | null
          credit_customer_id: string
          discount: number | null
          id: string
          notes: string | null
          payment_mode: string | null
          received_amount: number
          recovery_date: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          credit_customer_id: string
          discount?: number | null
          id?: string
          notes?: string | null
          payment_mode?: string | null
          received_amount: number
          recovery_date?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          credit_customer_id?: string
          discount?: number | null
          id?: string
          notes?: string | null
          payment_mode?: string | null
          received_amount?: number
          recovery_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "recoveries_credit_customer_id_fkey"
            columns: ["credit_customer_id"]
            isOneToOne: false
            referencedRelation: "credit_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_entries: {
        Row: {
          closing_reading: number | null
          created_at: string | null
          created_by: string | null
          employee_id: string | null
          fuel_product_id: string | null
          id: string
          net_sale_amount: number | null
          nozzle_id: string | null
          opening_reading: number | null
          price_per_unit: number | null
          pump_station: string | null
          quantity: number | null
          sale_date: string
          shift_id: string | null
        }
        Insert: {
          closing_reading?: number | null
          created_at?: string | null
          created_by?: string | null
          employee_id?: string | null
          fuel_product_id?: string | null
          id?: string
          net_sale_amount?: number | null
          nozzle_id?: string | null
          opening_reading?: number | null
          price_per_unit?: number | null
          pump_station?: string | null
          quantity?: number | null
          sale_date?: string
          shift_id?: string | null
        }
        Update: {
          closing_reading?: number | null
          created_at?: string | null
          created_by?: string | null
          employee_id?: string | null
          fuel_product_id?: string | null
          id?: string
          net_sale_amount?: number | null
          nozzle_id?: string | null
          opening_reading?: number | null
          price_per_unit?: number | null
          pump_station?: string | null
          quantity?: number | null
          sale_date?: string
          shift_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sale_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_entries_fuel_product_id_fkey"
            columns: ["fuel_product_id"]
            isOneToOne: false
            referencedRelation: "fuel_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_entries_nozzle_id_fkey"
            columns: ["nozzle_id"]
            isOneToOne: false
            referencedRelation: "nozzles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_entries_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "duty_shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_officer_inspections: {
        Row: {
          created_at: string | null
          created_by: string | null
          dip_value: number | null
          fuel_product_id: string
          id: string
          inspection_date: string
          notes: string | null
          total_sale_liters: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          dip_value?: number | null
          fuel_product_id: string
          id?: string
          inspection_date?: string
          notes?: string | null
          total_sale_liters?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          dip_value?: number | null
          fuel_product_id?: string
          id?: string
          inspection_date?: string
          notes?: string | null
          total_sale_liters?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_officer_inspections_fuel_product_id_fkey"
            columns: ["fuel_product_id"]
            isOneToOne: false
            referencedRelation: "fuel_products"
            referencedColumns: ["id"]
          },
        ]
      }
      swipe_transactions: {
        Row: {
          amount: number
          batch_number: string | null
          created_at: string | null
          created_by: string | null
          employee_id: string | null
          id: string
          swipe_mode: string | null
          swipe_type: string | null
          transaction_date: string
        }
        Insert: {
          amount: number
          batch_number?: string | null
          created_at?: string | null
          created_by?: string | null
          employee_id?: string | null
          id?: string
          swipe_mode?: string | null
          swipe_type?: string | null
          transaction_date?: string
        }
        Update: {
          amount?: number
          batch_number?: string | null
          created_at?: string | null
          created_by?: string | null
          employee_id?: string | null
          id?: string
          swipe_mode?: string | null
          swipe_type?: string | null
          transaction_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "swipe_transactions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      tanker_sales: {
        Row: {
          before_dip_stock: number | null
          created_at: string | null
          created_by: string | null
          fuel_product_id: string
          gross_stock: number | null
          id: string
          notes: string | null
          sale_date: string
          tanker_sale_quantity: number
        }
        Insert: {
          before_dip_stock?: number | null
          created_at?: string | null
          created_by?: string | null
          fuel_product_id: string
          gross_stock?: number | null
          id?: string
          notes?: string | null
          sale_date?: string
          tanker_sale_quantity: number
        }
        Update: {
          before_dip_stock?: number | null
          created_at?: string | null
          created_by?: string | null
          fuel_product_id?: string
          gross_stock?: number | null
          id?: string
          notes?: string | null
          sale_date?: string
          tanker_sale_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "tanker_sales_fuel_product_id_fkey"
            columns: ["fuel_product_id"]
            isOneToOne: false
            referencedRelation: "fuel_products"
            referencedColumns: ["id"]
          },
        ]
      }
      tanks: {
        Row: {
          created_at: string | null
          current_stock: number | null
          fuel_product_id: string | null
          id: string
          is_active: boolean | null
          tank_capacity: number
          tank_name: string
        }
        Insert: {
          created_at?: string | null
          current_stock?: number | null
          fuel_product_id?: string | null
          id?: string
          is_active?: boolean | null
          tank_capacity: number
          tank_name: string
        }
        Update: {
          created_at?: string | null
          current_stock?: number | null
          fuel_product_id?: string | null
          id?: string
          is_active?: boolean | null
          tank_capacity?: number
          tank_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "tanks_fuel_product_id_fkey"
            columns: ["fuel_product_id"]
            isOneToOne: false
            referencedRelation: "fuel_products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_invoices: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          gst_amount: number | null
          id: string
          invoice_date: string
          invoice_number: string
          invoice_type: string | null
          payment_status: string | null
          total_amount: number | null
          vendor_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          gst_amount?: number | null
          id?: string
          invoice_date?: string
          invoice_number: string
          invoice_type?: string | null
          payment_status?: string | null
          total_amount?: number | null
          vendor_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          gst_amount?: number | null
          id?: string
          invoice_date?: string
          invoice_number?: string
          invoice_type?: string | null
          payment_status?: string | null
          total_amount?: number | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_invoices_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_transactions: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          payment_mode: string | null
          transaction_date: string
          transaction_type: string | null
          vendor_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          payment_mode?: string | null
          transaction_date?: string
          transaction_type?: string | null
          vendor_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          payment_mode?: string | null
          transaction_date?: string
          transaction_type?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_transactions_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          created_at: string | null
          current_balance: number | null
          gst_tin: string | null
          id: string
          is_active: boolean | null
          opening_balance: number | null
          phone_number: string | null
          vendor_name: string
          vendor_type: string | null
        }
        Insert: {
          created_at?: string | null
          current_balance?: number | null
          gst_tin?: string | null
          id?: string
          is_active?: boolean | null
          opening_balance?: number | null
          phone_number?: string | null
          vendor_name: string
          vendor_type?: string | null
        }
        Update: {
          created_at?: string | null
          current_balance?: number | null
          gst_tin?: string | null
          id?: string
          is_active?: boolean | null
          opening_balance?: number | null
          phone_number?: string | null
          vendor_name?: string
          vendor_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "manager" | "dsm" | "employee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "manager", "dsm", "employee"],
    },
  },
} as const

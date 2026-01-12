import { QueryClient } from "@tanstack/react-query";

/**
 * Centralized cache invalidation utility
 * Ensures all related data updates when changes are made
 */

export const invalidateQueries = {
  // When a guest sale is created
  guestSale: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ["guest-sales"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-today-sales"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-fuel-stock"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-fuel-sales-by-product"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-sales-trend"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-tank-stock"] });
    queryClient.invalidateQueries({ queryKey: ["tanks"] });
    queryClient.invalidateQueries({ queryKey: ["sales-reports"] });
    queryClient.invalidateQueries({ queryKey: ["daily-reports"] });
  },

  // When a credit sale is created
  creditSale: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ["credit-sales"] });
    queryClient.invalidateQueries({ queryKey: ["credit-customers"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-today-sales"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-fuel-stock"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-credit-outstanding"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-pending-credit"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-fuel-sales-by-product"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-sales-trend"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-tank-stock"] });
    queryClient.invalidateQueries({ queryKey: ["tanks"] });
    queryClient.invalidateQueries({ queryKey: ["sales-reports"] });
    queryClient.invalidateQueries({ queryKey: ["customer-statements"] });
    queryClient.invalidateQueries({ queryKey: ["generated-invoices"] });
  },

  // When a customer recovery/payment is made
  recovery: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ["recoveries"] });
    queryClient.invalidateQueries({ queryKey: ["credit-customers"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-credit-outstanding"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-pending-credit"] });
    queryClient.invalidateQueries({ queryKey: ["customer-statements"] });
    queryClient.invalidateQueries({ queryKey: ["credit-limit-reports"] });
  },

  // When a tanker sale (bulk fuel receipt) is created
  tankerSale: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ["tanker-sales"] });
    queryClient.invalidateQueries({ queryKey: ["tanks"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-fuel-stock"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-tank-stock"] });
    queryClient.invalidateQueries({ queryKey: ["stock-reports"] });
  },

  // When a lubricant sale is created
  lubricantSale: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ["lubricant-sales"] });
    queryClient.invalidateQueries({ queryKey: ["lubricants"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-low-stock"] });
    queryClient.invalidateQueries({ queryKey: ["stock-reports"] });
    queryClient.invalidateQueries({ queryKey: ["lub-stock"] });
  },

  // When vendor transaction/payment is created
  vendorTransaction: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ["vendor-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["vendors"] });
    queryClient.invalidateQueries({ queryKey: ["vendor-outstanding"] });
    queryClient.invalidateQueries({ queryKey: ["purchase-reports"] });
  },

  // When swipe transaction is created
  swipeTransaction: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ["swipe-transactions"] });
    queryClient.invalidateQueries({ queryKey: ["swipe-machines"] });
    queryClient.invalidateQueries({ queryKey: ["settlement-reports"] });
  },

  // When settlement/denomination is created
  settlement: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ["day-settlements"] });
    queryClient.invalidateQueries({ queryKey: ["denominations"] });
    queryClient.invalidateQueries({ queryKey: ["settlement-reports"] });
    queryClient.invalidateQueries({ queryKey: ["daily-reports"] });
  },

  // When fuel products are updated
  fuelProducts: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ["fuel-products"] });
    queryClient.invalidateQueries({ queryKey: ["tanks"] });
    queryClient.invalidateQueries({ queryKey: ["nozzles"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-fuel-sales-by-product"] });
  },

  // When tanks are updated
  tanks: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ["tanks"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-fuel-stock"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-tank-stock"] });
    queryClient.invalidateQueries({ queryKey: ["stock-reports"] });
  },

  // When credit customers are updated
  creditCustomers: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ["credit-customers"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-credit-outstanding"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-pending-credit"] });
    queryClient.invalidateQueries({ queryKey: ["credit-limit-reports"] });
  },

  // When lubricants are updated
  lubricants: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ["lubricants"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-low-stock"] });
    queryClient.invalidateQueries({ queryKey: ["stock-reports"] });
    queryClient.invalidateQueries({ queryKey: ["lub-stock"] });
  },
};

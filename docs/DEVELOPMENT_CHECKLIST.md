# Development Checklist

This checklist ensures consistent development practices and prevents common issues in the PetroPal application.

## Pre-Development Setup

### 1. Environment Setup
- [ ] Verify `.local.env` file exists with correct database URL
- [ ] Ensure all required environment variables are set
- [ ] Test database connection
- [ ] Run database health check: `node scripts/database-health-check.js`

### 2. Code Standards
- [ ] Use TypeScript for all new files
- [ ] Follow existing naming conventions (camelCase for variables, PascalCase for components)
- [ ] Use consistent import order: React imports, third-party libraries, local imports
- [ ] Add proper TypeScript types for all functions and variables

## Database Changes

### 1. Schema Changes
- [ ] Add table definition to `shared/schema.ts`
- [ ] Create migration script if needed
- [ ] Test migration on development database
- [ ] Verify table exists with correct columns
- [ ] Update database documentation

### 2. API Endpoints
- [ ] Create GET endpoint in `server/routes.ts`
- [ ] Create POST/PUT/DELETE endpoints if needed
- [ ] Add proper error handling with try-catch blocks
- [ ] Validate UUID parameters using `isValidUUID()` helper
- [ ] Test endpoints with curl/Postman
- [ ] Document endpoint parameters and responses

### 3. Data Validation
- [ ] Use `validateFormData()` helper for form validation
- [ ] Validate UUIDs before database operations
- [ ] Validate numeric fields for amounts and quantities
- [ ] Validate required fields
- [ ] Add proper error messages for validation failures

## Frontend Development

### 1. Component Structure
- [ ] Use `useQuery` from `@tanstack/react-query` for data fetching
- [ ] Use `useMutation` for data modifications
- [ ] Remove direct Supabase calls (use backend API instead)
- [ ] Implement proper loading states
- [ ] Add error handling with toast notifications

### 2. Form Handling
- [ ] Use React Hook Form with Zod validation
- [ ] Implement proper form validation
- [ ] Use `handleAPIError()` for consistent error handling
- [ ] Clear form after successful submission
- [ ] Show loading states during submission

### 3. UI/UX Standards
- [ ] Use blue and orange color scheme consistently
- [ ] Apply proper spacing and layout
- [ ] Use Shadcn/ui components
- [ ] Implement responsive design
- [ ] Add proper accessibility attributes

### 4. Date Handling
- [ ] Use `useDateRange()` hook for date filtering
- [ ] Set appropriate default date ranges (12 months for reports)
- [ ] Format dates consistently
- [ ] Handle timezone considerations

## Testing

### 1. Unit Testing
- [ ] Test form validation logic
- [ ] Test API endpoint responses
- [ ] Test error handling scenarios
- [ ] Test edge cases and boundary conditions

### 2. Integration Testing
- [ ] Test complete user workflows
- [ ] Test data flow from frontend to database
- [ ] Test error scenarios
- [ ] Test with different user roles

### 3. Database Testing
- [ ] Test with empty database
- [ ] Test with sample data
- [ ] Test database triggers
- [ ] Test foreign key constraints
- [ ] Run database health check after changes

## Code Review Checklist

### 1. Security
- [ ] No hardcoded credentials or sensitive data
- [ ] Proper input validation and sanitization
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] Proper authentication checks

### 2. Performance
- [ ] Efficient database queries
- [ ] Proper indexing considerations
- [ ] Avoid N+1 query problems
- [ ] Implement proper caching where appropriate
- [ ] Optimize bundle size

### 3. Maintainability
- [ ] Clear and descriptive variable/function names
- [ ] Proper code comments for complex logic
- [ ] Consistent code formatting
- [ ] Proper error handling
- [ ] No code duplication

### 4. Functionality
- [ ] All requirements implemented
- [ ] Edge cases handled
- [ ] Error scenarios covered
- [ ] User experience is smooth
- [ ] Data integrity maintained

## Deployment Checklist

### 1. Pre-Deployment
- [ ] Run all tests
- [ ] Run database health check
- [ ] Verify environment variables
- [ ] Check for any console errors
- [ ] Test critical user workflows

### 2. Database Migration
- [ ] Backup production database
- [ ] Test migration on staging environment
- [ ] Plan rollback strategy
- [ ] Execute migration during maintenance window
- [ ] Verify migration success

### 3. Post-Deployment
- [ ] Monitor application logs
- [ ] Test critical functionality
- [ ] Monitor database performance
- [ ] Check for any errors
- [ ] Update documentation if needed

## Common Issues Prevention

### 1. Database Issues
- [ ] Always use parameterized queries
- [ ] Validate UUIDs before database operations
- [ ] Check foreign key constraints
- [ ] Test database triggers
- [ ] Monitor database performance

### 2. API Issues
- [ ] Implement proper error handling
- [ ] Validate all input parameters
- [ ] Use consistent response format
- [ ] Add proper HTTP status codes
- [ ] Implement request timeout handling

### 3. Frontend Issues
- [ ] Handle loading and error states
- [ ] Implement proper form validation
- [ ] Use consistent date formatting
- [ ] Handle empty data scenarios
- [ ] Implement proper navigation

### 4. Integration Issues
- [ ] Test API endpoints thoroughly
- [ ] Verify data flow between components
- [ ] Test with different data scenarios
- [ ] Handle network errors gracefully
- [ ] Implement proper retry logic

## Documentation

### 1. Code Documentation
- [ ] Document complex functions
- [ ] Add JSDoc comments for public APIs
- [ ] Document configuration options
- [ ] Update README files
- [ ] Document deployment procedures

### 2. Database Documentation
- [ ] Update schema documentation
- [ ] Document new tables and columns
- [ ] Document relationships
- [ ] Document triggers and functions
- [ ] Update API documentation

## Monitoring and Maintenance

### 1. Performance Monitoring
- [ ] Monitor database query performance
- [ ] Monitor API response times
- [ ] Monitor frontend bundle size
- [ ] Monitor memory usage
- [ ] Set up alerts for critical issues

### 2. Regular Maintenance
- [ ] Run database health checks weekly
- [ ] Review and update dependencies
- [ ] Clean up unused code
- [ ] Update documentation
- [ ] Review security practices

---

**Remember:** This checklist should be used for every development task to ensure consistency and prevent common issues. When in doubt, refer to existing code patterns and follow established conventions.

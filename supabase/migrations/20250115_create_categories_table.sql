-- Create categories table for expiry items
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_categories_category_name ON categories(category_name);
CREATE INDEX IF NOT EXISTS idx_categories_is_active ON categories(is_active);

-- Insert some default categories
INSERT INTO categories (category_name, description, is_active) VALUES
('Engine Oils', 'Various engine oil products', true),
('Brake Fluids', 'Brake fluid products', true),
('Transmission Fluids', 'Transmission and gear oils', true),
('Hydraulic Oils', 'Hydraulic system oils', true),
('Power Steering Fluids', 'Power steering system fluids', true),
('Greases', 'Lubricating greases', true),
('Coolants', 'Engine cooling fluids', true),
('Cleaning Products', 'Cleaning and degreasing products', true)
ON CONFLICT (category_name) DO NOTHING;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_categories_updated_at();

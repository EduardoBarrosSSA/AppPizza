// Add PriceUnit type to existing types file
export type PriceUnit = 'unit' | 'kg' | 'g' | 'l' | 'ml';

// Update Product interface to include priceUnit
export interface Product {
  id: string;
  businessId: string;
  name: string;
  description?: string;
  price: number;
  priceUnit: PriceUnit;
  imageUrl?: string;
  inStock: boolean;
  category?: string;
  allowsMultipleFlavors?: boolean;
}

// Rest of the existing types...
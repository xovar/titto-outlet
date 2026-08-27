// ── Mock Data Layer ──────────────────────────────────────────────────────────
// Realistic seed data matching the spec's JSON schema.
// Swap this out for real API responses when a backend is available.

export const mockCategories = [
  { id: 'cat_317c84103c586809', name: 'Sneakers' },
  { id: 'cat_a29f4b6e81d02c33', name: 'Running Shoes' },
  { id: 'cat_6d8e1f3a49b7c5d2', name: 'Boots' },
  { id: 'cat_f1c3e8d2a4b69071', name: 'Sandals' },
  { id: 'cat_8b2d5e7f1a3c9604', name: 'Formal Shoes' },
];

export const mockBrands = [
  { id: 'bra_80eee53aad069788', name: 'Puma' },
  { id: 'bra_4a1b9c3d7e5f2086', name: 'Nike' },
  { id: 'bra_c7d2e8f1a3b45690', name: 'Adidas' },
  { id: 'bra_9e3f1a5b7c2d8406', name: 'New Balance' },
  { id: 'bra_2f6a8d4e1c3b7950', name: 'Reebok' },
];

export const mockColors = [
  { id: 'col_671cd1191f727a41', name: 'Crimson Red', code: '#DC3545' },
  { id: 'col_a2b4c6d8e0f13579', name: 'Ocean Blue', code: '#0D6EFD' },
  { id: 'col_3e5f7a9b1c2d4068', name: 'Forest Green', code: '#198754' },
  { id: 'col_8d1e3f5a7b9c2046', name: 'Midnight Black', code: '#212529' },
  { id: 'col_f4a6b8c0d2e31579', name: 'Arctic White', code: '#F8F9FA' },
  { id: 'col_5c7d9e1f3a2b4068', name: 'Sunset Orange', code: '#FD7E14' },
];

export const mockProducts = [
  {
    id: 'prod_9df86ee4ba705e71',
    name: 'Viper Element Track Cleats',
    description: 'Classic double-knit profile training ground athletic cleats.',
    price: '1000',
    viewed: 245,
    sold: 89,
    discount: '10',
    category: mockCategories[0],
    brand: mockBrands[0],
    variants: [
      {
        id: 'var_83d948e4a6248a6d',
        color: mockColors[0],
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=300&fit=crop',
        ],
        sizes: [
          { id: 'size_2b1bebb01976c8f2', size: '45', stock: 20 },
          { id: 'size_3821c4eb3aa464c9', size: '44', stock: 30 },
          { id: 'size_a1b2c3d4e5f60001', size: '43', stock: 15 },
        ],
      },
      {
        id: 'var_b2c3d4e5f6a70001',
        color: mockColors[3],
        images: [
          'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=400&h=300&fit=crop',
        ],
        sizes: [
          { id: 'size_d4e5f6a7b8c90001', size: '44', stock: 25 },
          { id: 'size_d4e5f6a7b8c90002', size: '42', stock: 18 },
        ],
      },
    ],
  },
  {
    id: 'prod_a1b2c3d4e5f67890',
    name: 'AeroStride Pro Runner',
    description: 'Lightweight mesh upper with responsive cushioning for long-distance runs.',
    price: '1450',
    viewed: 512,
    sold: 203,
    discount: '15',
    category: mockCategories[1],
    brand: mockBrands[1],
    variants: [
      {
        id: 'var_c3d4e5f6a7b80001',
        color: mockColors[1],
        images: [
          'https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=400&h=300&fit=crop',
        ],
        sizes: [
          { id: 'size_e5f6a7b8c9d00001', size: '42', stock: 40 },
          { id: 'size_e5f6a7b8c9d00002', size: '43', stock: 35 },
          { id: 'size_e5f6a7b8c9d00003', size: '44', stock: 22 },
        ],
      },
    ],
  },
  {
    id: 'prod_b2c3d4e5f6a78901',
    name: 'Urban Flex Chelsea Boot',
    description: 'Premium leather chelsea boot with elastic side panels and comfort insole.',
    price: '2200',
    viewed: 178,
    sold: 67,
    discount: '0',
    category: mockCategories[2],
    brand: mockBrands[3],
    variants: [
      {
        id: 'var_d4e5f6a7b8c90001',
        color: mockColors[3],
        images: [
          'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=400&h=300&fit=crop',
        ],
        sizes: [
          { id: 'size_f6a7b8c9d0e10001', size: '41', stock: 12 },
          { id: 'size_f6a7b8c9d0e10002', size: '42', stock: 8 },
          { id: 'size_f6a7b8c9d0e10003', size: '43', stock: 14 },
        ],
      },
    ],
  },
  {
    id: 'prod_c3d4e5f6a7b89012',
    name: 'Cloud Walker Lite',
    description: 'Ultra-soft EVA foam midsole with breathable knit upper for everyday comfort.',
    price: '850',
    viewed: 892,
    sold: 456,
    discount: '20',
    category: mockCategories[0],
    brand: mockBrands[2],
    variants: [
      {
        id: 'var_e5f6a7b8c9d00001',
        color: mockColors[4],
        images: [
          'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=300&fit=crop',
        ],
        sizes: [
          { id: 'size_a7b8c9d0e1f20001', size: '40', stock: 50 },
          { id: 'size_a7b8c9d0e1f20002', size: '41', stock: 45 },
          { id: 'size_a7b8c9d0e1f20003', size: '42', stock: 38 },
          { id: 'size_a7b8c9d0e1f20004', size: '43', stock: 28 },
        ],
      },
      {
        id: 'var_e5f6a7b8c9d00002',
        color: mockColors[5],
        images: [
          'https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=300&fit=crop',
        ],
        sizes: [
          { id: 'size_a7b8c9d0e1f20005', size: '41', stock: 30 },
          { id: 'size_a7b8c9d0e1f20006', size: '42', stock: 25 },
        ],
      },
    ],
  },
  {
    id: 'prod_d4e5f6a7b8c90123',
    name: 'Summit Trailblazer X',
    description: 'Rugged trail running shoe with aggressive grip pattern and waterproof membrane.',
    price: '1800',
    viewed: 334,
    sold: 128,
    discount: '5',
    category: mockCategories[1],
    brand: mockBrands[3],
    variants: [
      {
        id: 'var_f6a7b8c9d0e10001',
        color: mockColors[2],
        images: [
          'https://images.unsplash.com/photo-1539185441755-769473a23570?w=400&h=300&fit=crop',
        ],
        sizes: [
          { id: 'size_b8c9d0e1f2a30001', size: '42', stock: 16 },
          { id: 'size_b8c9d0e1f2a30002', size: '43', stock: 22 },
          { id: 'size_b8c9d0e1f2a30003', size: '44', stock: 11 },
        ],
      },
    ],
  },
  {
    id: 'prod_e5f6a7b8c9d01234',
    name: 'Breeze Slide Comfort',
    description: 'Ergonomic slide sandal with contoured footbed and quick-dry strap.',
    price: '450',
    viewed: 623,
    sold: 312,
    discount: '0',
    category: mockCategories[3],
    brand: mockBrands[4],
    variants: [
      {
        id: 'var_a7b8c9d0e1f20001',
        color: mockColors[3],
        images: [
          'https://images.unsplash.com/photo-1603487742131-4160ec999306?w=400&h=300&fit=crop',
        ],
        sizes: [
          { id: 'size_c9d0e1f2a3b40001', size: '40', stock: 60 },
          { id: 'size_c9d0e1f2a3b40002', size: '41', stock: 55 },
          { id: 'size_c9d0e1f2a3b40003', size: '42', stock: 42 },
        ],
      },
    ],
  },
  {
    id: 'prod_f6a7b8c9d0e12345',
    name: 'Executive Oxford Classic',
    description: 'Hand-stitched calfskin leather oxford with Goodyear welt construction.',
    price: '3500',
    viewed: 156,
    sold: 42,
    discount: '0',
    category: mockCategories[4],
    brand: mockBrands[3],
    variants: [
      {
        id: 'var_b8c9d0e1f2a30001',
        color: mockColors[3],
        images: [
          'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=400&h=300&fit=crop',
        ],
        sizes: [
          { id: 'size_d0e1f2a3b4c50001', size: '41', stock: 8 },
          { id: 'size_d0e1f2a3b4c50002', size: '42', stock: 10 },
          { id: 'size_d0e1f2a3b4c50003', size: '43', stock: 6 },
        ],
      },
    ],
  },
  {
    id: 'prod_a7b8c9d0e1f23456',
    name: 'Pulse React Trainer',
    description: 'Cross-training shoe with React foam and wide base for stability.',
    price: '1250',
    viewed: 411,
    sold: 187,
    discount: '12',
    category: mockCategories[0],
    brand: mockBrands[1],
    variants: [
      {
        id: 'var_c9d0e1f2a3b40001',
        color: mockColors[0],
        images: [
          'https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=400&h=300&fit=crop',
        ],
        sizes: [
          { id: 'size_e1f2a3b4c5d60001', size: '42', stock: 32 },
          { id: 'size_e1f2a3b4c5d60002', size: '43', stock: 28 },
          { id: 'size_e1f2a3b4c5d60003', size: '44', stock: 19 },
        ],
      },
      {
        id: 'var_c9d0e1f2a3b40002',
        color: mockColors[1],
        images: [
          'https://images.unsplash.com/photo-1520256862855-398228c41684?w=400&h=300&fit=crop',
        ],
        sizes: [
          { id: 'size_e1f2a3b4c5d60004', size: '41', stock: 20 },
          { id: 'size_e1f2a3b4c5d60005', size: '42', stock: 15 },
        ],
      },
    ],
  },
];

// ── Dashboard Data ──────────────────────────────────────────────────────────

function generateSalesChartData() {
  const data = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sales: Math.floor(Math.random() * 80) + 20,
      revenue: Math.floor(Math.random() * 8000) + 2000,
    });
  }
  return data;
}

export const mockDashboardStats = {
  totalSales: 1254,
  totalRevenue: 124500,
  todaySales: 45,
  todayRevenue: 4210,
  salesGrowth: 12.5,
  revenueGrowth: 8.3,
};

export const mockSalesChart = generateSalesChartData();

const orderStatuses = ['Ordered', 'On the Way', 'Delivered'];
const customerNames = [
  'Sarah Mitchell', 'James Rodriguez', 'Emily Chen', 'Michael Foster',
  'Jessica Park', 'David Kim', 'Amanda Torres', 'Robert Singh',
  'Lauren Murphy', 'Christopher Lee',
];

export const mockRecentOrders = customerNames.map((name, index) => {
  const product = mockProducts[index % mockProducts.length];
  const daysAgo = Math.floor(Math.random() * 7);
  const orderDate = new Date();
  orderDate.setDate(orderDate.getDate() - daysAgo);

  return {
    id: `ord_${Date.now().toString(36)}${index}`,
    customer: name,
    product: product.name,
    amount: `$${(parseFloat(product.price) * (1 - parseFloat(product.discount) / 100)).toFixed(0)}`,
    status: orderStatuses[index % 3],
    date: orderDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  };
});

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const mongoose = require('mongoose');
const slugify = require('slugify');
const Product = require('../src/modules/products/model');
const Category = require('../src/modules/categories/model');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/yac-fashion';

const CATEGORIES = [
  { name: 'Women', description: 'Elegant women\'s fashion', slug: 'women' },
  { name: 'Men', description: 'Stylish men\'s apparel', slug: 'men' },
  { name: 'Accessories', description: 'Bags, shoes, and accessories', slug: 'accessories' },
  { name: 'Kids', description: 'Comfortable kids wear', slug: 'kids' },
  { name: 'Lifestyle', description: 'Casual and lifestyle pieces', slug: 'lifestyle' },
];

const PRODUCTS = [
  { name: 'Classic Linen Blazer', categorySlug: 'women', price: 45000, compareAtPrice: 55000, stock: 12, isFeatured: true, tags: ['blazer', 'linen', 'formal'], description: 'Elegant linen blazer perfect for office and smart casual occasions. Tailored fit with a modern silhouette.' },
  { name: 'Silk Midi Dress', categorySlug: 'women', price: 38000, stock: 8, isFeatured: true, tags: ['dress', 'silk', 'elegant'], description: 'Flowing silk midi dress in rich tones. Perfect for special occasions and evening wear.' },
  { name: 'High-Waist Trousers', categorySlug: 'women', price: 22000, stock: 15, tags: ['trousers', 'casual'], description: 'Comfortable high-waist trousers with a relaxed fit. Versatile for work and weekend.' },
  { name: 'Cotton Wrap Top', categorySlug: 'women', price: 15000, stock: 20, tags: ['top', 'cotton'], description: 'Soft cotton wrap top in neutral shades. Easy to style with skirts or jeans.' },
  { name: 'Structured Handbag', categorySlug: 'accessories', price: 32000, compareAtPrice: 38000, stock: 10, isFeatured: true, tags: ['bag', 'handbag'], description: 'Structured leather-look handbag with gold-tone hardware. Spacious interior for daily essentials.' },
  { name: 'Leather Ankle Boots', categorySlug: 'accessories', price: 42000, stock: 7, tags: ['shoes', 'boots'], description: 'Classic leather ankle boots with a comfortable block heel. Timeless style for any wardrobe.' },
  { name: 'Minimalist Watch', categorySlug: 'accessories', price: 28000, stock: 14, tags: ['watch', 'accessories'], description: 'Sleek minimalist watch with leather strap. Perfect for everyday elegance.' },
  { name: 'Woven Straw Tote', categorySlug: 'accessories', price: 18000, stock: 18, tags: ['bag', 'tote'], description: 'Lightweight woven straw tote. Ideal for summer outings and beach days.' },
  { name: 'Oxford Cotton Shirt', categorySlug: 'men', price: 18500, stock: 22, isFeatured: true, tags: ['shirt', 'formal'], description: 'Crisp Oxford cotton shirt. A wardrobe essential for smart and casual looks.' },
  { name: 'Chino Trousers', categorySlug: 'men', price: 24000, stock: 16, tags: ['trousers', 'chino'], description: 'Classic chino trousers in versatile colours. Comfortable fit for all-day wear.' },
  { name: 'Linen Safari Jacket', categorySlug: 'men', price: 35000, stock: 9, tags: ['jacket', 'linen'], description: 'Lightweight linen safari jacket. Perfect for warm weather and travel.' },
  { name: 'Polo T-Shirt', categorySlug: 'men', price: 12000, stock: 25, tags: ['polo', 'casual'], description: 'Premium cotton polo t-shirt. Relaxed fit for casual occasions.' },
  { name: 'Kids Denim Jacket', categorySlug: 'kids', price: 14000, stock: 11, tags: ['jacket', 'denim'], description: 'Durable kids denim jacket. Soft wash for comfort and easy care.' },
  { name: 'Cotton Romper Set', categorySlug: 'kids', price: 9500, stock: 19, tags: ['romper', 'cotton'], description: 'Adorable cotton romper set for little ones. Easy to wear and machine washable.' },
  { name: 'Kids Sneakers', categorySlug: 'kids', price: 11000, stock: 13, tags: ['shoes', 'sneakers'], description: 'Comfortable kids sneakers with cushioned sole. Perfect for play and school.' },
  { name: 'Relaxed Loungewear Set', categorySlug: 'lifestyle', price: 16500, stock: 17, isFeatured: true, tags: ['loungewear', 'casual'], description: 'Soft relaxed loungewear set. Ideal for home and casual outings.' },
  { name: 'Oversized Hoodie', categorySlug: 'lifestyle', price: 19500, compareAtPrice: 22000, stock: 14, tags: ['hoodie', 'casual'], description: 'Cozy oversized hoodie in premium cotton. A comfort staple for cooler days.' },
  { name: 'Jogger Pants', categorySlug: 'lifestyle', price: 13500, stock: 21, tags: ['pants', 'joggers'], description: 'Comfortable jogger pants with tapered fit. Perfect for active and casual wear.' },
  { name: 'Graphic Tee', categorySlug: 'lifestyle', price: 8500, stock: 30, tags: ['tee', 'casual'], description: 'Soft graphic tee with minimal design. Everyday essential for your wardrobe.' },
  { name: 'Embroidered Maxi Skirt', categorySlug: 'women', price: 26500, flashSalePrice: 19900, stock: 6, tags: ['skirt', 'maxi'], description: 'Beautiful embroidered maxi skirt. Statement piece for special occasions.' },
];

const getProductImage = (name, index) => `https://picsum.photos/seed/${encodeURIComponent(name)}-${index}/600/600`;

async function seed() {
  await mongoose.connect(MONGO_URI);
  await Product.deleteMany({});
  await Category.deleteMany({});

  const categories = await Category.insertMany(CATEGORIES);
  const categoryMap = Object.fromEntries(categories.map((c) => [c.slug, c._id]));

  const productsToInsert = PRODUCTS.map((p, i) => {
    const categoryId = categoryMap[p.categorySlug];
    if (!categoryId) throw new Error(`Category not found: ${p.categorySlug}`);
    const { categorySlug, ...rest } = p;
    const product = {
      ...rest,
      slug: slugify(p.name, { lower: true, strict: true }),
      category: categoryId,
      images: [getProductImage(p.name, i)],
      sku: `YAC-${String(i + 1).padStart(4, '0')}`,
      ratings: { average: 4 + Math.random() * 0.9, count: Math.floor(Math.random() * 50) + 5 },
    };
    if (product.flashSalePrice) {
      product.flashSaleEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
    return product;
  });

  await Product.insertMany(productsToInsert);
  console.log(`Seeded ${categories.length} categories and ${PRODUCTS.length} products`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

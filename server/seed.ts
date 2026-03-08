import { db } from "./db";
import { categories, products, users } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function seedDatabase() {
  const existingCategories = await db.select().from(categories);
  if (existingCategories.length > 0) return;

  const [mensCat] = await db.insert(categories).values({ name: "Men's Clothing", slug: "mens" }).returning();
  const [womensCat] = await db.insert(categories).values({ name: "Women's Clothing", slug: "womens" }).returning();
  const [bagsCat] = await db.insert(categories).values({ name: "Bags", slug: "bags" }).returning();

  await db.insert(products).values([
    {
      name: "Premium Slim Fit Dress Shirt",
      description: "Elevate your wardrobe with this premium navy blue slim fit dress shirt. Crafted from breathable cotton blend fabric with a modern tailored fit. Perfect for business meetings or evening events.",
      price: "89.99",
      stock: 45,
      image: "/images/product-mens-shirt.png",
      categoryId: mensCat.id,
    },
    {
      name: "Classic Grey Hoodie",
      description: "Stay comfortable and stylish with this classic grey hoodie. Made from premium fleece cotton with a relaxed fit. Features a front kangaroo pocket and adjustable drawstring hood.",
      price: "64.99",
      stock: 60,
      image: "/images/product-mens-hoodie.png",
      categoryId: mensCat.id,
    },
    {
      name: "Tailored Charcoal Trousers",
      description: "Sophisticated charcoal wool-blend trousers with a modern slim fit. Features a flat front design with belt loops and side pockets. Ideal for professional and smart-casual occasions.",
      price: "119.99",
      stock: 30,
      image: "/images/product-mens-trousers.png",
      categoryId: mensCat.id,
    },
    {
      name: "Elegant Black Cocktail Dress",
      description: "Make a statement with this elegant black cocktail dress. Features a flattering silhouette with subtle detailing. Perfect for evening events, parties, and special occasions.",
      price: "149.99",
      stock: 25,
      image: "/images/product-womens-dress.png",
      categoryId: womensCat.id,
    },
    {
      name: "White Silk Blouse",
      description: "Timeless white silk blouse with a refined drape and smooth finish. Features a classic collar and button-front closure. Versatile enough for both office and weekend styling.",
      price: "99.99",
      stock: 35,
      image: "/images/product-womens-blouse.png",
      categoryId: womensCat.id,
    },
    {
      name: "Floral Summer Midi Skirt",
      description: "Embrace the season with this beautiful floral midi skirt. Features a flowing silhouette with a comfortable elastic waistband. Pairs beautifully with blouses and casual tops.",
      price: "74.99",
      stock: 40,
      image: "/images/product-womens-skirt.png",
      categoryId: womensCat.id,
    },
    {
      name: "Luxury Leather Crossbody Bag",
      description: "Handcrafted from premium genuine leather, this crossbody bag combines elegance with everyday functionality. Features an adjustable strap, multiple compartments, and gold-tone hardware.",
      price: "189.99",
      stock: 20,
      image: "/images/product-bag-leather.png",
      categoryId: bagsCat.id,
    },
    {
      name: "Minimalist Canvas Tote Bag",
      description: "A versatile and eco-friendly canvas tote with a sleek minimalist design. Spacious interior with an inner zip pocket. Perfect for daily commutes, shopping, or weekend outings.",
      price: "49.99",
      stock: 55,
      image: "/images/product-bag-tote.png",
      categoryId: bagsCat.id,
    },
    {
      name: "Premium Leather Backpack",
      description: "Stylish tan leather backpack with a refined urban aesthetic. Features padded laptop compartment, multiple organizer pockets, and comfortable adjustable straps. Built for the modern commuter.",
      price: "159.99",
      stock: 15,
      image: "/images/product-bag-backpack.png",
      categoryId: bagsCat.id,
    },
  ]);

  const existingAdmin = await db.select().from(users).where(eq(users.email, "admin@nayafashion.com"));
  if (existingAdmin.length === 0) {
    await db.insert(users).values({
      name: "Admin",
      email: "admin@nayafashion.com",
      password: "admin123",
      role: "admin",
    });
  }
}

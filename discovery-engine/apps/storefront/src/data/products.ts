export type Gender = "men" | "women" | "kids";
export type Category = "ethnic" | "western" | "footwear" | "accessories";

export interface Product {
  id: string;
  brand: string;
  name: string;
  gender: Gender;
  category: Category;
  price: number;
  mrp: number;
  rating: number;
  ratingCount: number;
  image: string;
  images: string[];
  sizes: string[];
  colors: string[];
  description: string;
  seller: string;
}

export const PRODUCTS: Product[] = [
  {
    id: "w-kurta-1",
    brand: "Libas",
    name: "Floral Printed Kurta with Palazzos & Dupatta",
    gender: "women",
    category: "ethnic",
    price: 1499,
    mrp: 2999,
    rating: 4.3,
    ratingCount: 2140,
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80",
    images: [
      "https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80",
      "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=800&q=80"
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: ["Pink", "Ivory"],
    description: "Embroidered ethnic set for festive and wedding-guest occasions.",
    seller: "Libas Official"
  },
  {
    id: "w-kurta-2",
    brand: "W",
    name: "Embroidered Straight Kurta Set",
    gender: "women",
    category: "ethnic",
    price: 1899,
    mrp: 3499,
    rating: 4.1,
    ratingCount: 980,
    image: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&q=80"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Maroon"],
    description: "Straight kurta with detailed embroidery and matching bottoms.",
    seller: "W for Woman"
  },
  {
    id: "w-dress-1",
    brand: "SASSAFRAS",
    name: "Flared Midi Dress",
    gender: "women",
    category: "western",
    price: 1299,
    mrp: 2499,
    rating: 4.4,
    ratingCount: 3312,
    image: "https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800&q=80"],
    sizes: ["XS", "S", "M", "L"],
    colors: ["Black"],
    description: "Occasion-ready midi dress with a flared hem.",
    seller: "SASSAFRAS"
  },
  {
    id: "w-dress-2",
    brand: "Tokyo Talkies",
    name: "Ruched Bodycon Dress",
    gender: "women",
    category: "western",
    price: 899,
    mrp: 1799,
    rating: 4.0,
    ratingCount: 1540,
    image: "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80"],
    sizes: ["S", "M", "L"],
    colors: ["Red"],
    description: "Party dress with ruched sides. Check lining notes in reviews.",
    seller: "Tokyo Talkies"
  },
  {
    id: "w-sneaker-1",
    brand: "Puma",
    name: "Women Smash Sneakers",
    gender: "women",
    category: "footwear",
    price: 2499,
    mrp: 4999,
    rating: 4.2,
    ratingCount: 870,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80"],
    sizes: ["UK 3", "UK 4", "UK 5", "UK 6"],
    colors: ["White"],
    description: "Everyday sneakers. Sizing can vary by brand — check the size chart.",
    seller: "Puma"
  },
  {
    id: "w-bag-1",
    brand: "MANGO",
    name: "Structured Handheld Bag",
    gender: "women",
    category: "accessories",
    price: 2299,
    mrp: 3999,
    rating: 4.5,
    ratingCount: 412,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80"],
    sizes: ["OS"],
    colors: ["Tan"],
    description: "Work-to-weekend structured bag.",
    seller: "MANGO"
  },
  {
    id: "m-shirt-1",
    brand: "Roadster",
    name: "Men Slim Fit Casual Shirt",
    gender: "men",
    category: "western",
    price: 799,
    mrp: 1599,
    rating: 4.1,
    ratingCount: 5200,
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&q=80"],
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: ["Blue"],
    description: "Everyday oxford-style casual shirt.",
    seller: "Roadster"
  },
  {
    id: "m-jean-1",
    brand: "Levis",
    name: "Men 511 Slim Jeans",
    gender: "men",
    category: "western",
    price: 2799,
    mrp: 4999,
    rating: 4.4,
    ratingCount: 2100,
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80"],
    sizes: ["30", "32", "34", "36"],
    colors: ["Indigo"],
    description: "Classic slim jeans. True to size for most reviewers.",
    seller: "Levi's"
  },
  {
    id: "m-ethnic-1",
    brand: "Manyavar",
    name: "Men Embroidered Kurta Set",
    gender: "men",
    category: "ethnic",
    price: 3499,
    mrp: 5999,
    rating: 4.6,
    ratingCount: 640,
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&q=80"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Ivory"],
    description: "Wedding and festive kurta set.",
    seller: "Manyavar"
  },
  {
    id: "m-shoe-1",
    brand: "Nike",
    name: "Men Revolution Running Shoes",
    gender: "men",
    category: "footwear",
    price: 3299,
    mrp: 5995,
    rating: 4.3,
    ratingCount: 4410,
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&q=80"],
    sizes: ["UK 7", "UK 8", "UK 9", "UK 10"],
    colors: ["Black"],
    description: "Daily runners. Compare UK/US sizing before you decide.",
    seller: "Nike"
  },
  {
    id: "m-watch-1",
    brand: "Fossil",
    name: "Men Analog Watch",
    gender: "men",
    category: "accessories",
    price: 5999,
    mrp: 9995,
    rating: 4.2,
    ratingCount: 301,
    image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&q=80"],
    sizes: ["OS"],
    colors: ["Brown"],
    description: "Leather-strap analog watch.",
    seller: "Fossil"
  },
  {
    id: "k-set-1",
    brand: "H&M",
    name: "Kids Printed T-shirt & Shorts Set",
    gender: "kids",
    category: "western",
    price: 699,
    mrp: 1299,
    rating: 4.5,
    ratingCount: 220,
    image: "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=800&q=80"],
    sizes: ["2-3Y", "4-5Y", "6-7Y"],
    colors: ["Yellow"],
    description: "Soft cotton play set.",
    seller: "H&M"
  },
  {
    id: "k-shoe-1",
    brand: "Crocs",
    name: "Kids Clogs",
    gender: "kids",
    category: "footwear",
    price: 1495,
    mrp: 2495,
    rating: 4.7,
    ratingCount: 890,
    image: "https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1514989940723-e8e51635b782?w=800&q=80"],
    sizes: ["C10", "C11", "C12"],
    colors: ["Pink"],
    description: "Lightweight clogs. Reviewers mention a true-to-size fit.",
    seller: "Crocs"
  },
  {
    id: "w-kurta-3",
    brand: "Ahalyaa",
    name: "Women Yoke Design Kurta Set",
    gender: "women",
    category: "ethnic",
    price: 1699,
    mrp: 4299,
    rating: 4.0,
    ratingCount: 1760,
    image: "https://images.unsplash.com/photo-1609505848912-b7c3b8b4beda?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1609505848912-b7c3b8b4beda?w=800&q=80"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Teal"],
    description: "Similar silhouette to other saved kurtas — useful for compare.",
    seller: "Ahalyaa"
  },
  {
    id: "w-sneaker-2",
    brand: "Adidas",
    name: "Women Grand Court Sneakers",
    gender: "women",
    category: "footwear",
    price: 2799,
    mrp: 5599,
    rating: 4.3,
    ratingCount: 650,
    image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&q=80"],
    sizes: ["UK 4", "UK 5", "UK 6", "UK 7"],
    colors: ["White"],
    description: "Court sneakers often compared with other white pairs on wishlists.",
    seller: "Adidas"
  },
  {
    id: "m-tee-1",
    brand: "HRX",
    name: "Men Rapid Dry T-shirt",
    gender: "men",
    category: "western",
    price: 499,
    mrp: 999,
    rating: 4.2,
    ratingCount: 8900,
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80"],
    sizes: ["S", "M", "L", "XL"],
    colors: ["Grey"],
    description: "Training tee with rapid-dry fabric.",
    seller: "HRX"
  }
];

export function discount(product: Product): number {
  return Math.round(((product.mrp - product.price) / product.mrp) * 100);
}

export function formatInr(value: number): string {
  return `₹${value.toLocaleString("en-IN")}`;
}

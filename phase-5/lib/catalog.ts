import type { Category, FitHint, ProductRecord, ReviewRecord } from "./schemas";

function r(
  id: string,
  text: string,
  rating: number,
  fitHint: FitHint = "unknown",
  sizeBought?: string,
  bodyTypeHint?: string
): ReviewRecord {
  return { id, text, rating, fitHint, sizeBought, bodyTypeHint };
}

function img(photoId: string): string {
  return `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&w=800&q=80`;
}

/** Distinct Unsplash stills so two shortlist cards never share a picture. */
const PHOTO: Record<string, string> = {
  "p-kurta-anarkali": "1768033976371-0e4ef195dfa2",
  "p-kurta-straight": "1708534246055-d7b149acb731",
  "p-kurta-festive": "1769063382706-8156b3b33eac",
  "p-kurta-chikankari": "1745313452052-0e4e341f326c",
  "p-kurta-printed": "1604436607823-d721dfe2df46",
  "p-kurta-silk": "1610030469983-98e550d6193c",
  "p-sneaker-white": "1595950653106-6c9ebd614d3a",
  "p-sneaker-chunky": "1460353581641-37baddab0fa2",
  "p-dress-midi": "1515886657613-9f3515b0c78f",
  "p-dress-wrap": "1485968579580-b6d095142e6e",
  "p-dress-bodycon": "1572802419224-296b0aeee0d9",
  "p-top-shirt": "1610030469668-8e9f641aaf27",
  "p-heels-block": "1543163521-1bf539c55dd2",
  "p-flats-juti": "1617627143750-d86bc21e42bb",
  "p-bag-sling": "1584917865442-de89df76afd3",
  "p-earrings-jhumka": "1599643478518-a784e5dc4c8f"
};

function product(
  id: string,
  name: string,
  brand: string,
  category: Category,
  priceInr: number,
  reviews: ReviewRecord[],
  sizeChartText?: string
): ProductRecord {
  const photoId = PHOTO[id];
  return {
    id,
    name,
    brand,
    category,
    priceInr,
    reviews,
    sizeChartText,
    imageUrl: photoId ? img(photoId) : undefined
  };
}

/**
 * Tier 2 of the ingest ladder (5b): the offline catalog every demo and test
 * runs on. Review mixes are deliberate — contradictory sizing on the anarkali,
 * only two reviews on the rayon set so the low-confidence rule fires, and
 * durability language on the chikankari so value confidence has something real
 * to read.
 */
export const CATALOG: ProductRecord[] = [
  product(
    "p-kurta-anarkali",
    "Floral Print Anarkali Kurta Set",
    "Libas",
    "ethnic",
    2499,
    [
      r("rv-anarkali-1", "Size chart said M but it arrived tight across the bust. Order one size up.", 3, "runs_small", "M", "curvy"),
      r("rv-anarkali-2", "Beautiful print, flowy and comfortable for a long function. Length was perfect at 5'4\".", 5, "true_to_size", "L", "average"),
      r("rv-anarkali-3", "Runs small. I usually take L, exchanged for XL and it fits well now.", 4, "runs_small", "L"),
      r("rv-anarkali-4", "Fabric is thin for the price but the fall is good. Wore it to a wedding reception.", 3, "unknown", "M"),
      r("rv-anarkali-5", "Snug on the shoulders even in XL. Not for broad shoulders.", 2, "runs_small", "XL", "broad shoulders")
    ],
    "Bust 38in / Waist 32in for size M; kurta length 52in"
  ),
  product(
    "p-kurta-straight",
    "Straight Cotton Kurta Set with Dupatta",
    "W",
    "ethnic",
    1899,
    [
      r("rv-straight-1", "True to size. Cotton is breathable, wore it through an office day in Chennai heat.", 5, "true_to_size", "M"),
      r("rv-straight-2", "Exactly as per the size chart for once. Comfortable for daily office wear.", 5, "true_to_size", "L", "average"),
      r("rv-straight-3", "Colour faded slightly after the third wash but the fit stayed the same.", 3, "true_to_size", "M"),
      r("rv-straight-4", "Simple and washes well. Have worn it around fifteen times since June.", 4, "true_to_size", "S", "petite")
    ],
    "Bust 38in for M; straight fit, length 46in"
  ),
  product(
    "p-kurta-festive",
    "Festive Zari Work Kurta Set",
    "Biba",
    "ethnic",
    3299,
    [
      r("rv-festive-1", "Loose at the waist, I would size down. Zari work is genuinely rich looking.", 4, "runs_large", "L"),
      r("rv-festive-2", "Roomy fit, good for festive eating. Zari held up after two functions.", 5, "runs_large", "M", "average"),
      r("rv-festive-3", "Too baggy for my frame in M. Lovely for Diwali though.", 3, "runs_large", "M", "petite"),
      r("rv-festive-4", "Dry clean only, which the listing does not make obvious.", 3, "unknown", "L")
    ]
  ),
  product(
    "p-kurta-chikankari",
    "Lucknowi Chikankari Kurta Set",
    "Lucknowi Crafts",
    "ethnic",
    2799,
    [
      r("rv-chikan-1", "Hand embroidery is real and the stitching has survived eight washes.", 5, "true_to_size", "M", "average"),
      r("rv-chikan-2", "Fits as per chart. Worn to office and to a family lunch, works for both.", 5, "true_to_size", "L"),
      r("rv-chikan-3", "Cotton is soft, no fading after two months of regular wear.", 5, "true_to_size", "M"),
      r("rv-chikan-4", "Slightly long for 5'2\" but the tailor fixed it in ten minutes.", 4, "true_to_size", "S", "petite"),
      r("rv-chikan-5", "Expensive but I have worn it more than anything else this year.", 4, "unknown", "M")
    ],
    "Bust 38in for M; regular fit, length 48in"
  ),
  product(
    "p-kurta-printed",
    "Printed Rayon Kurta Set",
    "Anouk",
    "ethnic",
    1299,
    [
      r("rv-printed-1", "Decent for the price, rayon creases quickly though.", 3, "true_to_size", "M"),
      r("rv-printed-2", "Fit was fine, print is brighter than the photo.", 4, "unknown", "L")
    ]
  ),
  product(
    "p-kurta-silk",
    "Blended Silk Kurta Set",
    "Soch",
    "ethnic",
    4199,
    [
      r("rv-silk-1", "Tight at the armholes, size up if you have fuller arms.", 3, "runs_small", "M", "fuller arms"),
      r("rv-silk-2", "Gorgeous drape for a wedding. Ran small so I exchanged to L.", 4, "runs_small", "M"),
      r("rv-silk-3", "Feels premium, held its shape after a full day of functions.", 5, "runs_small", "L", "average"),
      r("rv-silk-4", "Not everyday wear. Beautiful but strictly occasion.", 4, "unknown", "M")
    ]
  ),
  product(
    "p-sneaker-white",
    "Classic White Court Sneakers",
    "Puma",
    "footwear",
    3499,
    [
      r("rv-white-1", "Take half a size up, they run narrow. Comfortable once broken in.", 4, "runs_small", "UK7"),
      r("rv-white-2", "Wore them daily for four months, sole still fine, uppers scuff easily.", 4, "runs_small", "UK6"),
      r("rv-white-3", "Fits true for wide feet if you go a size up.", 4, "runs_small", "UK8", "wide feet"),
      r("rv-white-4", "Goes with jeans and with kurtas, which is why I keep reaching for them.", 5, "unknown", "UK7")
    ]
  ),
  product(
    "p-sneaker-chunky",
    "Chunky Sole Lifestyle Sneakers",
    "Campus",
    "footwear",
    2199,
    [
      r("rv-chunky-1", "True to size and light for how chunky they look.", 4, "true_to_size", "UK7"),
      r("rv-chunky-2", "Sole started separating in month three. Comfortable until then.", 2, "true_to_size", "UK8"),
      r("rv-chunky-3", "Good for college, not for long walking days.", 3, "true_to_size", "UK6", "average")
    ]
  ),
  product(
    "p-dress-midi",
    "Ribbed Bodycon Midi Dress",
    "Vero Moda",
    "western",
    2995,
    [
      r("rv-midi-1", "Ribbed fabric is forgiving but clings at the hips. Size up if unsure.", 4, "runs_small", "M", "pear"),
      r("rv-midi-2", "Wore it to a dinner and a birthday, holds shape well.", 5, "runs_small", "S", "petite"),
      r("rv-midi-3", "Runs small across the chest. Good stretch recovery though.", 3, "runs_small", "L", "curvy")
    ]
  ),
  product(
    "p-dress-wrap",
    "Floral Wrap Midi Dress",
    "Trendyol",
    "western",
    2299,
    [
      r("rv-wrap-1", "Wrap style adjusts to your shape, so sizing is forgiving.", 5, "true_to_size", "M", "curvy"),
      r("rv-wrap-2", "Works for brunch and for a light office day with a jacket.", 4, "true_to_size", "S"),
      r("rv-wrap-3", "Fabric is polyester and warm for summer afternoons.", 3, "true_to_size", "M"),
      r("rv-wrap-4", "Second one I have bought. First survived a year of wear.", 5, "true_to_size", "L", "average")
    ]
  ),
  product(
    "p-dress-bodycon",
    "Sequin Party Bodycon Dress",
    "ONLY",
    "western",
    3199,
    [
      r("rv-bodycon-1", "Very tight, definitely size up. Sequins scratch a little.", 2, "runs_small", "M", "average"),
      r("rv-bodycon-2", "Great for one big night out, not something I would wear often.", 4, "runs_small", "S"),
      r("rv-bodycon-3", "Lost a few sequins on the first wear.", 3, "runs_small", "L")
    ]
  ),
  product(
    "p-top-shirt",
    "Oversized Cotton Poplin Shirt",
    "H&M",
    "western",
    1499,
    [
      r("rv-shirt-1", "Oversized as intended, take your normal size.", 5, "true_to_size", "M"),
      r("rv-shirt-2", "Layer it over dresses or wear it open with jeans, very versatile.", 5, "true_to_size", "L", "average"),
      r("rv-shirt-3", "Cotton wrinkles but washes clean, worn it weekly since March.", 4, "true_to_size", "S")
    ]
  ),
  product(
    "p-heels-block",
    "Block Heel Ethnic Sandals",
    "Metro",
    "footwear",
    2899,
    [
      r("rv-heels-1", "Block heel is stable enough to stand through a whole wedding.", 5, "true_to_size", "UK6"),
      r("rv-heels-2", "Straps rubbed on the first wear, fine after that.", 3, "true_to_size", "UK7", "wide feet"),
      r("rv-heels-3", "Matches ethnic and western both, which justifies the price.", 4, "true_to_size", "UK5", "average")
    ]
  ),
  product(
    "p-flats-juti",
    "Embroidered Juttis",
    "Mochi",
    "footwear",
    1699,
    [
      r("rv-juti-1", "Snug at first, they stretch to fit within a week.", 4, "runs_small", "UK6"),
      r("rv-juti-2", "Embroidery started fraying after four wears.", 2, "runs_small", "UK7"),
      r("rv-juti-3", "Comfortable for festive days when heels are not an option.", 4, "runs_small", "UK5", "narrow feet")
    ]
  ),
  product(
    "p-bag-sling",
    "Quilted Chain Sling Bag",
    "Caprese",
    "accessories",
    1999,
    [
      r("rv-sling-1", "Holds a phone, cardholder and keys, nothing more.", 4),
      r("rv-sling-2", "Chain strap held up through daily commute for six months.", 5),
      r("rv-sling-3", "Faux leather creased at the corners early.", 3)
    ]
  ),
  product(
    "p-earrings-jhumka",
    "Oxidised Silver Jhumkas",
    "Zaveri Pearls",
    "accessories",
    799,
    [
      r("rv-jhumka-1", "Light enough to wear all evening without hurting.", 5),
      r("rv-jhumka-2", "Oxidised coating rubbed off on one earring after a few wears.", 3),
      r("rv-jhumka-3", "Goes with every kurta I own, best value in my wardrobe.", 5)
    ]
  )
];

export function findCatalogProduct(id: string): ProductRecord | undefined {
  return CATALOG.find((item) => item.id === id);
}

export function catalogByCategory(category: Category): ProductRecord[] {
  return CATALOG.filter((item) => item.category === category);
}

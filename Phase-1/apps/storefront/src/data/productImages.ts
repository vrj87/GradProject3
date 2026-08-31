type Dept = "men" | "women" | "kids" | "home" | "beauty";

/**
 * One Unsplash photo ID per product. Primaries must stay unique — never cycle a
 * small pool, or two descriptions will share a picture on the Room rack.
 */
const PHOTO: Record<string, string> = {
  // Women kurtas — mixed colours/silhouettes, not seven red sets
  "w-kurta-1": "1768033976371-0e4ef195dfa2", // pink floral
  "w-kurta-2": "1708534246055-d7b149acb731", // maroon
  "w-kurta-3": "1769063382706-8156b3b33eac", // colourful patterned
  "w-kurta-4": "1594633312681-425c7b97ccd1", // mustard / flared
  "w-kurta-5": "1610047402714-307d99a677db", // pink floral hallway
  "w-kurta-6": "1604436607823-d721dfe2df46", // indigo / blue floral
  "w-kurta-7": "1759840278381-bf7d5e332050", // rani / red kurta
  "w-kurta-8": "1742800764280-d51117b7eb0a", // teal floral set
  "w-kurta-9": "1767785829347-cc13bd969514", // emerald / floral ethnic
  "w-kurta-10": "1745313452052-0e4e341f326c", // ivory chikankari
  "w-kurta-11": "1708534419572-6e6614a53ca1", // mustard outdoor
  "w-kurta-12": "1715859019107-90c16285b149", // indigo block / flatlay

  // Women sarees
  "w-saree-1": "1610030469983-98e550d6193c", // gold-maroon silk
  "w-saree-2": "1641699862936-be9f49b1c38d", // purple-gold
  "w-saree-3": "1761125050348-c7140e0fd4fd", // wine / red-black
  "w-saree-4": "1610189013429-a703f4b245cf", // mustard / blue-yellow
  "w-saree-5": "1732709470611-670308da8c5e", // peach-pink
  "w-saree-6": "1727430228383-aa1fb59db8bf", // indigo drape
  "w-saree-7": "1679006831648-7c9ea12e5807", // green-gold
  "w-saree-8": "1771507057886-defc3e54aa8c", // printed twirl
  "w-saree-9": "1678705730064-a7ecbab4b3fb", // ivory-white
  "w-saree-10": "1628477116196-48afe0d209e0", // wine / red-brown

  "w-lehenga-1": "1756483510831-34a18c266b93",

  // Women dresses — none of these IDs are reused on tops
  "w-dress-1": "1515372039744-b8f02a3ae446", // black flared
  "w-dress-2": "1572802419224-296b0aeee0d9", // red bodycon
  "w-dress-3": "1539008835657-9e8e9680c956", // champagne satin
  "w-dress-4": "1485968579580-b6d095142e6e", // wrap
  "w-dress-5": "1490481651871-ab68de25d43d", // floral a-line
  "w-dress-6": "1469334031218-e382a71b716b", // navy/sand shirt dress
  "w-dress-7": "1515886657613-9f3515b0c78f", // knit bodycon
  "w-dress-8": "1496747611176-843222e1e57c", // linen / field midi
  "w-dress-9": "1483985988355-763728e1935b", // ruffle street
  "w-dress-10": "1529139574466-a303027c1d8b", // smocked daytime

  // Women tops
  "w-top-1": "1613752978317-afcfd1bba65a", // white crop / fitted
  "w-top-2": "1487222477894-8943e31ef7b2", // black tee
  "w-top-3": "1488426862026-3ee34a7d66df", // square-neck
  "w-top-4": "1768803968246-5b8c7d04b722", // peplum / floral top
  "w-top-5": "1759840278471-462cf3fcebd3", // satin cami
  "w-top-6": "1768803968262-320d4752966f", // puff sleeve
  "w-top-7": "1610030469668-8e9f641aaf27", // linen shirt
  "w-top-8": "1494790108377-be9c29b29330", // wrap
  "w-top-9": "1529626455594-4ff0802cfb7e", // ruched party
  "w-top-10": "1487412720507-e7ab37603c6f", // everyday cotton

  // Women jeans — 10 distinct denim shots
  "w-jean-1": "1584370848010-d7fe6bc767ec",
  "w-jean-2": "1548376653-3d2a13053ad0",
  "w-jean-3": "1607647735186-f3c200aa175a",
  "w-jean-4": "1506629082955-511b1aa562c8",
  "w-jean-5": "1559334417-a57bd929f003",
  "w-jean-6": "1603217192634-61068e4d4bf9",
  "w-jean-7": "1473968512647-3e447244af8f",
  "w-jean-8": "1542272604-787c3835535d",
  "w-jean-9": "1614446213011-55a93c1311f5",
  "w-jean-10": "1659167099846-a0dbfc52aa2d",

  // Women sneakers
  "w-sneaker-1": "1603808033192-082d6919d3e1",
  "w-sneaker-2": "1578906726098-325c6f33f10a",
  "w-sneaker-3": "1460353581641-37baddab0fa2",
  "w-sneaker-4": "1549298916-b41d501d3772",
  "w-sneaker-5": "1595950653106-6c9ebd614d3a",
  "w-sneaker-6": "1560769629-975ec94e6a86",
  "w-sneaker-7": "1552346154-21d32810aba3",
  "w-sneaker-8": "1534217466718-ef4950786e24",
  "w-sneaker-9": "1555447405-057915b40299",
  "w-sneaker-10": "1681717055630-c62333c22fec",

  // Women heels
  "w-heel-1": "1615555896813-401d84a0d737",
  "w-heel-2": "1543163521-1bf539c55dd2",
  "w-heel-3": "1617627143750-d86bc21e42bb",
  "w-heel-4": "1717835735088-4c821959bdaa",
  "w-heel-5": "1756483492198-8ca91227489b",
  "w-heel-6": "1756483510859-c0ab4c45782c",
  "w-heel-7": "1621184455862-c163dfb30e0f",
  "w-heel-8": "1774438462884-4961ce3e1683",
  "w-heel-9": "1770359993283-a2c2f386584e",
  "w-heel-10": "1729347917808-e3e35a462fec",

  "w-bag-1": "1584917865442-de89df76afd3",
  "w-bag-2": "1590874103328-eac38a683ce7",
  "w-ear-1": "1599643478518-a784e5dc4c8f",
  "w-lounge-1": "1779675790085-130e363145bb",

  // Men
  "m-shirt-1": "1596755094514-f87e34085b2c",
  "m-shirt-2": "1602810318383-e386cc2a3ccf",
  "m-shirt-3": "1560250097-0b93528c311a",
  "m-tee-1": "1521572163474-6864f9cf17ab",
  "m-tee-2": "1576566588028-4147f3842f27",
  "m-jean-1": "1624378439575-d8705ad7ae80",
  "m-jean-2": "1548883354-7622d03aca27",
  "m-jacket-1": "1552374196-1ab2a1c593e8",
  "m-ethnic-1": "1762708549049-dfa077476d31",
  "m-ethnic-2": "1760080838961-4208536db385",
  "m-shoe-1": "1542291026-7eec264c27ff",
  "m-shoe-2": "1490578474895-699cd4e2cf59",
  "m-shoe-3": "1527016021513-b09758b777bd",
  "m-trouser-1": "1519085360753-af0119f7cbe7",
  "m-sandal-1": "1603100280072-4b1f1c878f6f",
  "m-watch-1": "1524805444758-089113d48a6d",
  "m-belt-1": "1565251419287-9097aa7299ec",

  // Kids
  "k-set-1": "1622218286192-95f6a20083c7",
  "k-set-2": "1622290291468-a28f7a7dc6a8",
  "k-ethnic-1": "1741992556912-3b2d62461e75",
  "k-lehenga-1": "1560506840-ec148e82a604",
  "k-dress-1": "1611708314849-8bb91fe0fa56",
  "k-shoe-1": "1514989940723-e8e51635b782",
  "k-shoe-2": "1519238263530-99bdd11df2ea",

  // Home & beauty (keep catalog IDs, still unique vs apparel)
  "h-bed-1": "1542728929-2b5d9a0c8d48",
  "h-bed-2": "1633865082308-b858e086c1f6",
  "h-cushion-1": "1555041469-a586c61ea9bc",
  "h-lamp-1": "1507473885765-e6ed057f782c",
  "h-dinner-1": "1694830470405-55b9f605085f",
  "h-pan-1": "1556911220-bff31c812dba",
  "h-towel-1": "1584622650111-993a426fbf0a",
  "b-lip-1": "1586495777744-4413f21062fa",
  "b-found-1": "1522335789203-aabd1fc54bc9",
  "b-serum-1": "1612817288484-6f916006741a",
  "b-cream-1": "1620916566398-39f1143ab7be",
  "b-shampoo-1": "1638131163592-f91c859ac4fa",
  "b-perfume-1": "1541643600914-78b084683601"
};

const FALLBACK: Record<Dept, string> = {
  women: "1483985988355-763728e1935b",
  men: "1596755094514-f87e34085b2c",
  kids: "1519238263530-99bdd11df2ea",
  home: "1616486338812-3dadae4b4ace",
  beauty: "1596462502278-27bfdc403348"
};

export function img(id: string, w = 800): string {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;
}

export function shots(productId: string): { image: string; images: string[] } | null {
  const photoId = PHOTO[productId];
  if (!photoId) return null;
  const image = img(photoId);
  return { image, images: [image] };
}

export function fallbackImage(gender: Dept): string {
  return img(FALLBACK[gender]);
}

/** Used by tests to catch recycled photos. */
export function primaryPhotoId(productId: string): string | undefined {
  return PHOTO[productId];
}

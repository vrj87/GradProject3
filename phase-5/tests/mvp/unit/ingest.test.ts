import { describe, expect, it } from "vitest";
import { CATALOG } from "@/lib/catalog";
import { IngestError, assertAllowedUrl, ingestProduct, parseProductHtml } from "@/lib/product-ingest";

const PAGE = `<!doctype html>
<html>
<head>
  <title>Libas Women Floral Kurta Set</title>
  <script type="application/ld+json">
    {"@type":"Product","name":"Libas Floral Kurta Set","brand":{"@type":"Brand","name":"Libas"},"image":"https://assets.myntassets.com/demo.jpg","offers":{"@type":"Offer","price":"2499","priceCurrency":"INR"}}
  </script>
</head>
<body></body>
</html>`;

describe("SSRF allowlist", () => {
  it("accepts an https Myntra product URL", () => {
    const url = assertAllowedUrl("https://www.myntra.com/kurta-sets/libas/libas-floral/12345/buy");
    expect(url.hostname).toBe("www.myntra.com");
  });

  it.each([
    ["http://www.myntra.com/x", "https"],
    ["https://evil.example/steal", "myntra.com"],
    ["https://127.0.0.1/admin", "Private"],
    ["https://192.168.1.10/internal", "Private"],
    ["https://localhost/steal", "Private"],
    ["not-a-url", "valid URL"]
  ])("rejects %s", (raw, fragment) => {
    expect(() => assertAllowedUrl(raw)).toThrow(IngestError);
    try {
      assertAllowedUrl(raw);
    } catch (error) {
      expect((error as Error).message).toMatch(new RegExp(fragment, "i"));
    }
  });
});

describe("tier 1 HTML parse", () => {
  it("reads JSON-LD into a ProductRecord", () => {
    const product = parseProductHtml(
      PAGE,
      "https://www.myntra.com/kurta-sets/libas/libas-floral/12345/buy"
    );
    expect(product).not.toBeNull();
    expect(product!.name).toBe("Libas Floral Kurta Set");
    expect(product!.brand).toBe("Libas");
    expect(product!.priceInr).toBe(2499);
    expect(product!.category).toBe("ethnic");
    expect(product!.reviews).toEqual([]);
  });

  it("returns null when the page has no price", () => {
    expect(
      parseProductHtml(
        "<title>Empty</title>",
        "https://www.myntra.com/kurta-sets/x/y/1/buy"
      )
    ).toBeNull();
  });
});

describe("ingest ladder", () => {
  it("serves the demo catalog by id without touching the network", async () => {
    const result = await ingestProduct({ catalogId: "p-kurta-anarkali" });
    expect(result.tier).toBe("demo-catalog");
    expect(result.product.id).toBe("p-kurta-anarkali");
    expect(result.product.reviews.length).toBeGreaterThan(2);
    expect(result.needsEnrichment).toBe(false);
  });

  it("rejects an unknown catalog id with 404", async () => {
    await expect(ingestProduct({ catalogId: "p-does-not-exist" })).rejects.toMatchObject({
      status: 404
    });
  });

  it("falls back to the catalog when a allowed URL cannot be fetched", async () => {
    const result = await ingestProduct(
      { url: "https://www.myntra.com/kurtas/libas/blocked/1/buy" },
      {
        fetchImpl: async () => {
          throw new Error("blocked");
        }
      }
    );
    expect(result.tier).toBe("demo-catalog");
    expect(CATALOG.some((item) => item.id === result.product.id)).toBe(true);
    expect(result.needsEnrichment).toBe(true);
    expect(result.note).toMatch(/Could not read/);
  });

  it("parses a successful public page as tier 1", async () => {
    const result = await ingestProduct(
      { url: "https://www.myntra.com/kurta-sets/libas/libas-floral/12345/buy" },
      {
        fetchImpl: async () =>
          new Response(PAGE, { status: 200, headers: { "content-type": "text/html" } })
      }
    );
    expect(result.tier).toBe("url-parse");
    expect(result.product.priceInr).toBe(2499);
    expect(result.needsEnrichment).toBe(true);
  });
});

describe("demo catalog", () => {
  it("has 12–20 SKUs covering the four categories 5b asks for", () => {
    expect(CATALOG.length).toBeGreaterThanOrEqual(12);
    expect(CATALOG.length).toBeLessThanOrEqual(20);
    const categories = new Set(CATALOG.map((item) => item.category));
    expect(categories).toEqual(new Set(["ethnic", "western", "footwear", "accessories"]));
    expect(CATALOG.every((item) => item.imageUrl)).toBe(true);
    expect(new Set(CATALOG.map((item) => item.imageUrl)).size).toBe(CATALOG.length);
  });
});

export function Footer() {
  return (
    <footer className="bg-myntra-bg mt-16 text-sm text-myntra-muted">
      <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 px-6 py-12">
        <div>
          <h4 className="font-bold text-myntra-dark mb-3">ONLINE SHOPPING</h4>
          <p>Men</p>
          <p>Women</p>
          <p>Kids</p>
          <p>Home & Living</p>
          <p>Beauty</p>
        </div>
        <div>
          <h4 className="font-bold text-myntra-dark mb-3">CUSTOMER POLICIES</h4>
          <p>Contact Us</p>
          <p>FAQ</p>
          <p>T&C</p>
          <p>Returns</p>
        </div>
        <div>
          <h4 className="font-bold text-myntra-dark mb-3">EXPERIENCE MYNTRA APP</h4>
          <p>Get it on Google Play and the App Store.</p>
        </div>
        <div>
          <h4 className="font-bold text-myntra-dark mb-3">KEEP IN TOUCH</h4>
          <p>Demo storefront for the W2P 30d discovery project. Not affiliated checkout.</p>
        </div>
      </div>
      <div className="border-t border-myntra-border text-center py-4 text-xs">
        © 2026 Myntra demo · 100% ORIGINAL · Easy 14 day returns
      </div>
    </footer>
  );
}

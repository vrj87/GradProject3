export function Profile() {
  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-xl font-bold mb-4">Profile</h1>
      <div className="border border-myntra-border p-5 space-y-3 text-sm">
        <p>
          <b>Demo shopper</b> · Priya
        </p>
        <p>Orders: 6 in the last year</p>
        <p>Myntra Insider: Insider</p>
        <p className="text-myntra-muted">
          Login, OTP, and payments are not part of this demo. Use Wishlist and Bag to try the
          shopping flow.
        </p>
      </div>
    </div>
  );
}

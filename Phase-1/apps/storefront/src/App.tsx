import { Navigate, Route, Routes } from "react-router-dom";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { MobileBottomNav } from "./components/MobileBottomNav";
import { Bag } from "./pages/Bag";
import { Home } from "./pages/Home";
import { Orders } from "./pages/Orders";
import { ProductPage } from "./pages/Product";
import { Profile } from "./pages/Profile";
import { Shop } from "./pages/Shop";
import { Studio } from "./pages/Studio";
import { Wishlist } from "./pages/Wishlist";

export function App() {
  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-white pb-nav">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop/:gender" element={<Shop />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/bag" element={<Bag />} />
          <Route path="/studio" element={<Studio />} />
          <Route path="/discovery" element={<Navigate to="/studio" replace />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

import { Navigate, Route, Routes } from "react-router-dom";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { StoreTabs } from "./components/StoreTabs";
import { Bag } from "./pages/Bag";
import { Home } from "./pages/Home";
import { ProductPage } from "./pages/Product";
import { Profile } from "./pages/Profile";
import { Shop } from "./pages/Shop";
import { Wishlist } from "./pages/Wishlist";

export function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <StoreTabs />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop/:gender" element={<Shop />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/bag" element={<Bag />} />
          <Route path="/discovery" element={<Navigate to="/?tab=insights" replace />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

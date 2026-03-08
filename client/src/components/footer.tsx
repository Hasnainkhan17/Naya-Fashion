import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg font-bold tracking-tight">NAYA</span>
              <span className="text-lg font-light tracking-widest text-muted-foreground">
                FASHION
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your destination for premium men's and women's fashion and accessories. 
              Curated collections, timeless style.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Shop</h4>
            <div className="space-y-2">
              <Link href="/products?category=mens" className="block text-sm text-muted-foreground" data-testid="link-footer-mens">Men's Clothing</Link>
              <Link href="/products?category=womens" className="block text-sm text-muted-foreground" data-testid="link-footer-womens">Women's Clothing</Link>
              <Link href="/products?category=bags" className="block text-sm text-muted-foreground" data-testid="link-footer-bags">Bags</Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Support</h4>
            <div className="space-y-2">
              <Link href="/track-order" className="block text-sm text-muted-foreground" data-testid="link-footer-track">Track Order</Link>
              <span className="block text-sm text-muted-foreground">Shipping Info</span>
              <span className="block text-sm text-muted-foreground">Returns</span>
              <span className="block text-sm text-muted-foreground">FAQ</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Contact</h4>
            <div className="space-y-2">
              <span className="block text-sm text-muted-foreground">support@nayafashion.com</span>
              <span className="block text-sm text-muted-foreground">+92 300 1234567</span>
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-6">
          <p className="text-xs text-muted-foreground text-center">
            2026 Naya Fashion. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

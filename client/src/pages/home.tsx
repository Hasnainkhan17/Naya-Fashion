import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, Truck, RotateCcw, Shield } from "lucide-react";
import type { Product, Category } from "@shared/schema";

export default function Home() {
  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const featuredProducts = products?.slice(0, 6) || [];

  return (
    <div className="min-h-screen">
      <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/hero-banner.png"
            alt="Naya Fashion"
            className="w-full h-full object-cover"
            data-testid="img-hero"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="max-w-lg">
            <p className="text-white/80 text-sm font-medium tracking-widest uppercase mb-3">
              New Collection 2026
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
              Discover Your
              <br />
              <span className="text-primary-foreground/90">Signature Style</span>
            </h1>
            <p className="text-white/70 text-base md:text-lg mb-6 leading-relaxed">
              Explore our curated collection of premium fashion for men, women, and accessories. 
              Timeless pieces for every occasion.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products">
                <Button size="lg" data-testid="button-shop-now">
                  Shop Now
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/products?category=womens">
                <Button size="lg" variant="outline" className="backdrop-blur-sm bg-white/10 text-white border-white/20" data-testid="button-new-arrivals">
                  New Arrivals
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center gap-4" data-testid="feature-shipping">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Truck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Free Shipping</h3>
                <p className="text-xs text-muted-foreground">On orders over PKR 10,000</p>
              </div>
            </div>
            <div className="flex items-center gap-4" data-testid="feature-returns">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <RotateCcw className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Easy Returns</h3>
                <p className="text-xs text-muted-foreground">30-day return policy</p>
              </div>
            </div>
            <div className="flex items-center gap-4" data-testid="feature-secure">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-medium text-sm">Secure Checkout</h3>
                <p className="text-xs text-muted-foreground">SSL encrypted payment</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {categories && categories.length > 0 && (
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-bold mb-2">Shop by Category</h2>
              <p className="text-muted-foreground text-sm">Find exactly what you're looking for</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {categories.map((cat) => {
                const catProducts = products?.filter((p) => p.categoryId === cat.id) || [];
                const coverImage = catProducts[0]?.image;
                return (
                  <Link
                    key={cat.id}
                    href={`/products?category=${cat.slug}`}
                    data-testid={`link-category-${cat.slug}`}
                  >
                    <div className="group relative h-64 rounded-md overflow-hidden cursor-pointer hover-elevate">
                      {coverImage && (
                        <img
                          src={coverImage}
                          alt={cat.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="text-white font-semibold text-lg">{cat.name}</h3>
                        <p className="text-white/70 text-sm mt-1">
                          {catProducts.length} items
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 mb-10">
            <div>
              <h2 className="text-2xl font-bold mb-1">Featured Products</h2>
              <p className="text-muted-foreground text-sm">Handpicked favorites from our collection</p>
            </div>
            <Link href="/products">
              <Button variant="outline" data-testid="button-view-all">
                View All
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-[3/4] w-full rounded-md" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Stay in Style</h2>
          <p className="text-primary-foreground/70 max-w-md mx-auto mb-6 text-sm">
            Join our community and be the first to know about new arrivals, exclusive deals, and fashion tips.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-2.5 rounded-md bg-white/10 border border-white/20 text-white placeholder:text-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-white/30"
              data-testid="input-newsletter-email"
            />
            <Button variant="secondary" data-testid="button-subscribe">
              Subscribe
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

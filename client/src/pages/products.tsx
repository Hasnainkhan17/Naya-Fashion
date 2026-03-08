import { useQuery } from "@tanstack/react-query";
import { useLocation, useSearch } from "wouter";
import { ProductCard } from "@/components/product-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal } from "lucide-react";
import { useState, useMemo } from "react";
import type { Product, Category } from "@shared/schema";

export default function Products() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const categorySlug = params.get("category");
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"default" | "price-asc" | "price-desc">("default");

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const activeCategory = categories?.find((c) => c.slug === categorySlug);

  const filteredProducts = useMemo(() => {
    let result = products || [];

    if (activeCategory) {
      result = result.filter((p) => p.categoryId === activeCategory.id);
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
      );
    }

    if (sortBy === "price-asc") {
      result = [...result].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-desc") {
      result = [...result].sort((a, b) => Number(b.price) - Number(a.price));
    }

    return result;
  }, [products, activeCategory, searchQuery, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-1" data-testid="text-page-title">
          {activeCategory ? activeCategory.name : "All Products"}
        </h1>
        <p className="text-muted-foreground text-sm" data-testid="text-results-count">
          {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 h-9 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            data-testid="input-search"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={!categorySlug ? "default" : "outline"}
            onClick={() => setLocation("/products")}
            data-testid="button-filter-all"
          >
            All
          </Button>
          {categories?.map((cat) => (
            <Button
              key={cat.id}
              size="sm"
              variant={categorySlug === cat.slug ? "default" : "outline"}
              onClick={() => setLocation(`/products?category=${cat.slug}`)}
              data-testid={`button-filter-${cat.slug}`}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant={sortBy === "price-asc" ? "default" : "outline"}
            onClick={() => setSortBy(sortBy === "price-asc" ? "default" : "price-asc")}
            data-testid="button-sort-price-asc"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
            Low to High
          </Button>
          <Button
            size="sm"
            variant={sortBy === "price-desc" ? "default" : "outline"}
            onClick={() => setSortBy(sortBy === "price-desc" ? "default" : "price-desc")}
            data-testid="button-sort-price-desc"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
            High to Low
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[3/4] w-full rounded-md" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
            <Search className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-1" data-testid="text-no-results">No products found</h3>
          <p className="text-muted-foreground text-sm">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

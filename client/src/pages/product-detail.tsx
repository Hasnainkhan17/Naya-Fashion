import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingBag, ArrowLeft, Minus, Plus, Package, Truck } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Product, Category } from "@shared/schema";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["/api/products", id],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const category = categories?.find((c) => c.id === product?.categoryId);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <Skeleton className="aspect-[3/4] w-full rounded-md" />
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-40" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-xl font-bold mb-2">Product not found</h2>
        <Link href="/products">
          <Button variant="outline" data-testid="button-back-to-shop">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shop
          </Button>
        </Link>
      </div>
    );
  }

  const outOfStock = product.stock <= 0;

  const handleAddToCart = () => {
    if (outOfStock) return;
    addToCart(product, quantity);
    toast({
      title: "Added to cart",
      description: `${quantity}x ${product.name} added to your cart.`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/products" className="inline-flex items-center text-sm text-muted-foreground mb-6" data-testid="link-back">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Shop
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="relative aspect-[3/4] bg-muted/30 rounded-md overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
            data-testid="img-product-detail"
          />
        </div>

        <div className="flex flex-col">
          {category && (
            <Link href={`/products?category=${category.slug}`}>
              <Badge variant="secondary" className="mb-3 w-fit" data-testid="badge-category">
                {category.name}
              </Badge>
            </Link>
          )}

          <h1 className="text-2xl md:text-3xl font-bold mb-2" data-testid="text-product-name">
            {product.name}
          </h1>

          <div className="text-3xl font-bold text-foreground mb-4" data-testid="text-product-price">
            PKR {Number(product.price).toLocaleString()}
          </div>

          <p className="text-muted-foreground leading-relaxed mb-6" data-testid="text-product-description">
            {product.description}
          </p>

          <div className="flex items-center gap-2 mb-4">
            <Package className="h-4 w-4 text-muted-foreground" />
            {outOfStock ? (
              <span className="text-sm text-destructive font-medium" data-testid="text-stock-status">
                Out of Stock
              </span>
            ) : (
              <span className="text-sm text-muted-foreground" data-testid="text-stock-status">
                {product.stock} in stock
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex items-center border border-border rounded-md">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={outOfStock}
                data-testid="button-decrease-qty"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center text-sm font-medium" data-testid="text-quantity">
                {quantity}
              </span>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={outOfStock}
                data-testid="button-increase-qty"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <Button
              size="lg"
              disabled={outOfStock}
              onClick={handleAddToCart}
              className="flex-1"
              data-testid="button-add-to-cart"
            >
              <ShoppingBag className="mr-2 h-4 w-4" />
              {outOfStock ? "Out of Stock" : "Add to Cart"}
            </Button>
          </div>

          <div className="border-t border-border pt-6 mt-auto space-y-3">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Truck className="h-4 w-4" />
              <span>Free shipping on orders over PKR 10,000</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

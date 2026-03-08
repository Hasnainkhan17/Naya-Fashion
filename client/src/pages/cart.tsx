import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ShoppingBag, Minus, Plus, Trash2, ArrowLeft, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart";

export default function Cart() {
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();

  const shipping = totalPrice >= 10000 ? 0 : 500;

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold mb-2" data-testid="text-empty-cart">Your cart is empty</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Looks like you haven't added anything yet.
        </p>
        <Link href="/products">
          <Button data-testid="button-continue-shopping">
            Continue Shopping
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/products" className="text-muted-foreground" data-testid="link-back-to-shop">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-cart-title">Shopping Cart</h1>
          <p className="text-sm text-muted-foreground">{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <Card key={item.product.id} className="border-card-border" data-testid={`cart-item-${item.product.id}`}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <Link href={`/products/${item.product.id}`} className="flex-shrink-0">
                    <div className="w-24 h-32 rounded-md overflow-hidden bg-muted/30">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        data-testid={`img-cart-item-${item.product.id}`}
                      />
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <Link href={`/products/${item.product.id}`}>
                      <h3 className="font-medium text-sm line-clamp-1" data-testid={`text-cart-item-name-${item.product.id}`}>
                        {item.product.name}
                      </h3>
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1" data-testid={`text-cart-item-price-${item.product.id}`}>
                      PKR {Number(item.product.price).toLocaleString()} each
                    </p>

                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center border border-border rounded-md">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          data-testid={`button-decrease-${item.product.id}`}
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="w-10 text-center text-sm" data-testid={`text-qty-${item.product.id}`}>
                          {item.quantity}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          data-testid={`button-increase-${item.product.id}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-sm" data-testid={`text-cart-item-total-${item.product.id}`}>
                          PKR {(Number(item.product.price) * item.quantity).toLocaleString()}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeFromCart(item.product.id)}
                          data-testid={`button-remove-${item.product.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div>
          <Card className="border-card-border sticky top-24">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4" data-testid="text-order-summary">Order Summary</h3>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span data-testid="text-subtotal">PKR {totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Shipping</span>
                  <span data-testid="text-shipping">{shipping === 0 ? "Free" : `PKR ${shipping.toLocaleString()}`}</span>
                </div>
                <Separator />
                <div className="flex justify-between gap-2 font-semibold text-base">
                  <span>Total</span>
                  <span data-testid="text-total">
                    PKR {(totalPrice + shipping).toLocaleString()}
                  </span>
                </div>
              </div>

              <Link href="/checkout" className="block mt-6">
                <Button className="w-full" size="lg" data-testid="button-checkout">
                  Proceed to Checkout
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

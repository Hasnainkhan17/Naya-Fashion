import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Search, Package, Truck, CheckCircle, Clock, MapPin,
  Loader2, ArrowLeft, Phone, Mail, Banknote, CreditCard,
} from "lucide-react";
import { Link } from "wouter";

interface OrderItem {
  id: number;
  productName: string;
  productImage: string;
  quantity: number;
  price: string;
}

interface TrackedOrder {
  id: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  shippingCity: string;
  totalPrice: string;
  paymentMethod: string;
  paymentStatus: string;
  status: string;
  trackingCode: string | null;
  orderDate: string;
  items: OrderItem[];
}

const statusSteps = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: MapPin },
];

function getStatusIndex(status: string): number {
  if (status === "cancelled") return -1;
  return statusSteps.findIndex((s) => s.key === status);
}

export default function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId || !email) {
      setError("Please enter both order ID and email.");
      return;
    }

    setLoading(true);
    setError("");
    setOrder(null);

    try {
      const response = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: Number(orderId), email }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.message || "Order not found.");
        return;
      }

      const data = await response.json();
      setOrder(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const currentStatusIndex = order ? getStatusIndex(order.status) : -1;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/" className="inline-flex items-center text-sm text-muted-foreground mb-6" data-testid="link-back-home">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Home
      </Link>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold mb-2" data-testid="text-track-title">Track Your Order</h1>
        <p className="text-muted-foreground text-sm">Enter your order ID and email to check the status</p>
      </div>

      <Card className="border-card-border mb-8">
        <CardContent className="p-6">
          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="orderId">Order ID</Label>
              <Input
                id="orderId"
                type="number"
                placeholder="e.g. 1001"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                required
                data-testid="input-track-order-id"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="trackEmail">Email Address</Label>
              <Input
                id="trackEmail"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-track-email"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" disabled={loading} className="w-full sm:w-auto" data-testid="button-track-submit">
                {loading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Tracking...</>
                ) : (
                  <><Search className="mr-2 h-4 w-4" />Track Order</>
                )}
              </Button>
            </div>
          </form>

          {error && (
            <div className="mt-4 p-3 rounded-md bg-destructive/10 text-destructive text-sm" data-testid="text-track-error">
              {error}
            </div>
          )}
        </CardContent>
      </Card>

      {order && (
        <div className="space-y-6" data-testid="section-order-details">
          <Card className="border-card-border">
            <CardContent className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold" data-testid="text-order-number">Order #{order.id}</h2>
                  <p className="text-sm text-muted-foreground">
                    Placed on {new Date(order.orderDate).toLocaleDateString("en-PK", {
                      year: "numeric", month: "long", day: "numeric"
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge
                    variant={order.status === "cancelled" ? "destructive" : order.status === "delivered" ? "default" : "secondary"}
                    className="capitalize"
                    data-testid="badge-order-status"
                  >
                    {order.status}
                  </Badge>
                  <Badge
                    variant={order.paymentStatus === "paid" ? "default" : "secondary"}
                    data-testid="badge-payment-status"
                  >
                    {order.paymentStatus === "paid" ? "Paid" : "Payment Pending"}
                  </Badge>
                </div>
              </div>

              {order.status !== "cancelled" && (
                <div className="mb-6">
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-5 left-0 right-0 h-0.5 bg-border" />
                    <div
                      className="absolute top-5 left-0 h-0.5 bg-primary transition-all duration-500"
                      style={{
                        width: currentStatusIndex >= 0
                          ? `${(currentStatusIndex / (statusSteps.length - 1)) * 100}%`
                          : "0%"
                      }}
                    />
                    {statusSteps.map((step, index) => {
                      const isCompleted = index <= currentStatusIndex;
                      const isCurrent = index === currentStatusIndex;
                      const StepIcon = step.icon;
                      return (
                        <div key={step.key} className="relative flex flex-col items-center z-10" data-testid={`step-${step.key}`}>
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                            isCompleted
                              ? "bg-primary border-primary text-primary-foreground"
                              : "bg-background border-border text-muted-foreground"
                          } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}>
                            <StepIcon className="h-4 w-4" />
                          </div>
                          <span className={`text-xs mt-2 text-center hidden sm:block ${
                            isCompleted ? "text-foreground font-medium" : "text-muted-foreground"
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {order.trackingCode && (
                <div className="p-3 rounded-md bg-muted/30 border border-border mb-6">
                  <p className="text-xs text-muted-foreground mb-1">Tracking Code</p>
                  <p className="font-mono font-medium text-sm" data-testid="text-tracking-code">{order.trackingCode}</p>
                </div>
              )}

              <Separator className="my-6" />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Customer Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span data-testid="text-customer-email">{order.customerEmail}</span>
                    </div>
                    {order.customerPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span data-testid="text-customer-phone">{order.customerPhone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span data-testid="text-shipping-address">
                        {order.shippingAddress}{order.shippingCity ? `, ${order.shippingCity}` : ""}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-sm">Payment</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      {order.paymentMethod === "cod" ? (
                        <Banknote className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span data-testid="text-payment-method">
                        {order.paymentMethod === "cod" ? "Cash on Delivery" : order.paymentMethod === "card" ? "Card Payment" : "Online Payment"}
                      </span>
                    </div>
                    <p className="text-lg font-bold" data-testid="text-order-total">
                      PKR {Number(order.totalPrice).toLocaleString()}
                    </p>
                    {(order as any).transactionId && (
                      <p className="text-xs font-mono text-muted-foreground mt-1" data-testid="text-transaction-id">
                        TXN: {(order as any).transactionId}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-card-border">
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Order Items</h3>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex gap-4" data-testid={`track-item-${item.id}`}>
                    {item.productImage && (
                      <div className="w-16 h-20 rounded-md overflow-hidden bg-muted/30 flex-shrink-0">
                        <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{item.productName}</p>
                      <p className="text-xs text-muted-foreground mt-1">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium text-sm whitespace-nowrap">
                      PKR {(Number(item.price) * item.quantity).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

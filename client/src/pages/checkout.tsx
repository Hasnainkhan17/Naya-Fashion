import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, CheckCircle, Loader2, Banknote, CreditCard, Copy, Check, Smartphone, Lock, ShieldCheck, XCircle, AlertCircle } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length > 2) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

function detectCardType(num: string): string {
  const d = num.replace(/\D/g, "");
  if (/^4/.test(d)) return "Visa";
  if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return "Mastercard";
  if (/^3[47]/.test(d)) return "Amex";
  if (/^6(?:011|5)/.test(d)) return "Discover";
  if (/^(?:2131|1800|35)/.test(d)) return "JCB";
  return "";
}

type PaymentStep = "form" | "processing" | "success" | "failed";

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "card" | "online">("cod");
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const [showCardGateway, setShowCardGateway] = useState(false);
  const [paymentStep, setPaymentStep] = useState<PaymentStep>("form");
  const [paymentError, setPaymentError] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [cardType, setCardType] = useState("");
  const [lastFour, setLastFour] = useState("");
  const [processingStage, setProcessingStage] = useState(0);

  const [cardForm, setCardForm] = useState({
    number: "",
    name: "",
    expiry: "",
    cvv: "",
  });

  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    address: "",
    city: "",
    zipCode: "",
  });

  const shipping = totalPrice >= 10000 ? 0 : 500;
  const total = totalPrice + shipping;

  const detectedCardType = detectCardType(cardForm.number);

  useEffect(() => {
    if (paymentStep === "processing") {
      const stages = [
        { delay: 800, stage: 1 },
        { delay: 1800, stage: 2 },
        { delay: 2800, stage: 3 },
      ];
      const timers = stages.map(({ delay, stage }) =>
        setTimeout(() => setProcessingStage(stage), delay)
      );
      return () => timers.forEach(clearTimeout);
    } else {
      setProcessingStage(0);
    }
  }, [paymentStep]);

  if (items.length === 0 && !orderPlaced) {
    setLocation("/cart");
    return null;
  }

  const handleCopyAccount = () => {
    navigator.clipboard.writeText("NF-2026-8847-0032");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (orderPlaced) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2" data-testid="text-order-success">Order Placed Successfully!</h2>
        <p className="text-muted-foreground mb-1">
          Thank you for your purchase.
        </p>
        <p className="text-sm text-muted-foreground mb-2" data-testid="text-order-id">
          Order #{orderId}
        </p>
        {transactionId && (
          <p className="text-xs text-muted-foreground mb-1 font-mono" data-testid="text-transaction-id">
            Transaction: {transactionId}
          </p>
        )}
        <p className="text-sm text-muted-foreground mb-6" data-testid="text-payment-confirmation">
          {paymentMethod === "cod"
            ? "You will pay when your order is delivered."
            : paymentMethod === "card"
            ? `Payment of PKR ${total.toLocaleString()} approved. Your order is confirmed!`
            : "Your payment is being verified. We'll confirm within 24 hours."}
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/products">
            <Button data-testid="button-continue-shopping">Continue Shopping</Button>
          </Link>
          <Link href="/track-order">
            <Button variant="outline" data-testid="button-track-order">Track Your Order</Button>
          </Link>
        </div>
      </div>
    );
  }

  const validateBasicFields = (): boolean => {
    if (!form.customerName || !form.customerEmail || !form.customerPhone) {
      toast({ title: "Please fill in all required fields", variant: "destructive" });
      return false;
    }
    if (!form.address || !form.city) {
      toast({ title: "Please fill in your shipping address", variant: "destructive" });
      return false;
    }
    return true;
  };

  const validateCard = (): boolean => {
    const digits = cardForm.number.replace(/\s/g, "");
    if (digits.length < 13) {
      setPaymentError("Please enter a valid card number.");
      return false;
    }
    if (!cardForm.name.trim()) {
      setPaymentError("Please enter the cardholder name.");
      return false;
    }
    const expiryParts = cardForm.expiry.split("/");
    if (expiryParts.length !== 2 || expiryParts[0].length !== 2 || expiryParts[1].length !== 2) {
      setPaymentError("Please enter a valid expiry date (MM/YY).");
      return false;
    }
    const month = parseInt(expiryParts[0]);
    if (month < 1 || month > 12) {
      setPaymentError("Invalid expiry month.");
      return false;
    }
    if (cardForm.cvv.length < 3) {
      setPaymentError("Please enter a valid CVV.");
      return false;
    }
    return true;
  };

  const processCardPayment = async () => {
    setPaymentError("");
    if (!validateCard()) return;

    setPaymentStep("processing");

    const expiryParts = cardForm.expiry.split("/");

    try {
      const response = await apiRequest("POST", "/api/payments/process", {
        cardNumber: cardForm.number.replace(/\s/g, ""),
        cardName: cardForm.name,
        expiryMonth: expiryParts[0],
        expiryYear: expiryParts[1],
        cvv: cardForm.cvv,
        amount: total,
      });

      const result = await response.json();

      if (result.success) {
        setTransactionId(result.transactionId);
        setCardType(result.cardType);
        setLastFour(result.lastFour);

        await new Promise((r) => setTimeout(r, 3200));
        setPaymentStep("success");

        await new Promise((r) => setTimeout(r, 1500));

        setIsSubmitting(true);
        const orderResponse = await apiRequest("POST", "/api/orders", {
          customerName: form.customerName,
          customerEmail: form.customerEmail,
          customerPhone: form.customerPhone,
          shippingAddress: form.address,
          shippingCity: form.city,
          shippingZip: form.zipCode,
          totalPrice: total.toFixed(2),
          paymentMethod: "card",
          status: "pending",
          transactionId: result.transactionId,
          items: items.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: item.product.price,
          })),
        });
        const order = await orderResponse.json();
        setOrderId(order.id);
        clearCart();
        setShowCardGateway(false);
        setOrderPlaced(true);
      }
    } catch (error: any) {
      let errorMsg = "Payment declined. Please check your card details and try again.";
      try {
        const errData = await error?.json?.();
        if (errData?.message) errorMsg = errData.message;
      } catch {}
      setPaymentError(errorMsg);
      setPaymentStep("failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBasicFields()) return;

    if (paymentMethod === "card") {
      setPaymentStep("form");
      setPaymentError("");
      setShowCardGateway(true);
      return;
    }

    if (paymentMethod === "online") {
      setShowPaymentModal(true);
      return;
    }

    await placeOrder();
  };

  const placeOrder = async () => {
    setIsSubmitting(true);
    setShowPaymentModal(false);
    try {
      const response = await apiRequest("POST", "/api/orders", {
        customerName: form.customerName,
        customerEmail: form.customerEmail,
        customerPhone: form.customerPhone,
        shippingAddress: form.address,
        shippingCity: form.city,
        shippingZip: form.zipCode,
        totalPrice: total.toFixed(2),
        paymentMethod,
        status: "pending",
        items: items.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
      });
      const order = await response.json();
      setOrderId(order.id);
      clearCart();
      setOrderPlaced(true);
    } catch (error) {
      toast({ title: "Failed to place order", description: "Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showCardGateway) {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4" data-testid="gateway-overlay">
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Lock className="h-5 w-5 text-emerald-400" />
            <span className="text-white font-semibold text-lg">Naya Fashion Secure Pay</span>
          </div>

          {paymentStep === "form" && (
            <Card className="border-0 shadow-2xl" data-testid="section-card-form">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-lg">Payment Details</h3>
                    <p className="text-sm text-muted-foreground">Enter your card information</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-bold text-lg text-primary">PKR {total.toLocaleString()}</p>
                  </div>
                </div>

                {paymentError && (
                  <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-start gap-2" data-testid="text-payment-error">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-destructive">{paymentError}</p>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card Number</Label>
                    <div className="relative">
                      <Input
                        id="cardNumber"
                        placeholder="1234 5678 9012 3456"
                        value={cardForm.number}
                        onChange={(e) => setCardForm({ ...cardForm, number: formatCardNumber(e.target.value) })}
                        maxLength={19}
                        className="pr-20 font-mono text-base tracking-wider"
                        data-testid="input-card-number"
                      />
                      {detectedCardType && (
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded" data-testid="text-card-type">
                          {detectedCardType}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardName">Cardholder Name</Label>
                    <Input
                      id="cardName"
                      placeholder="JOHN DOE"
                      value={cardForm.name}
                      onChange={(e) => setCardForm({ ...cardForm, name: e.target.value.toUpperCase() })}
                      className="uppercase tracking-wide"
                      data-testid="input-card-name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cardExpiry">Expiry Date</Label>
                      <Input
                        id="cardExpiry"
                        placeholder="MM/YY"
                        value={cardForm.expiry}
                        onChange={(e) => setCardForm({ ...cardForm, expiry: formatExpiry(e.target.value) })}
                        maxLength={5}
                        className="font-mono text-center tracking-widest"
                        data-testid="input-card-expiry"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardCvv">CVV</Label>
                      <Input
                        id="cardCvv"
                        type="password"
                        placeholder="***"
                        value={cardForm.cvv}
                        onChange={(e) => setCardForm({ ...cardForm, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                        maxLength={4}
                        className="font-mono text-center tracking-widest"
                        data-testid="input-card-cvv"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setShowCardGateway(false); setPaymentError(""); }}
                    data-testid="button-cancel-card"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={processCardPayment}
                    disabled={isSubmitting}
                    data-testid="button-pay-card"
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Pay PKR {total.toLocaleString()}
                  </Button>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  <p className="text-xs text-muted-foreground">256-bit SSL encrypted. Your data is secure.</p>
                </div>
              </CardContent>
            </Card>
          )}

          {paymentStep === "processing" && (
            <Card className="border-0 shadow-2xl" data-testid="section-card-processing">
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
                <h3 className="font-bold text-lg mb-2">Processing Payment</h3>
                <p className="text-sm text-muted-foreground mb-8">
                  Please do not close this window
                </p>
                <div className="space-y-3 max-w-xs mx-auto">
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      processingStage >= 1 ? "bg-emerald-500" : "bg-muted"
                    }`}>
                      {processingStage >= 1 ? <Check className="h-3.5 w-3.5 text-white" /> : <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" />}
                    </div>
                    <span className={`text-sm ${processingStage >= 1 ? "text-foreground" : "text-muted-foreground"}`}>Validating card details</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      processingStage >= 2 ? "bg-emerald-500" : processingStage >= 1 ? "bg-muted" : "bg-muted/50"
                    }`}>
                      {processingStage >= 2 ? <Check className="h-3.5 w-3.5 text-white" /> : processingStage >= 1 ? <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" /> : <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
                    </div>
                    <span className={`text-sm ${processingStage >= 2 ? "text-foreground" : processingStage >= 1 ? "text-muted-foreground" : "text-muted-foreground/50"}`}>Contacting payment network</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      processingStage >= 3 ? "bg-emerald-500" : processingStage >= 2 ? "bg-muted" : "bg-muted/50"
                    }`}>
                      {processingStage >= 3 ? <Check className="h-3.5 w-3.5 text-white" /> : processingStage >= 2 ? <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin" /> : <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
                    </div>
                    <span className={`text-sm ${processingStage >= 3 ? "text-foreground" : processingStage >= 2 ? "text-muted-foreground" : "text-muted-foreground/50"}`}>Authorizing payment</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {paymentStep === "success" && (
            <Card className="border-0 shadow-2xl" data-testid="section-card-success">
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="h-8 w-8 text-emerald-500" />
                </div>
                <h3 className="font-bold text-lg mb-1 text-emerald-600 dark:text-emerald-400">Payment Approved</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  PKR {total.toLocaleString()} charged to {cardType.charAt(0).toUpperCase() + cardType.slice(1)} ****{lastFour}
                </p>
                <p className="text-xs font-mono text-muted-foreground" data-testid="text-gateway-txn-id">
                  {transactionId}
                </p>
                <div className="mt-6 flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Creating your order...</p>
                </div>
              </CardContent>
            </Card>
          )}

          {paymentStep === "failed" && (
            <Card className="border-0 shadow-2xl" data-testid="section-card-failed">
              <CardContent className="p-8 sm:p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-destructive">Payment Failed</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {paymentError}
                </p>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setShowCardGateway(false); setPaymentError(""); }}
                    data-testid="button-cancel-failed"
                  >
                    Go Back
                  </Button>
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => { setPaymentStep("form"); setPaymentError(""); }}
                    data-testid="button-retry-payment"
                  >
                    Try Again
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <p className="text-center text-xs text-slate-400 mt-4">
            Secured by Naya Fashion Payment Gateway
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/cart" className="inline-flex items-center text-sm text-muted-foreground mb-6" data-testid="link-back-to-cart">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Cart
      </Link>

      <h1 className="text-2xl font-bold mb-8" data-testid="text-checkout-title">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-card-border">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Contact Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={form.customerName}
                      onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                      required
                      data-testid="input-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.customerEmail}
                      onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                      required
                      data-testid="input-email"
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="03XX XXXXXXX"
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    required
                    data-testid="input-phone"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-card-border">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Shipping Address</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address *</Label>
                    <Input
                      id="address"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      required
                      data-testid="input-address"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City *</Label>
                      <Input
                        id="city"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        required
                        data-testid="input-city"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">ZIP Code</Label>
                      <Input
                        id="zipCode"
                        value={form.zipCode}
                        onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
                        data-testid="input-zip"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-card-border">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Payment Method</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`flex items-center gap-3 p-4 rounded-md border-2 transition-colors text-left ${
                      paymentMethod === "cod"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                    data-testid="button-payment-cod"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      paymentMethod === "cod" ? "bg-primary/10" : "bg-muted/50"
                    }`}>
                      <Banknote className={`h-4 w-4 ${paymentMethod === "cod" ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Cash on Delivery</p>
                      <p className="text-xs text-muted-foreground">Pay on receive</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`flex items-center gap-3 p-4 rounded-md border-2 transition-colors text-left ${
                      paymentMethod === "card"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                    data-testid="button-payment-card"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      paymentMethod === "card" ? "bg-primary/10" : "bg-muted/50"
                    }`}>
                      <CreditCard className={`h-4 w-4 ${paymentMethod === "card" ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Debit / Credit Card</p>
                      <p className="text-xs text-muted-foreground">Secure gateway</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("online")}
                    className={`flex items-center gap-3 p-4 rounded-md border-2 transition-colors text-left ${
                      paymentMethod === "online"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                    data-testid="button-payment-online"
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      paymentMethod === "online" ? "bg-primary/10" : "bg-muted/50"
                    }`}>
                      <Smartphone className={`h-4 w-4 ${paymentMethod === "online" ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="font-medium text-sm">JazzCash / EasyPaisa</p>
                      <p className="text-xs text-muted-foreground">Manual transfer</p>
                    </div>
                  </button>
                </div>

                {paymentMethod === "card" && (
                  <div className="mt-4 p-3 rounded-md bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">You will be redirected to our secure payment gateway after clicking the button below. Visa, Mastercard, Amex accepted.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="border-card-border sticky top-24">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Order Summary</h3>

                <div className="space-y-3 mb-4">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex justify-between gap-2 text-sm" data-testid={`checkout-item-${item.product.id}`}>
                      <span className="text-muted-foreground truncate">
                        {item.product.name} x{item.quantity}
                      </span>
                      <span>PKR {(Number(item.product.price) * item.quantity).toLocaleString()}</span>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>PKR {totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between gap-2">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{shipping === 0 ? "Free" : `PKR ${shipping.toLocaleString()}`}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between gap-2 font-semibold text-base">
                    <span>Total</span>
                    <span data-testid="text-checkout-total">PKR {total.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-6"
                  size="lg"
                  disabled={isSubmitting}
                  data-testid="button-place-order"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Placing Order...
                    </>
                  ) : paymentMethod === "cod" ? (
                    `Place Order - PKR ${total.toLocaleString()}`
                  ) : paymentMethod === "card" ? (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      {`Proceed to Pay PKR ${total.toLocaleString()}`}
                    </>
                  ) : (
                    `Pay Now - PKR ${total.toLocaleString()}`
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center mt-3">
                  {paymentMethod === "cod"
                    ? "You will pay the delivery rider in cash."
                    : paymentMethod === "card"
                    ? "You will be taken to the secure payment gateway."
                    : "You will be shown payment details next."}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="modal-payment">
          <Card className="w-full max-w-md mx-4 border-card-border">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-1">Complete Your Payment</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Send PKR {total.toLocaleString()} to the following account
              </p>

              <div className="space-y-4 mb-6">
                <div className="p-4 rounded-md bg-muted/30 border border-border space-y-3">
                  <div>
                    <p className="text-xs text-muted-foreground">JazzCash / EasyPaisa</p>
                    <p className="font-medium text-sm" data-testid="text-payment-phone">0300 1234567</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Account Title</p>
                    <p className="font-medium text-sm">Naya Fashion</p>
                  </div>
                  <Separator />
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">Reference Number</p>
                        <p className="font-medium text-sm font-mono">NF-2026-8847-0032</p>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={handleCopyAccount}
                        data-testid="button-copy-reference"
                      >
                        {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground">Amount</p>
                    <p className="font-bold text-base text-primary">PKR {total.toLocaleString()}</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  After sending the payment, click "Confirm Payment" below. Our team will verify your 
                  payment and update your order status within 24 hours.
                </p>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowPaymentModal(false)}
                  data-testid="button-cancel-payment"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={placeOrder}
                  disabled={isSubmitting}
                  data-testid="button-confirm-payment"
                >
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</>
                  ) : (
                    "Confirm Payment"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

import type { Express, Request, Response, NextFunction } from "express";
import { type Server } from "http";
import { storage } from "./storage";
import { insertProductSchema, insertOrderSchema, insertOrderItemSchema } from "@shared/schema";
import { seedDatabase } from "./seed";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { randomUUID, randomBytes } from "crypto";

const uploadStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), "client/public/images"));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `product-${randomUUID()}${ext}`);
  },
});

const upload = multer({
  storage: uploadStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [".png", ".jpg", ".jpeg", ".webp"];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.adminId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await seedDatabase();

  app.get("/api/categories", async (_req, res) => {
    const cats = await storage.getCategories();
    res.json(cats);
  });

  app.get("/api/products", async (req, res) => {
    const categoryId = req.query.categoryId;
    if (categoryId) {
      const prods = await storage.getProductsByCategory(Number(categoryId));
      return res.json(prods);
    }
    const prods = await storage.getProducts();
    res.json(prods);
  });

  app.get("/api/products/:id", async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  app.post("/api/products", requireAdmin, async (req, res) => {
    const parsed = insertProductSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const product = await storage.createProduct(parsed.data);
    res.status(201).json(product);
  });

  const updateProductSchema = z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    price: z.string().optional(),
    stock: z.number().int().min(0).optional(),
    image: z.string().optional(),
    categoryId: z.number().int().positive().optional(),
  });

  app.patch("/api/products/:id", requireAdmin, async (req, res) => {
    const parsed = updateProductSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });
    const product = await storage.updateProduct(Number(req.params.id), parsed.data);
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json(product);
  });

  app.delete("/api/products/:id", requireAdmin, async (req, res) => {
    const deleted = await storage.deleteProduct(Number(req.params.id));
    if (!deleted) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  });

  app.post("/api/admin/login", async (req, res) => {
    const { email, password } = req.body;
    const user = await storage.getUserByEmail(email);
    if (!user || user.password !== password || user.role !== "admin") {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    req.session.adminId = user.id;
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  });

  app.post("/api/admin/logout", (req, res) => {
    req.session.destroy(() => {});
    res.json({ message: "Logged out" });
  });

  app.get("/api/admin/me", (req, res) => {
    if (!req.session.adminId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json({ adminId: req.session.adminId });
  });

  app.post("/api/upload", requireAdmin, upload.single("image"), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const imagePath = `/images/${req.file.filename}`;
    res.json({ url: imagePath });
  });

  app.get("/api/orders", requireAdmin, async (_req, res) => {
    const allOrders = await storage.getOrders();
    res.json(allOrders);
  });

  app.get("/api/orders/:id", requireAdmin, async (req, res) => {
    const order = await storage.getOrder(Number(req.params.id));
    if (!order) return res.status(404).json({ message: "Order not found" });
    const items = await storage.getOrderItems(order.id);
    res.json({ ...order, items });
  });

  app.post("/api/orders/track", async (req, res) => {
    const { orderId, email } = req.body;
    if (!orderId || !email) {
      return res.status(400).json({ message: "Order ID and email are required" });
    }
    const order = await storage.getOrderByIdAndEmail(Number(orderId), email);
    if (!order) {
      return res.status(404).json({ message: "Order not found. Please check your order ID and email." });
    }
    const items = await storage.getOrderItems(order.id);

    const productDetails = [];
    for (const item of items) {
      const product = await storage.getProduct(item.productId);
      productDetails.push({
        ...item,
        productName: product?.name || "Unknown Product",
        productImage: product?.image || "",
      });
    }

    res.json({
      id: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      shippingAddress: order.shippingAddress,
      shippingCity: order.shippingCity,
      totalPrice: order.totalPrice,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      status: order.status,
      transactionId: order.transactionId,
      trackingCode: order.trackingCode,
      orderDate: order.orderDate,
      items: productDetails,
    });
  });

  const cardPaymentSchema = z.object({
    cardNumber: z.string().min(13).max(19),
    cardName: z.string().min(1),
    expiryMonth: z.string().length(2),
    expiryYear: z.string().length(2),
    cvv: z.string().min(3).max(4),
    amount: z.number().positive(),
  });

  function luhnCheck(num: string): boolean {
    const digits = num.replace(/\D/g, "");
    let sum = 0;
    let alternate = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let n = parseInt(digits[i], 10);
      if (alternate) {
        n *= 2;
        if (n > 9) n -= 9;
      }
      sum += n;
      alternate = !alternate;
    }
    return sum % 10 === 0;
  }

  function detectCardType(num: string): string {
    const d = num.replace(/\D/g, "");
    if (/^4/.test(d)) return "visa";
    if (/^5[1-5]/.test(d) || /^2[2-7]/.test(d)) return "mastercard";
    if (/^3[47]/.test(d)) return "amex";
    if (/^6(?:011|5)/.test(d)) return "discover";
    if (/^(?:2131|1800|35)/.test(d)) return "jcb";
    if (/^3(?:0[0-5]|[68])/.test(d)) return "diners";
    return "unknown";
  }

  app.post("/api/payments/process", async (req, res) => {
    const parsed = cardPaymentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "INVALID_INPUT",
        message: "Please provide valid card details.",
      });
    }

    const { cardNumber, expiryMonth, expiryYear, cvv, amount } = parsed.data;
    const digits = cardNumber.replace(/\D/g, "");

    if (!luhnCheck(digits)) {
      return res.status(400).json({
        success: false,
        error: "INVALID_CARD",
        message: "The card number is invalid. Please check and try again.",
      });
    }

    const now = new Date();
    const expYear = 2000 + parseInt(expiryYear, 10);
    const expMonth = parseInt(expiryMonth, 10);
    if (expYear < now.getFullYear() || (expYear === now.getFullYear() && expMonth < now.getMonth() + 1)) {
      return res.status(400).json({
        success: false,
        error: "CARD_EXPIRED",
        message: "This card has expired. Please use a different card.",
      });
    }

    if (cvv.length < 3) {
      return res.status(400).json({
        success: false,
        error: "INVALID_CVV",
        message: "Invalid security code.",
      });
    }

    const cardType = detectCardType(digits);
    const transactionId = `NF-${Date.now()}-${randomBytes(3).toString("hex").toUpperCase()}`;
    const lastFour = digits.slice(-4);

    res.json({
      success: true,
      transactionId,
      cardType,
      lastFour,
      amount,
      message: "Payment approved successfully.",
    });
  });

  app.post("/api/orders", async (req, res) => {
    const { items, transactionId, ...orderData } = req.body;
    const parsed = insertOrderSchema.safeParse(orderData);
    if (!parsed.success) return res.status(400).json({ message: parsed.error.message });

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order must have items" });
    }

    for (const item of items) {
      const product = await storage.getProduct(item.productId);
      if (!product) return res.status(400).json({ message: `Product ${item.productId} not found` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }
    }

    const isCardPayment = parsed.data.paymentMethod === "card" && transactionId;
    const order = await storage.createOrder({
      ...parsed.data,
      paymentStatus: isCardPayment ? "paid" : "unpaid",
      status: isCardPayment ? "confirmed" : "pending",
      ...(transactionId ? { transactionId } : {}),
    } as any);

    for (const item of items) {
      const itemParsed = insertOrderItemSchema.safeParse({ ...item, orderId: order.id });
      if (itemParsed.success) {
        await storage.createOrderItem(itemParsed.data);
        const product = await storage.getProduct(item.productId);
        if (product) {
          await storage.updateProduct(item.productId, {
            stock: product.stock - item.quantity,
          });
        }
      }
    }

    res.status(201).json(order);
  });

  app.patch("/api/orders/:id/status", requireAdmin, async (req, res) => {
    const { status } = req.body;
    if (!["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const order = await storage.updateOrderStatus(Number(req.params.id), status);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  });

  app.patch("/api/orders/:id", requireAdmin, async (req, res) => {
    const { trackingCode, paymentStatus } = req.body;
    const updates: Record<string, string> = {};
    if (trackingCode !== undefined) updates.trackingCode = trackingCode;
    if (paymentStatus !== undefined) updates.paymentStatus = paymentStatus;
    const order = await storage.updateOrder(Number(req.params.id), updates);
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  });

  return httpServer;
}

import { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package, ShoppingCart, DollarSign, TrendingUp,
  Plus, Pencil, Trash2, LogOut, Loader2, Upload, ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product, Category, Order } from "@shared/schema";

function ImageUpload({ onImageUploaded, currentImage }: { onImageUploaded: (url: string) => void; currentImage?: string }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      onImageUploaded(data.url);
    } catch {
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Product Image</Label>
      <div
        className="border-2 border-dashed border-border rounded-md p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        data-testid="dropzone-image-upload"
      >
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="w-full h-32 object-cover rounded-md" />
            {uploading && (
              <div className="absolute inset-0 bg-background/70 flex items-center justify-center rounded-md">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        ) : (
          <div className="py-4">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Click to upload image</p>
            <p className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP (max 5MB)</p>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
        data-testid="input-image-file"
      />
    </div>
  );
}

export default function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const { data: adminCheck, isLoading: authLoading, isError: authError } = useQuery({
    queryKey: ["/api/admin/me"],
    retry: false,
  });

  useEffect(() => {
    if (!authLoading && (authError || !adminCheck)) setLocation("/admin");
  }, [adminCheck, authLoading, authError, setLocation]);

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: categories } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: orders, isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ["/api/orders"],
  });

  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    stock: "",
    image: "",
    categoryId: "",
  });

  const [editImage, setEditImage] = useState("");

  const addProductMutation = useMutation({
    mutationFn: async (data: typeof newProduct) => {
      return apiRequest("POST", "/api/products", {
        ...data,
        price: data.price,
        stock: Number(data.stock),
        categoryId: Number(data.categoryId),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setAddDialogOpen(false);
      setNewProduct({ name: "", description: "", price: "", stock: "", image: "", categoryId: "" });
      toast({ title: "Product added successfully" });
    },
    onError: () => toast({ title: "Failed to add product", variant: "destructive" }),
  });

  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Product> }) => {
      return apiRequest("PATCH", `/api/products/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      setEditDialogOpen(false);
      setEditingProduct(null);
      setEditImage("");
      toast({ title: "Product updated successfully" });
    },
    onError: () => toast({ title: "Failed to update product", variant: "destructive" }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product deleted" });
    },
    onError: () => toast({ title: "Failed to delete product", variant: "destructive" }),
  });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest("PATCH", `/api/orders/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order status updated" });
    },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Record<string, string> }) => {
      return apiRequest("PATCH", `/api/orders/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order updated" });
    },
    onError: () => toast({ title: "Failed to update order", variant: "destructive" }),
  });

  const handleLogout = async () => {
    await apiRequest("POST", "/api/admin/logout");
    queryClient.invalidateQueries({ queryKey: ["/api/admin/me"] });
    setLocation("/admin");
  };

  const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.totalPrice), 0) || 0;
  const totalProducts = products?.length || 0;
  const totalOrders = orders?.length || 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "secondary";
      case "confirmed": return "secondary";
      case "processing": return "secondary";
      case "shipped": return "default";
      case "delivered": return "default";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your store</p>
        </div>
        <Button variant="outline" onClick={handleLogout} data-testid="button-logout">
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold" data-testid="text-total-revenue">PKR {totalRevenue.toLocaleString()}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-xs text-muted-foreground">Products</p>
                <p className="text-xl font-bold" data-testid="text-total-products">{totalProducts}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-xs text-muted-foreground">Orders</p>
                <p className="text-xl font-bold" data-testid="text-total-orders">{totalOrders}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-card-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-1">
              <div>
                <p className="text-xs text-muted-foreground">Avg. Order</p>
                <p className="text-xl font-bold" data-testid="text-avg-order">
                  PKR {totalOrders > 0 ? (totalRevenue / totalOrders).toLocaleString() : "0"}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="products" className="space-y-6">
        <TabsList data-testid="tabs-admin">
          <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
          <TabsTrigger value="orders" data-testid="tab-orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-semibold">Product Management</h2>
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-product">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Product</DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newProduct.image) {
                      toast({ title: "Please upload a product image", variant: "destructive" });
                      return;
                    }
                    addProductMutation.mutate(newProduct);
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      required
                      data-testid="input-new-product-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={newProduct.description}
                      onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                      required
                      data-testid="input-new-product-description"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Price (PKR)</Label>
                      <Input
                        type="number"
                        step="1"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
                        required
                        data-testid="input-new-product-price"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Stock</Label>
                      <Input
                        type="number"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
                        required
                        data-testid="input-new-product-stock"
                      />
                    </div>
                  </div>
                  <ImageUpload
                    onImageUploaded={(url) => setNewProduct({ ...newProduct, image: url })}
                  />
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select
                      value={newProduct.categoryId}
                      onValueChange={(v) => setNewProduct({ ...newProduct, categoryId: v })}
                    >
                      <SelectTrigger data-testid="select-new-product-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={addProductMutation.isPending} data-testid="button-submit-new-product">
                    {addProductMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Adding...</>
                    ) : "Add Product"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {productsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Card className="border-card-border">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products?.map((product) => {
                      const cat = categories?.find((c) => c.id === product.categoryId);
                      return (
                        <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-md overflow-hidden bg-muted/30 flex-shrink-0">
                                <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                              </div>
                              <span className="font-medium text-sm line-clamp-1">{product.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">{cat?.name || "Unknown"}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">PKR {Number(product.price).toLocaleString()}</TableCell>
                          <TableCell>
                            <span className={product.stock <= 5 ? "text-destructive font-medium" : ""}>
                              {product.stock}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setEditingProduct(product);
                                  setEditImage(product.image);
                                  setEditDialogOpen(true);
                                }}
                                data-testid={`button-edit-product-${product.id}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm("Delete this product?")) {
                                    deleteProductMutation.mutate(product.id);
                                  }
                                }}
                                data-testid={`button-delete-product-${product.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="orders">
          <h2 className="text-lg font-semibold mb-4">Order Management</h2>

          {ordersLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : orders && orders.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm" data-testid="text-no-orders">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders?.map((order) => (
                <Card key={order.id} className="border-card-border" data-testid={`row-order-${order.id}`}>
                  <CardContent className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm">#{order.id}</span>
                          <Badge variant={getStatusColor(order.status)} className="capitalize text-xs">
                            {order.status}
                          </Badge>
                          <Badge
                            variant={order.paymentStatus === "paid" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {order.paymentMethod === "cod" ? "COD" : order.paymentMethod === "card" ? "Card" : "Online"}
                          </Badge>
                        </div>
                        <p className="text-sm font-medium">{order.customerName}</p>
                        <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                        {order.customerPhone && (
                          <p className="text-xs text-muted-foreground">{order.customerPhone}</p>
                        )}
                        {order.shippingAddress && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {order.shippingAddress}{order.shippingCity ? `, ${order.shippingCity}` : ""}
                          </p>
                        )}
                        {(order as any).transactionId && (
                          <p className="text-xs text-muted-foreground mt-1 font-mono">
                            TXN: {(order as any).transactionId}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-bold">PKR {Number(order.totalPrice).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.orderDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="flex flex-wrap gap-3 items-end">
                      <div className="space-y-1">
                        <Label className="text-xs">Order Status</Label>
                        <Select
                          value={order.status}
                          onValueChange={(status) =>
                            updateOrderStatusMutation.mutate({ id: order.id, status })
                          }
                        >
                          <SelectTrigger className="w-36 h-8 text-xs" data-testid={`select-order-status-${order.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="confirmed">Confirmed</SelectItem>
                            <SelectItem value="processing">Processing</SelectItem>
                            <SelectItem value="shipped">Shipped</SelectItem>
                            <SelectItem value="delivered">Delivered</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs">Payment Status</Label>
                        <Select
                          value={order.paymentStatus}
                          onValueChange={(paymentStatus) =>
                            updateOrderMutation.mutate({ id: order.id, data: { paymentStatus } })
                          }
                        >
                          <SelectTrigger className="w-28 h-8 text-xs" data-testid={`select-payment-status-${order.id}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unpaid">Unpaid</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1 flex-1 min-w-[200px]">
                        <Label className="text-xs">Tracking Code</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter tracking code"
                            defaultValue={order.trackingCode || ""}
                            className="h-8 text-xs"
                            onBlur={(e) => {
                              const val = e.target.value.trim();
                              if (val !== (order.trackingCode || "")) {
                                updateOrderMutation.mutate({ id: order.id, data: { trackingCode: val } });
                              }
                            }}
                            data-testid={`input-tracking-${order.id}`}
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateProductMutation.mutate({
                  id: editingProduct.id,
                  data: {
                    name: formData.get("name") as string,
                    description: formData.get("description") as string,
                    price: formData.get("price") as string,
                    stock: Number(formData.get("stock")),
                    image: editImage || editingProduct.image,
                    categoryId: Number(formData.get("categoryId")),
                  },
                });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label>Name</Label>
                <Input name="name" defaultValue={editingProduct.name} required data-testid="input-edit-product-name" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea name="description" defaultValue={editingProduct.description} required data-testid="input-edit-product-description" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Price (PKR)</Label>
                  <Input name="price" type="number" step="1" defaultValue={Number(editingProduct.price)} required data-testid="input-edit-product-price" />
                </div>
                <div className="space-y-2">
                  <Label>Stock</Label>
                  <Input name="stock" type="number" defaultValue={editingProduct.stock} required data-testid="input-edit-product-stock" />
                </div>
              </div>
              <ImageUpload
                currentImage={editingProduct.image}
                onImageUploaded={(url) => setEditImage(url)}
              />
              <input type="hidden" name="categoryId" value={editingProduct.categoryId} />
              <Button type="submit" className="w-full" disabled={updateProductMutation.isPending} data-testid="button-submit-edit-product">
                {updateProductMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating...</>
                ) : "Update Product"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

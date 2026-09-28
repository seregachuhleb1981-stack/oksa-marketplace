-- Initial OKSA marketplace schema
CREATE TYPE "ProductStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED');

CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "parentId" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Brand" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Product" (
  "id" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "price" DECIMAL(12,2) NOT NULL,
  "oldPrice" DECIMAL(12,2),
  "currency" TEXT NOT NULL DEFAULT 'UAH',
  "available" BOOLEAN NOT NULL DEFAULT false,
  "status" "ProductStatus" NOT NULL DEFAULT 'ACTIVE',
  "categoryId" TEXT,
  "brandId" TEXT,
  "gtin" TEXT,
  "mpn" TEXT,
  "vendorCode" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductImage" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "alt" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductAttribute" (
  "id" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "phone" TEXT,
  "passwordHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Order" (
  "id" TEXT NOT NULL,
  "number" TEXT NOT NULL,
  "userId" TEXT,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "customerName" TEXT NOT NULL,
  "customerPhone" TEXT NOT NULL,
  "customerEmail" TEXT,
  "city" TEXT NOT NULL,
  "deliveryBranch" TEXT NOT NULL,
  "comment" TEXT,
  "total" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'UAH',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL,
  "orderId" TEXT NOT NULL,
  "productId" TEXT,
  "sku" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "price" DECIMAL(12,2) NOT NULL,
  "quantity" INTEGER NOT NULL,
  "total" DECIMAL(12,2) NOT NULL,
  CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImportRun" (
  "id" TEXT NOT NULL,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "finishedAt" TIMESTAMP(3),
  "status" TEXT NOT NULL,
  "processed" INTEGER NOT NULL DEFAULT 0,
  "created" INTEGER NOT NULL DEFAULT 0,
  "updated" INTEGER NOT NULL DEFAULT 0,
  "failed" INTEGER NOT NULL DEFAULT 0,
  "error" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ImportRun_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");
CREATE INDEX "Product_status_available_idx" ON "Product"("status", "available");
CREATE INDEX "Product_name_idx" ON "Product"("name");

CREATE INDEX "ProductImage_productId_sortOrder_idx" ON "ProductImage"("productId", "sortOrder");
CREATE INDEX "ProductAttribute_productId_idx" ON "ProductAttribute"("productId");

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");

ALTER TABLE "Category"
  ADD CONSTRAINT "Category_parentId_fkey"
  FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Product"
  ADD CONSTRAINT "Product_brandId_fkey"
  FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ProductImage"
  ADD CONSTRAINT "ProductImage_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductAttribute"
  ADD CONSTRAINT "ProductAttribute_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Order"
  ADD CONSTRAINT "Order_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_orderId_fkey"
  FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "OrderItem"
  ADD CONSTRAINT "OrderItem_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

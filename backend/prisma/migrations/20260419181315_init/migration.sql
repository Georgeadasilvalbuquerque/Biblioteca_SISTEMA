-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'LIBRARIAN');

-- CreateEnum
CREATE TYPE "ItemType" AS ENUM ('BOOK', 'MAGAZINE', 'SUPPORT_MATERIAL');

-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('ENTRY', 'EXIT', 'LOAN', 'RETURN', 'ADJUSTMENT', 'LOSS');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('OPEN', 'RETURNED', 'LATE', 'CANCELLED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'LIBRARIAN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "document" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "type" "ItemType" NOT NULL,
    "description" TEXT,
    "author" TEXT,
    "publisher" TEXT,
    "isbn" TEXT,
    "issn" TEXT,
    "edition" TEXT,
    "publicationYear" INTEGER,
    "language" TEXT,
    "shelfLocation" TEXT,
    "minimumQuantity" INTEGER NOT NULL DEFAULT 1,
    "currentQuantity" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movements" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MovementType" NOT NULL,
    "quantity" INTEGER NOT NULL,
    "previousQuantity" INTEGER NOT NULL,
    "newQuantity" INTEGER NOT NULL,
    "reason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "loanDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "returnDate" TIMESTAMP(3),
    "status" "LoanStatus" NOT NULL DEFAULT 'OPEN',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "members_email_key" ON "members"("email");

-- CreateIndex
CREATE UNIQUE INDEX "members_document_key" ON "members"("document");

-- CreateIndex
CREATE INDEX "members_name_idx" ON "members"("name");

-- CreateIndex
CREATE UNIQUE INDEX "items_code_key" ON "items"("code");

-- CreateIndex
CREATE UNIQUE INDEX "items_isbn_key" ON "items"("isbn");

-- CreateIndex
CREATE UNIQUE INDEX "items_issn_key" ON "items"("issn");

-- CreateIndex
CREATE INDEX "items_title_idx" ON "items"("title");

-- CreateIndex
CREATE INDEX "items_type_idx" ON "items"("type");

-- CreateIndex
CREATE INDEX "items_currentQuantity_minimumQuantity_idx" ON "items"("currentQuantity", "minimumQuantity");

-- CreateIndex
CREATE INDEX "movements_itemId_createdAt_idx" ON "movements"("itemId", "createdAt");

-- CreateIndex
CREATE INDEX "movements_type_createdAt_idx" ON "movements"("type", "createdAt");

-- CreateIndex
CREATE INDEX "loans_itemId_status_idx" ON "loans"("itemId", "status");

-- CreateIndex
CREATE INDEX "loans_memberId_status_idx" ON "loans"("memberId", "status");

-- CreateIndex
CREATE INDEX "loans_dueDate_status_idx" ON "loans"("dueDate", "status");

-- AddForeignKey
ALTER TABLE "movements" ADD CONSTRAINT "movements_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movements" ADD CONSTRAINT "movements_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

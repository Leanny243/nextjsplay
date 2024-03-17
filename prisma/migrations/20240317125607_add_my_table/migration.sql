-- CreateTable
CREATE TABLE "MyTable" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MyTable_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InsigniaObtenida" ADD CONSTRAINT "InsigniaObtenida_otorgadaPorId_fkey" FOREIGN KEY ("otorgadaPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

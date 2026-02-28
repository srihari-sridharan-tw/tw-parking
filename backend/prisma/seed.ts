import { PrismaClient, Role, SlotType } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Admin user
  const adminHash = await bcrypt.hash("Admin@1234", 12);
  await prisma.user.upsert({
    where: { email: "admin@slotify.com" },
    update: {},
    create: {
      email: "admin@slotify.com",
      passwordHash: adminHash,
      role: Role.ADMIN,
    },
  });
  console.log("  Created admin: admin@slotify.com");

  // Security user
  const secHash = await bcrypt.hash("Security@1234", 12);
  await prisma.user.upsert({
    where: { email: "security@slotify.com" },
    update: {},
    create: {
      email: "security@slotify.com",
      passwordHash: secHash,
      role: Role.SECURITY,
    },
  });
  console.log("  Created security: security@slotify.com");

  // Sample parking slots — format: one uppercase letter + 4 digits
  const slots = [
    { slotCode: "M1001", level: 1, type: SlotType.TWO_WHEELER },
    { slotCode: "M1002", level: 1, type: SlotType.TWO_WHEELER },
    { slotCode: "M1003", level: 1, type: SlotType.TWO_WHEELER },
    { slotCode: "M1004", level: 1, type: SlotType.TWO_WHEELER },
    { slotCode: "M1005", level: 1, type: SlotType.TWO_WHEELER },
    { slotCode: "C2001", level: 2, type: SlotType.FOUR_WHEELER },
    { slotCode: "C2002", level: 2, type: SlotType.FOUR_WHEELER },
    { slotCode: "C2003", level: 2, type: SlotType.FOUR_WHEELER },
    { slotCode: "C2004", level: 2, type: SlotType.FOUR_WHEELER },
    { slotCode: "C2005", level: 2, type: SlotType.FOUR_WHEELER },
  ];

  for (const slot of slots) {
    await prisma.parkingSlot.upsert({
      where: { slotCode: slot.slotCode },
      update: {},
      create: slot,
    });
  }
  console.log(`  Created ${slots.length} parking slots`);

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { AccountKind, PrismaClient, Role } from "@prisma/client";
import { launchConfig } from "../src/config/launch";

function resolveSqliteUrl() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const relative = url.replace(/^file:/, "");
  const candidates = [
    path.resolve(process.cwd(), relative),
    path.resolve(process.cwd(), "prisma", path.basename(relative)),
  ];
  const filePath = candidates.find((p) => fs.existsSync(p)) ?? candidates[0];
  return `file:${filePath}`;
}

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({ url: resolveSqliteUrl() }),
});

async function main() {
  await prisma.feeConfig.upsert({
    where: { city: launchConfig.city },
    update: {
      currency: launchConfig.currency,
      ownerShareBps: launchConfig.ownerShareBps,
      platformFeeBps: launchConfig.platformFeeBps,
      defaultDepositCents: launchConfig.defaultDepositCents,
      minRenterAge: launchConfig.minRenterAge,
      softHoldHours: launchConfig.softHoldHours,
      cancelFullRefundHours: launchConfig.cancelFullRefundHours,
      payoutHoldHours: launchConfig.payoutHoldHours,
    },
    create: {
      city: launchConfig.city,
      currency: launchConfig.currency,
      ownerShareBps: launchConfig.ownerShareBps,
      platformFeeBps: launchConfig.platformFeeBps,
      defaultDepositCents: launchConfig.defaultDepositCents,
      minRenterAge: launchConfig.minRenterAge,
      softHoldHours: launchConfig.softHoldHours,
      cancelFullRefundHours: launchConfig.cancelFullRefundHours,
      payoutHoldHours: launchConfig.payoutHoldHours,
    },
  });

  const users = [
    { email: "owner@demo.local", name: "Demo Owner", role: Role.OWNER, accountKind: AccountKind.INDIVIDUAL },
    { email: "renter@demo.local", name: "Demo Renter", role: Role.RENTER, accountKind: AccountKind.INDIVIDUAL },
    {
      email: "company@demo.local",
      name: "Priya Shah",
      role: Role.RENTER,
      accountKind: AccountKind.COMPANY,
      companyName: "Northwind Logistics",
      companyRegistration: "REG-10482",
    },
    {
      email: "fleet@demo.local",
      name: "Sam Cole",
      role: Role.OWNER,
      accountKind: AccountKind.COMPANY,
      companyName: "CityFleet Ltd",
      companyRegistration: "REG-22011",
    },
    { email: "ops@demo.local", name: "Demo Ops", role: Role.OPS, accountKind: AccountKind.INDIVIDUAL },
    { email: "admin@demo.local", name: "Demo Admin", role: Role.ADMIN, accountKind: AccountKind.INDIVIDUAL },
  ] as const;

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        role: u.role,
        accountKind: u.accountKind,
        companyName: "companyName" in u ? u.companyName : null,
        companyRegistration: "companyRegistration" in u ? u.companyRegistration : null,
      },
      create: {
        email: u.email,
        name: u.name,
        role: u.role,
        accountKind: u.accountKind,
        companyName: "companyName" in u ? u.companyName : null,
        companyRegistration: "companyRegistration" in u ? u.companyRegistration : null,
      },
    });

    if (u.role === Role.OWNER) {
      await prisma.ownerProfile.upsert({
        where: { userId: user.id },
        update: { onboardingDone: true },
        create: {
          userId: user.id,
          onboardingDone: true,
          ownerShareBps: launchConfig.ownerShareBps,
          phone: "+10000000001",
          payoutMethodHint: "bank",
          bankAccountLast4: "4242",
        },
      });
    }

    if (u.role === Role.RENTER) {
      await prisma.renterProfile.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          phone: "+10000000002",
          dateOfBirth: new Date("1995-01-15"),
          licenseNumber: "D1234567",
          licenseCountry: "US",
          verifiedAt: new Date(),
        },
      });
    }
  }

  const owner = await prisma.ownerProfile.findFirst({
    where: { user: { email: "owner@demo.local" } },
  });

  if (owner) {
    const existing = await prisma.vehicle.findFirst({
      where: { ownerId: owner.id, plate: "DEMO-001" },
    });
    if (!existing) {
      await prisma.vehicle.create({
        data: {
          ownerId: owner.id,
          status: "LIVE",
          make: "Toyota",
          model: "Corolla",
          year: 2022,
          plate: "DEMO-001",
          vin: "JTDBR32E720000001",
          category: "economy",
          seats: 5,
          dailyRateCents: 4500,
          city: launchConfig.city,
          photos: {
            create: [{ url: "/cars/demo-corolla.jpg", isCover: true, sortOrder: 0 }],
          },
          documents: {
            create: [
              {
                type: "REGISTRATION",
                url: "/docs/demo-registration.pdf",
                status: "APPROVED",
              },
            ],
          },
        },
      });
    }
  }

  console.log("Seeded fee config, demo users, and sample LIVE vehicle.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

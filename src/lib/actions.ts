"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  AccountKind,
  BookingStatus,
  ContractType,
  DocumentType,
  FuelType,
  PhotoKind,
  Role,
  Transmission,
  VehicleLocation,
  VehicleStatus,
  ChecklistType,
  ClaimStatus,
  TicketPriority,
  UserStatus,
} from "@prisma/client";
import { prisma } from "@/lib/db";
import { clearSession, getSessionUser, requireUser, setSession } from "@/lib/auth";
import { writeAuditLog } from "@/lib/domain/audit";
import {
  cancellationRefundCents,
  generateBookingCode,
  quoteTrip,
} from "@/lib/domain/money";
import { launchConfig } from "@/config/launch";
import { mockPaymentProvider } from "@/lib/payments/provider";

function str(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function num(formData: FormData, key: string) {
  return Number(formData.get(key) ?? 0);
}

async function persistAudit(input: {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  meta?: Record<string, unknown>;
}) {
  await writeAuditLog(input);
  await prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metaJson: JSON.stringify(input.meta ?? {}),
    },
  });
}

export async function signupAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const name = str(formData, "name");
  const email = str(formData, "email").toLowerCase();
  const password = str(formData, "password");
  const role = str(formData, "role") as Role;
  const accountKind = str(formData, "accountKind") as AccountKind;
  const companyName = str(formData, "companyName");
  const companyRegistration = str(formData, "companyRegistration");

  if (!name || !email || password.length < 6) {
    return { error: "Name, email, and a password of at least 6 characters are required." };
  }
  if (role !== "OWNER" && role !== "RENTER") {
    return { error: "Choose whether you want to rent a car or offer cars for rent." };
  }
  if (accountKind !== "INDIVIDUAL" && accountKind !== "COMPANY") {
    return { error: "Choose whether this account is for a single person or a company." };
  }
  if (accountKind === "COMPANY" && !companyName) {
    return { error: "Company name is required." };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: "An account with that email already exists." };

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      accountKind,
      companyName: accountKind === "COMPANY" ? companyName : null,
      companyRegistration: accountKind === "COMPANY" ? companyRegistration || null : null,
      ...(role === "OWNER"
        ? { ownerProfile: { create: { ownerShareBps: launchConfig.ownerShareBps } } }
        : {
            renterProfile: { create: {} },
          }),
    },
  });

  await setSession(user.id);
  redirect(role === "OWNER" ? "/owner/onboarding" : "/renter/verify");
}

export async function loginAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const email = str(formData, "email").toLowerCase();
  const password = str(formData, "password");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { error: "Invalid email or password." };

  if (!user.passwordHash) {
    // Demo users from seed: accept "password"
    if (password !== "password") return { error: "Invalid email or password. Demo tip: use password." };
  } else {
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return { error: "Invalid email or password." };
  }

  if (user.status === "BANNED") return { error: "This account is banned." };

  await setSession(user.id);
  if (user.role === "OWNER") redirect("/owner");
  if (user.role === "RENTER") redirect("/renter/bookings");
  if (user.role === "OPS") redirect("/ops");
  redirect("/admin/settings");
}

export async function logoutAction() {
  await clearSession();
  redirect("/");
}

export async function saveOwnerOnboarding(
  _prev: { error?: string; success?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const user = await requireUser(["OWNER"]);
  const phone = str(formData, "phone");
  const payoutMethodHint = str(formData, "payoutMethodHint");
  const bankAccountLast4 = str(formData, "bankAccountLast4");
  const contractType = (str(formData, "contractType") || "REVENUE_SHARE") as ContractType;

  if (!phone || !payoutMethodHint) {
    return { error: "Phone and payout method are required." };
  }
  if (bankAccountLast4 && !/^\d{4}$/.test(bankAccountLast4)) {
    return { error: "Bank last4 must be exactly 4 digits." };
  }

  if (user.accountKind === "COMPANY") {
    const companyName = str(formData, "companyName");
    if (!companyName) return { error: "Company name is required." };
    await prisma.user.update({
      where: { id: user.id },
      data: {
        companyName,
        companyRegistration: str(formData, "companyRegistration") || null,
      },
    });
  }

  await prisma.ownerProfile.upsert({
    where: { userId: user.id },
    update: {
      phone,
      payoutMethodHint,
      bankAccountLast4: bankAccountLast4 || null,
      contractType,
      onboardingDone: true,
    },
    create: {
      userId: user.id,
      phone,
      payoutMethodHint,
      bankAccountLast4: bankAccountLast4 || null,
      contractType,
      onboardingDone: true,
      ownerShareBps: launchConfig.ownerShareBps,
    },
  });

  await persistAudit({
    actorId: user.id,
    action: "owner.onboarding.saved",
    entityType: "OwnerProfile",
    entityId: user.id,
  });

  revalidatePath("/owner");
  revalidatePath("/owner/onboarding");
  return { success: "Onboarding saved. You can add vehicles now." };
}

export async function createVehicleAction(
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const user = await requireUser(["OWNER"]);
  const profile = user.ownerProfile;
  if (!profile?.onboardingDone) {
    return { error: "Complete owner onboarding before adding a vehicle." };
  }

  const make = str(formData, "make");
  const model = str(formData, "model");
  const year = num(formData, "year");
  const plate = str(formData, "plate").toUpperCase();
  const vin = str(formData, "vin") || null;
  const category = str(formData, "category");
  const seats = num(formData, "seats") || 5;
  const transmission = (str(formData, "transmission") || "AUTOMATIC") as Transmission;
  const fuelType = (str(formData, "fuelType") || "PETROL") as FuelType;
  const dailyRate = Number(str(formData, "dailyRate"));
  const mileageCapKm = str(formData, "mileageCapKm") ? num(formData, "mileageCapKm") : null;
  const maxTripDays = str(formData, "maxTripDays") ? num(formData, "maxTripDays") : null;
  const location = (str(formData, "location") || "WITH_OWNER") as VehicleLocation;
  const features = str(formData, "features");
  const photoUrl = str(formData, "photoUrl") || "/cars/placeholder.jpg";
  const registrationUrl = str(formData, "registrationUrl") || "/docs/registration.pdf";
  const submitForReview = str(formData, "submitForReview") === "on";

  if (!make || !model || !plate || !category || !year || !dailyRate) {
    return { error: "Make, model, year, plate, category, and daily rate are required." };
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      ownerId: profile.id,
      status: submitForReview ? VehicleStatus.PENDING_REVIEW : VehicleStatus.DRAFT,
      location,
      make,
      model,
      year,
      plate,
      vin,
      category,
      seats,
      transmission,
      fuelType,
      featuresJson: JSON.stringify(
        features
          ? features.split(",").map((f) => f.trim()).filter(Boolean)
          : [],
      ),
      dailyRateCents: Math.round(dailyRate * 100),
      mileageCapKm,
      maxTripDays,
      city: launchConfig.city,
      photos: {
        create: [{ url: photoUrl, isCover: true, sortOrder: 0 }],
      },
      documents: {
        create: [
          {
            type: DocumentType.REGISTRATION,
            url: registrationUrl,
            status: "PENDING",
          },
        ],
      },
    },
  });

  await persistAudit({
    actorId: user.id,
    action: "vehicle.created",
    entityType: "Vehicle",
    entityId: vehicle.id,
    meta: { status: vehicle.status },
  });

  revalidatePath("/owner/vehicles");
  revalidatePath("/ops/vehicles");
  redirect(`/owner/vehicles/${vehicle.id}`);
}

export async function updateVehicleAction(
  vehicleId: string,
  _prev: { error?: string; success?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const user = await requireUser(["OWNER"]);
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle || vehicle.ownerId !== user.ownerProfile?.id) {
    return { error: "Vehicle not found." };
  }

  const intent = str(formData, "intent");

  if (intent === "submit") {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: VehicleStatus.PENDING_REVIEW, rejectionNote: null },
    });
    await persistAudit({
      actorId: user.id,
      action: "vehicle.submitted",
      entityType: "Vehicle",
      entityId: vehicleId,
    });
    revalidatePath(`/owner/vehicles/${vehicleId}`);
    revalidatePath("/ops/vehicles");
    return { success: "Submitted for ops review." };
  }

  if (intent === "pause") {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        status: VehicleStatus.PAUSED,
        pauseReason: str(formData, "pauseReason") || "Paused by owner",
      },
    });
    revalidatePath(`/owner/vehicles/${vehicleId}`);
    return { success: "Vehicle paused." };
  }

  if (intent === "resume") {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: VehicleStatus.LIVE, pauseReason: null },
    });
    revalidatePath(`/owner/vehicles/${vehicleId}`);
    return { success: "Vehicle live again." };
  }

  if (intent === "block") {
    const startDate = new Date(str(formData, "startDate"));
    const endDate = new Date(str(formData, "endDate"));
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return { error: "Valid block dates are required." };
    }
    await prisma.vehicleBlock.create({
      data: {
        vehicleId,
        startDate,
        endDate,
        reason: str(formData, "reason") || null,
      },
    });
    revalidatePath(`/owner/vehicles/${vehicleId}`);
    return { success: "Blocked dates added." };
  }

  const dailyRate = Number(str(formData, "dailyRate"));
  await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      make: str(formData, "make") || vehicle.make,
      model: str(formData, "model") || vehicle.model,
      category: str(formData, "category") || vehicle.category,
      seats: num(formData, "seats") || vehicle.seats,
      dailyRateCents: dailyRate ? Math.round(dailyRate * 100) : vehicle.dailyRateCents,
      mileageCapKm: str(formData, "mileageCapKm")
        ? num(formData, "mileageCapKm")
        : vehicle.mileageCapKm,
      maxTripDays: str(formData, "maxTripDays")
        ? num(formData, "maxTripDays")
        : vehicle.maxTripDays,
      location: (str(formData, "location") || vehicle.location) as VehicleLocation,
    },
  });

  revalidatePath(`/owner/vehicles/${vehicleId}`);
  return { success: "Vehicle updated." };
}

export async function reviewVehicleAction(
  vehicleId: string,
  _prev: { error?: string; success?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const user = await requireUser(["OPS", "ADMIN"]);
  const decision = str(formData, "decision");
  const note = str(formData, "note");

  if (decision === "approve") {
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: VehicleStatus.LIVE, rejectionNote: null },
    });
    await prisma.vehicleDocument.updateMany({
      where: { vehicleId },
      data: { status: "APPROVED" },
    });
  } else if (decision === "reject") {
    if (!note) return { error: "Rejection note is required." };
    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status: VehicleStatus.REJECTED, rejectionNote: note },
    });
  } else {
    return { error: "Invalid decision." };
  }

  await persistAudit({
    actorId: user.id,
    action: `vehicle.${decision}`,
    entityType: "Vehicle",
    entityId: vehicleId,
    meta: { note },
  });

  revalidatePath("/ops/vehicles");
  revalidatePath("/ops/fleet");
  return { success: decision === "approve" ? "Vehicle approved." : "Vehicle rejected." };
}

export async function saveRenterVerification(
  _prev: { error?: string; success?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const user = await requireUser(["RENTER"]);
  const dateOfBirth = new Date(str(formData, "dateOfBirth"));
  const licenseNumber = str(formData, "licenseNumber");
  const licenseCountry = str(formData, "licenseCountry");
  const licenseImageUrl = str(formData, "licenseImageUrl") || "/docs/license.jpg";
  const phone = str(formData, "phone");

  if (Number.isNaN(dateOfBirth.getTime()) || !licenseNumber || !licenseCountry) {
    return { error: "Date of birth, license number, and country are required." };
  }

  const age =
    (Date.now() - dateOfBirth.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (age < launchConfig.minRenterAge) {
    return { error: `You must be at least ${launchConfig.minRenterAge}.` };
  }

  if (user.accountKind === "COMPANY") {
    const companyName = str(formData, "companyName");
    if (!companyName) return { error: "Company name is required." };
    await prisma.user.update({
      where: { id: user.id },
      data: {
        companyName,
        companyRegistration: str(formData, "companyRegistration") || null,
      },
    });
  }

  await prisma.renterProfile.upsert({
    where: { userId: user.id },
    update: {
      dateOfBirth,
      licenseNumber,
      licenseCountry,
      licenseImageUrl,
      phone: phone || null,
      verifiedAt: new Date(),
    },
    create: {
      userId: user.id,
      dateOfBirth,
      licenseNumber,
      licenseCountry,
      licenseImageUrl,
      phone: phone || null,
      verifiedAt: new Date(),
    },
  });

  revalidatePath("/renter/verify");
  return { success: "Verification saved. You can book cars now." };
}

export async function createBookingAction(
  vehicleId: string,
  _prev: { error?: string } | null,
  formData: FormData,
): Promise<{ error?: string }> {
  const user = await requireUser(["RENTER"]);
  if (!user.renterProfile?.verifiedAt) {
    return { error: "Complete driver verification before booking." };
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle || vehicle.status !== "LIVE") {
    return { error: "This vehicle is not available." };
  }

  const startAt = new Date(str(formData, "startAt"));
  const endAt = new Date(str(formData, "endAt"));
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || endAt <= startAt) {
    return { error: "Choose a valid start and end date." };
  }

  const fee =
    (await prisma.feeConfig.findUnique({ where: { city: launchConfig.city } })) ??
    launchConfig;

  const quote = quoteTrip({
    dailyRateCents: vehicle.dailyRateCents,
    startAt,
    endAt,
    config: {
      defaultDepositCents: "defaultDepositCents" in fee ? fee.defaultDepositCents : launchConfig.defaultDepositCents,
      ownerShareBps: "ownerShareBps" in fee ? fee.ownerShareBps : launchConfig.ownerShareBps,
      platformFeeBps: "platformFeeBps" in fee ? fee.platformFeeBps : launchConfig.platformFeeBps,
    },
  });

  const softHoldHours =
    "softHoldHours" in fee ? fee.softHoldHours : launchConfig.softHoldHours;

  const booking = await prisma.booking.create({
    data: {
      code: generateBookingCode(),
      status: BookingStatus.PENDING_CONFIRMATION,
      vehicleId: vehicle.id,
      renterId: user.id,
      startAt,
      endAt,
      softHoldExpiresAt: new Date(Date.now() + softHoldHours * 3600_000),
      dailyRateCents: quote.dailyRateCents,
      days: quote.days,
      baseCents: quote.baseCents,
      feesCents: quote.feesCents,
      taxCents: quote.taxCents,
      totalCents: quote.totalCents,
      depositCents: quote.depositCents,
      ownerShareBps: quote.ownerShareCents
        ? Math.round((quote.ownerShareCents / quote.baseCents) * 10_000)
        : launchConfig.ownerShareBps,
      platformFeeBps: launchConfig.platformFeeBps,
    },
  });

  await persistAudit({
    actorId: user.id,
    action: "booking.requested",
    entityType: "Booking",
    entityId: booking.id,
  });

  revalidatePath("/ops/bookings");
  revalidatePath("/renter/bookings");
  redirect(`/renter/bookings/${booking.id}`);
}

export async function cancelBookingAction(
  bookingId: string,
  _prev: { error?: string; success?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const user = await requireUser(["RENTER", "OPS", "ADMIN"]);
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return { error: "Booking not found." };
  if (user.role === "RENTER" && booking.renterId !== user.id) {
    return { error: "Not your booking." };
  }
  if (["CANCELLED", "COMPLETED", "ACTIVE", "RETURNED"].includes(booking.status)) {
    return { error: "This booking cannot be cancelled." };
  }

  const fee = await prisma.feeConfig.findUnique({ where: { city: launchConfig.city } });
  const refund = cancellationRefundCents({
    totalCents: booking.totalCents,
    startAt: booking.startAt,
    cancelFullRefundHours: fee?.cancelFullRefundHours ?? launchConfig.cancelFullRefundHours,
    tripStarted: false,
  });

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: BookingStatus.CANCELLED,
      cancelReason: str(formData, "cancelReason") || "Cancelled",
    },
  });

  if (refund > 0) {
    await prisma.ledgerEntry.create({
      data: {
        bookingId,
        type: "REFUND",
        amountCents: refund,
        currency: launchConfig.currency,
        description: "Cancellation refund",
      },
    });
  }

  await persistAudit({
    actorId: user.id,
    action: "booking.cancelled",
    entityType: "Booking",
    entityId: bookingId,
    meta: { refund },
  });

  revalidatePath(`/renter/bookings/${bookingId}`);
  revalidatePath("/ops/bookings");
  return { success: `Booking cancelled. Refund: ${(refund / 100).toFixed(2)} ${launchConfig.currency}.` };
}

export async function opsBookingAction(
  bookingId: string,
  _prev: { error?: string; success?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const user = await requireUser(["OPS", "ADMIN"]);
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { vehicle: true },
  });
  if (!booking) return { error: "Booking not found." };

  const intent = str(formData, "intent");

  if (intent === "confirm") {
    const tripPay = await mockPaymentProvider.authorize({
      amountCents: booking.totalCents,
      currency: launchConfig.currency,
      kind: "TRIP",
      bookingId,
    });
    const depositPay = await mockPaymentProvider.authorize({
      amountCents: booking.depositCents,
      currency: launchConfig.currency,
      kind: "DEPOSIT",
      bookingId,
    });

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.CONFIRMED,
          assignedOpsId: user.id,
          pickupInstructions:
            str(formData, "pickupInstructions") ||
            booking.pickupInstructions ||
            `Pickup at ${launchConfig.city} depot. Bring your license.`,
          returnInstructions:
            str(formData, "returnInstructions") || booking.returnInstructions,
        },
      }),
      prisma.vehicle.update({
        where: { id: booking.vehicleId },
        data: { status: VehicleStatus.BOOKED },
      }),
      prisma.payment.create({
        data: {
          bookingId,
          kind: "TRIP",
          status: "CAPTURED",
          amountCents: booking.totalCents,
          currency: launchConfig.currency,
          provider: tripPay.provider,
          providerRef: tripPay.providerRef,
        },
      }),
      prisma.payment.create({
        data: {
          bookingId,
          kind: "DEPOSIT",
          status: "AUTHORIZED",
          amountCents: booking.depositCents,
          currency: launchConfig.currency,
          provider: depositPay.provider,
          providerRef: depositPay.providerRef,
        },
      }),
      prisma.ledgerEntry.create({
        data: {
          bookingId,
          type: "TRIP_GROSS",
          amountCents: booking.baseCents,
          currency: launchConfig.currency,
        },
      }),
      prisma.ledgerEntry.create({
        data: {
          bookingId,
          type: "PLATFORM_FEE",
          amountCents: Math.round((booking.baseCents * booking.platformFeeBps) / 10_000),
          currency: launchConfig.currency,
        },
      }),
      prisma.ledgerEntry.create({
        data: {
          bookingId,
          ownerId: booking.vehicle.ownerId,
          type: "OWNER_SHARE",
          amountCents: Math.round((booking.baseCents * booking.ownerShareBps) / 10_000),
          currency: launchConfig.currency,
        },
      }),
    ]);

    await persistAudit({
      actorId: user.id,
      action: "booking.confirmed",
      entityType: "Booking",
      entityId: bookingId,
    });
    revalidatePath(`/ops/bookings/${bookingId}`);
    revalidatePath("/renter/bookings");
    return { success: "Booking confirmed. Payment + deposit authorized." };
  }

  if (intent === "decline") {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.DECLINED,
        cancelReason: str(formData, "note") || "Declined by ops",
      },
    });
    revalidatePath(`/ops/bookings/${bookingId}`);
    return { success: "Booking declined." };
  }

  if (intent === "instructions") {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        pickupInstructions: str(formData, "pickupInstructions") || null,
        returnInstructions: str(formData, "returnInstructions") || null,
      },
    });
    revalidatePath(`/ops/bookings/${bookingId}`);
    return { success: "Instructions updated." };
  }

  return { error: "Unknown action." };
}

export async function submitChecklistAction(
  bookingId: string,
  type: "PICKUP" | "RETURN",
  _prev: { error?: string; success?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const user = await requireUser(["RENTER"]);
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.renterId !== user.id) return { error: "Booking not found." };

  if (type === "PICKUP" && booking.status !== "CONFIRMED") {
    return { error: "Pickup is only available for confirmed bookings." };
  }
  if (type === "RETURN" && booking.status !== "ACTIVE") {
    return { error: "Return is only available for active trips." };
  }

  const odometerKm = num(formData, "odometerKm");
  const fuelLevel = num(formData, "fuelLevel");
  const notes = str(formData, "notes");

  const kinds: PhotoKind[] =
    type === "PICKUP"
      ? ["EXTERIOR_FRONT", "EXTERIOR_BACK", "INTERIOR", "ODOMETER", "FUEL"]
      : ["EXTERIOR_FRONT", "EXTERIOR_BACK", "INTERIOR", "ODOMETER", "FUEL"];

  for (const kind of kinds) {
    if (!str(formData, `photo_${kind}`)) {
      return { error: `Photo URL required for ${kind.replaceAll("_", " ").toLowerCase()}.` };
    }
  }

  await prisma.tripChecklist.upsert({
    where: {
      bookingId_type: {
        bookingId,
        type: type as ChecklistType,
      },
    },
    update: {
      odometerKm,
      fuelLevel,
      notes: notes || null,
      submittedAt: new Date(),
      photos: {
        deleteMany: {},
        create: kinds.map((kind) => ({
          kind,
          url: str(formData, `photo_${kind}`),
        })),
      },
    },
    create: {
      bookingId,
      type: type as ChecklistType,
      odometerKm,
      fuelLevel,
      notes: notes || null,
      submittedAt: new Date(),
      photos: {
        create: kinds.map((kind) => ({
          kind,
          url: str(formData, `photo_${kind}`),
        })),
      },
    },
  });

  if (type === "PICKUP") {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.ACTIVE },
    });
    await prisma.vehicle.update({
      where: { id: booking.vehicleId },
      data: { location: VehicleLocation.WITH_CLIENT },
    });
  } else {
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.RETURNED },
    });
    await prisma.vehicle.update({
      where: { id: booking.vehicleId },
      data: { location: VehicleLocation.DEPOT },
    });
  }

  await persistAudit({
    actorId: user.id,
    action: `checklist.${type.toLowerCase()}`,
    entityType: "Booking",
    entityId: bookingId,
  });

  revalidatePath(`/renter/bookings/${bookingId}`);
  revalidatePath("/ops/bookings");
  return {
    success:
      type === "PICKUP"
        ? "Pickup checklist submitted. Trip is active."
        : "Return checklist submitted. Awaiting ops inspection.",
  };
}

export async function inspectBookingAction(
  bookingId: string,
  _prev: { error?: string; success?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const actor = await requireUser(["OPS", "ADMIN"]);
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { vehicle: true, payments: true },
  });
  if (!booking) return { error: "Booking not found." };
  if (booking.status !== "RETURNED" && booking.status !== "CLAIM") {
    return { error: "Inspection is available after return." };
  }

  const intent = str(formData, "intent");
  const deposit = booking.payments.find((p) => p.kind === "DEPOSIT");

  if (intent === "release") {
    if (deposit?.providerRef) await mockPaymentProvider.release(deposit.providerRef);
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.COMPLETED },
      }),
      prisma.vehicle.update({
        where: { id: booking.vehicleId },
        data: { status: VehicleStatus.LIVE, location: VehicleLocation.DEPOT },
      }),
      ...(deposit
        ? [
            prisma.payment.update({
              where: { id: deposit.id },
              data: { status: "RELEASED" },
            }),
            prisma.ledgerEntry.create({
              data: {
                bookingId,
                type: "DEPOSIT_RELEASE",
                amountCents: booking.depositCents,
                currency: launchConfig.currency,
              },
            }),
          ]
        : []),
    ]);
    await persistAudit({
      actorId: actor.id,
      action: "booking.deposit.released",
      entityType: "Booking",
      entityId: bookingId,
    });
    revalidatePath(`/ops/bookings/${bookingId}/inspect`);
    return { success: "Deposit released. Trip completed." };
  }

  if (intent === "capture") {
    const amount = Math.round(Number(str(formData, "captureAmount")) * 100);
    if (!amount || amount <= 0) return { error: "Capture amount required." };
    if (deposit?.providerRef) {
      await mockPaymentProvider.capture(deposit.providerRef, amount);
    }
    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.COMPLETED },
      }),
      prisma.vehicle.update({
        where: { id: booking.vehicleId },
        data: {
          status: amount >= booking.depositCents ? VehicleStatus.MAINTENANCE : VehicleStatus.LIVE,
        },
      }),
      ...(deposit
        ? [
            prisma.payment.update({
              where: { id: deposit.id },
              data: { status: "CAPTURED", amountCents: amount },
            }),
            prisma.ledgerEntry.create({
              data: {
                bookingId,
                type: "DEPOSIT_CAPTURE",
                amountCents: amount,
                currency: launchConfig.currency,
                description: str(formData, "note") || "Deposit capture",
              },
            }),
          ]
        : []),
    ]);
    revalidatePath(`/ops/bookings/${bookingId}/inspect`);
    return { success: "Deposit captured and trip settled." };
  }

  if (intent === "claim") {
    const summary = str(formData, "summary");
    if (!summary) return { error: "Claim summary is required." };
    await prisma.claim.upsert({
      where: { bookingId },
      update: {
        summary,
        status: ClaimStatus.OPEN,
        estimateCents: str(formData, "estimate")
          ? Math.round(Number(str(formData, "estimate")) * 100)
          : null,
        policeReport: str(formData, "policeReport") === "on",
        evidenceUrls: JSON.stringify(
          [str(formData, "evidenceUrl")].filter(Boolean),
        ),
      },
      create: {
        bookingId,
        vehicleId: booking.vehicleId,
        summary,
        status: ClaimStatus.OPEN,
        estimateCents: str(formData, "estimate")
          ? Math.round(Number(str(formData, "estimate")) * 100)
          : null,
        policeReport: str(formData, "policeReport") === "on",
        evidenceUrls: JSON.stringify(
          [str(formData, "evidenceUrl")].filter(Boolean),
        ),
      },
    });
    await prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CLAIM },
    });
    await prisma.vehicle.update({
      where: { id: booking.vehicleId },
      data: { status: VehicleStatus.CLAIM },
    });
    revalidatePath(`/ops/bookings/${bookingId}/inspect`);
    return { success: "Claim opened." };
  }

  return { error: "Unknown inspection action." };
}

export async function createSupportTicketAction(
  _prev: { error?: string; success?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const user = await requireUser(["RENTER", "OWNER"]);
  const subject = str(formData, "subject");
  const body = str(formData, "body");
  const bookingId = str(formData, "bookingId") || null;
  const priority = (str(formData, "priority") || "NORMAL") as TicketPriority;

  if (!subject || !body) return { error: "Subject and message are required." };

  const ticket = await prisma.supportTicket.create({
    data: {
      subject,
      bookingId,
      requesterId: user.id,
      priority,
      messages: {
        create: {
          authorId: user.id,
          body,
        },
      },
    },
  });

  revalidatePath("/renter/support");
  revalidatePath("/ops/tickets");
  return { success: `Ticket ${ticket.id.slice(0, 8)} created.` };
}

export async function replyTicketAction(
  ticketId: string,
  _prev: { error?: string; success?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const user = await requireUser(["OPS", "ADMIN"]);
  const body = str(formData, "body");
  if (!body) return { error: "Reply cannot be empty." };

  await prisma.ticketMessage.create({
    data: { ticketId, authorId: user.id, body },
  });
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: {
      status: "PENDING_USER",
      assigneeId: user.id,
    },
  });

  revalidatePath("/ops/tickets");
  return { success: "Reply sent." };
}

export async function resolveTicketAction(ticketId: string) {
  await requireUser(["OPS", "ADMIN"]);
  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status: "RESOLVED" },
  });
  revalidatePath("/ops/tickets");
}

export async function saveFeeConfigAction(
  _prev: { error?: string; success?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  const user = await requireUser(["ADMIN"]);
  const city = str(formData, "city") || launchConfig.city;
  const currency = str(formData, "currency") || "USD";
  const ownerShareBps = Math.round(Number(str(formData, "ownerSharePercent")) * 100);
  const platformFeeBps = 10_000 - ownerShareBps;

  if (ownerShareBps < 0 || ownerShareBps > 10_000) {
    return { error: "Owner share must be between 0 and 100%." };
  }

  await prisma.feeConfig.upsert({
    where: { city },
    update: {
      currency,
      ownerShareBps,
      platformFeeBps,
      defaultDepositCents: Math.round(Number(str(formData, "deposit")) * 100),
      minRenterAge: num(formData, "minRenterAge") || 21,
      softHoldHours: num(formData, "softHoldHours") || 2,
      cancelFullRefundHours: num(formData, "cancelFullRefundHours") || 48,
      payoutHoldHours: num(formData, "payoutHoldHours") || 48,
    },
    create: {
      city,
      currency,
      ownerShareBps,
      platformFeeBps,
      defaultDepositCents: Math.round(Number(str(formData, "deposit")) * 100),
      minRenterAge: num(formData, "minRenterAge") || 21,
      softHoldHours: num(formData, "softHoldHours") || 2,
      cancelFullRefundHours: num(formData, "cancelFullRefundHours") || 48,
      payoutHoldHours: num(formData, "payoutHoldHours") || 48,
    },
  });

  await persistAudit({
    actorId: user.id,
    action: "feeconfig.saved",
    entityType: "FeeConfig",
    entityId: city,
  });

  revalidatePath("/admin/settings");
  return { success: "Fee settings saved for new bookings." };
}

export async function updateUserStatusAction(
  userId: string,
  _prev: { error?: string; success?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  await requireUser(["ADMIN"]);
  const status = str(formData, "status") as UserStatus;
  if (!["ACTIVE", "FLAGGED", "BANNED"].includes(status)) {
    return { error: "Invalid status." };
  }
  await prisma.user.update({ where: { id: userId }, data: { status } });
  revalidatePath("/admin/users");
  return { success: "User status updated." };
}

export async function createPayoutBatchAction(
  _prev: { error?: string; success?: string } | null,
  formData: FormData,
): Promise<{ error?: string; success?: string }> {
  void formData;
  const user = await requireUser(["OPS", "ADMIN"]);
  const pending = await prisma.ledgerEntry.findMany({
    where: { type: "OWNER_SHARE", payoutId: null },
    include: { booking: { include: { vehicle: true } } },
  });

  if (!pending.length) return { error: "No eligible owner-share ledger rows." };

  const byOwner = new Map<string, typeof pending>();
  for (const row of pending) {
    const ownerId = row.ownerId ?? row.booking?.vehicle.ownerId;
    if (!ownerId) continue;
    const list = byOwner.get(ownerId) ?? [];
    list.push(row);
    byOwner.set(ownerId, list);
  }

  const batch = await prisma.payoutBatch.create({
    data: {
      status: "PAID",
      createdById: user.id,
      paidAt: new Date(),
      notes: "MVP stub payout batch",
    },
  });

  for (const [ownerId, rows] of byOwner) {
    const amountCents = rows.reduce((sum, r) => sum + r.amountCents, 0);
    const payout = await prisma.payout.create({
      data: {
        batchId: batch.id,
        ownerId,
        amountCents,
        currency: launchConfig.currency,
        status: "PAID",
        paidAt: new Date(),
      },
    });
    await prisma.ledgerEntry.updateMany({
      where: { id: { in: rows.map((r) => r.id) } },
      data: { payoutId: payout.id },
    });
    await prisma.ledgerEntry.create({
      data: {
        ownerId,
        payoutId: payout.id,
        type: "PAYOUT",
        amountCents,
        currency: launchConfig.currency,
        description: `Payout batch ${batch.id.slice(0, 8)}`,
      },
    });
  }

  await persistAudit({
    actorId: user.id,
    action: "payout.batch.created",
    entityType: "PayoutBatch",
    entityId: batch.id,
  });

  revalidatePath("/ops/payouts");
  revalidatePath("/owner/earnings");
  return { success: `Payout batch created for ${byOwner.size} owner(s).` };
}

export async function getCurrentUserAction() {
  return getSessionUser();
}

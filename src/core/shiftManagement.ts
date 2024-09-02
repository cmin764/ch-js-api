import {
  BlockedWorker,
  HealthCareFacility,
  Prisma,
  Shift,
  ShiftAssignment,
  Worker,
} from "@prisma/client";
import { prisma } from "../prismaClient";


type Timestamps = "createdAt" | "updatedAt";
type Status<T> = {
  error?: string | unknown,
  data?: T,
};

async function shiftToFacility(shiftUuid: Shift["uuid"]): Promise<HealthCareFacility> {
  const shift = await prisma.shift.findUniqueOrThrow({
    where: {
      uuid: shiftUuid,
    },
  });
  const facility = await prisma.healthCareFacility.findUniqueOrThrow({
    where: {
      uuid: shift.facilityUuid,
    },
  });
  return facility;
}

export function listAllShifts(): Promise<Shift[]> {
  return prisma.shift.findMany();
}

export function listHealthCareFacilityShifts(
  facilityUuid: HealthCareFacility["uuid"],
): Promise<Shift[]> {
  return prisma.shift.findMany({
    where: { facilityUuid },
    include: { shiftAssignments: true },
  });
}

export function listWorkerShifts(
  workerUuid: Worker["uuid"],
): Promise<ShiftAssignment[]> {
  return prisma.shiftAssignment.findMany({
    where: { workerUuid },
    include: { shift: true },
  });
}

export function createShift(
  facilityUuid: HealthCareFacility["uuid"],
  data: Omit<Prisma.ShiftCreateInput, Timestamps>,
): Promise<Shift> {
  const createdAt = new Date();
  const updatedAt = createdAt;
  return prisma.shift.create({
    data: {
      ...data,
      facility: { connect: { uuid: facilityUuid } },
      createdAt,
      updatedAt,
    },
  });
}

export async function applyToShift(
  workerUuid: Worker["uuid"],
  shiftUuid: Shift["uuid"],
): Promise<Status<ShiftAssignment>> {
  const facility = await shiftToFacility(shiftUuid);
  const blocked = await prisma.blockedWorker.findUnique({
    where: {
      facilityUuid_workerUuid: { facilityUuid: facility.uuid, workerUuid }
    }
  });
  if (blocked)
    return {
      error: `Can't apply to shift as worker is blocked at facility` +
        ` '${facility.name}' due to reason: ${blocked.blockReason}`
    };

  try {
    const shiftAssignment = await prisma.shiftAssignment.create({
      data: {
        shift: { connect: { uuid: shiftUuid } },
        worker: { connect: { uuid: workerUuid } },
      },
    });
    return { data: shiftAssignment };
  } catch (err) {
    console.error(err);
    if (err instanceof Prisma.PrismaClientKnownRequestError)
      return {
        error: err.code === "P2002" ?
          "Worker already assigned to this shift" : err.meta?.cause
      };

    return { error: "Unknown" };
  }
}

export async function rateWorker(
  workerUuid: Worker["uuid"],
  shiftUuid: Shift["uuid"],
  rating: number,
): Promise<Status<ShiftAssignment>> {
  // Ensure the rating is a valid number withing the [1, 5] range.
  if (!(Number.isInteger(rating) && rating >= 1 && rating <= 5))
    return { error: "Invalid rating format, must be integer in range [1,5]" }

  const shiftAssignment = await prisma.shiftAssignment.update({
    where: {
      shiftUuid_workerUuid: {
        shiftUuid,
        workerUuid,
      },
    },
    data: { rating },
    include: { worker: true },
  });

  return { data: shiftAssignment };
}

export async function blockWorker(
  workerUuid: Worker["uuid"],
  shiftUuid: Shift["uuid"],
  blockReason: string,
): Promise<Status<BlockedWorker>> {
  const shiftAssignment = await prisma.shiftAssignment.findUnique({
    where: {
      shiftUuid_workerUuid: {
        shiftUuid,
        workerUuid,
      },
    },
  });
  if (shiftAssignment == null)
    return { error: "Can't block worker that didn't take this shift" };

  const facility = await shiftToFacility(shiftUuid);
  try {
    const blocked = await prisma.blockedWorker.create({
      data: {
        facilityUuid: facility.uuid,
        shiftUuid,
        workerUuid,
        blockReason,
        createdAt: new Date(),
      },
      include: { worker: true, facility: true }
    });
    return { data: blocked };
  } catch (err) {
    console.error(err);
    if (err instanceof Prisma.PrismaClientKnownRequestError)
      return {
        error: err.code === "P2002" ?
          "Worker already blocked at this facility" : err.meta?.cause
      };

    return { error: "Unknown" };
  }
}

import express from "express";
import "express-async-errors";
import {
  createHealthCareFacility,
  listHealthCareFacilities,
} from "../../core/facilityManagement";
import {
  applyToShift,
  blockWorker,
  createShift,
  listAllShifts,
  listHealthCareFacilityShifts,
  listWorkerShifts,
  rateWorker,
} from "../../core/shiftManagement";
import { createWorker, listWorkers } from "../../core/workerManagement";

export const v1 = express();

v1.get("/", (req, res) => {
  res.send(JSON.stringify({ status: "ok" }));
});

// Facilities
const facilitiesBase = "/facilities";
v1.get(facilitiesBase, async (req, res) => {
  const facilities = await listHealthCareFacilities();
  res.send(JSON.stringify({ facilities }));
});

v1.post(facilitiesBase, async (req, res) => {
  const facility = await createHealthCareFacility(req.body);
  res.send(JSON.stringify(facility));
});

v1.get(`${facilitiesBase}/:uuid/shifts`, async (req, res) => {
  const shifts = await listHealthCareFacilityShifts(req.params.uuid);
  res.send(JSON.stringify({ shifts }));
});

v1.post(`${facilitiesBase}/:uuid/shifts`, async (req, res) => {
  const shift = await createShift(
    req.params.uuid,
    req.body,
  );
  res.send(JSON.stringify(shift));
});

// Workers
const workersBase = "/workers";
v1.get(workersBase, async (req, res) => {
  const workers = await listWorkers();
  res.send(JSON.stringify({ workers }));
});

v1.post(workersBase, async (req, res) => {
  const worker = await createWorker(req.body);
  res.send(JSON.stringify(worker));
});

v1.get(`${workersBase}/:uuid/shifts`, async (req, res) => {
  const shiftAssignments = await listWorkerShifts(req.params.uuid);
  res.send(JSON.stringify({ shiftAssignments }));
});

v1.post(`${workersBase}/:uuid/shifts`, async (req, res) => {
  const shift = await applyToShift(
    req.params.uuid,
    req.body.shiftUuid,
  );
  res.send(JSON.stringify(shift));
});

// Shifts
const shiftsBase = "/shifts";
v1.get(shiftsBase, async (req, res) => {
  const shifts = await listAllShifts();
  res.send(JSON.stringify({ shifts }));
});

// Ratings
v1.post("/rate-worker", async (req, res) => {
  const { workerUuid, shiftUuid, rating } = req.body;
  const shiftAssignment = await rateWorker(workerUuid, shiftUuid, rating);
  res.send(JSON.stringify({ shiftAssignment }));
});

// Block workers
v1.post("/block-worker", async (req, res) => {
  const { workerUuid, shiftUuid, blockReason } = req.body;
  const result = await blockWorker(workerUuid, shiftUuid, blockReason);
  res.send(JSON.stringify(result));
});

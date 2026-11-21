
const express = require("express");

const {
  createBus,
  getAllBuses,
  updateBus,
  deleteBus,
  createNotice,
  getAllNotices,
  getAllExtraBusRequests,

  getPendingVerifications,
  getVerificationIdCard,
  approveUserVerification,
  rejectUserVerification,
} = require("../controllers/admin.controller.js");

const {
  verifyAdminToken,
} = require("../middlewares/admin.auth.middleware.js");

const router = express.Router();

// All routes are Admin Only
router.use(verifyAdminToken);

// ==============================
// BUS ROUTES
// ==============================

router.post("/bus", createBus);
router.get("/buses", getAllBuses);
router.put("/bus/:id", updateBus);
router.delete("/bus/:id", deleteBus);

// ==============================
// NOTICE ROUTES
// ==============================

router.post("/notice", createNotice);
router.get("/notices", getAllNotices);

// ==============================
// EXTRA BUS REQUEST
// ==============================

router.get("/extra-bus-requests", getAllExtraBusRequests);

// ==============================
// UNIVERSITY ID VERIFICATION
// ==============================

router.get(
  "/verifications",
  getPendingVerifications
);

router.get(
  "/verifications/:userId/id-card",
  getVerificationIdCard
);

router.put(
  "/verifications/:userId/approve",
  approveUserVerification
);

router.put(
  "/verifications/:userId/reject",
  rejectUserVerification
);

module.exports = router;

const express = require("express");
const { verifyFirebaseToken } = require("../middlewares/auth.middleware.js");
const {
  createExtraBusRequest,
} = require("../controllers/extraBusRequest.controller.js");

const router = express.Router();

// Student authentication
router.post("/", verifyFirebaseToken, createExtraBusRequest);

module.exports = router;

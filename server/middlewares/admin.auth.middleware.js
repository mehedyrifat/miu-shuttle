
const admin = require("../config/firebaseAdmin");

// শুধুমাত্র এই Gmail অ্যাডমিন হবে
const ADMIN_EMAIL = "mehidyrifat794@gmail.com";

async function verifyAdminToken(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = await admin.auth().verifyIdToken(token);

    // Gmail এবং Admin Claim চেক
    if (decoded.email !== ADMIN_EMAIL || decoded.admin !== true) {
      return res.status(403).json({
        message: "Forbidden: Requires admin access",
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
}

module.exports = { verifyAdminToken };

function requireAuth(req, res, next) {
  if (!req.authUser) {
    return res.status(401).json({ error: "Silakan login dulu." });
  }
  next();
}

module.exports = { requireAuth };

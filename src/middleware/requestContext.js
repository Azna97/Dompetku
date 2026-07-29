const { SESSION_COOKIE } = require("../services/coreService");
const {
  cleanupExpiredSessions,
  parseCookies,
  getAuthUserBySessionId
} = require("../services/authService");

async function attachRequestContext(req, res, next) {
  try {
    try {
      await cleanupExpiredSessions();
    } catch (error) {
      console.warn("Session cleanup skipped:", error.message);
    }
    req.cookies = parseCookies(req);
    req.sessionId = req.cookies[SESSION_COOKIE] || null;
    req.authUser = await getAuthUserBySessionId(req.sessionId);
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { attachRequestContext };

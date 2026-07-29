const { getFullState } = require("../services/stateService");

async function getState(req, res, next) {
  try {
    res.json(await getFullState(req.authUser.id));
  } catch (error) { next(error); }
}

module.exports = { getState };

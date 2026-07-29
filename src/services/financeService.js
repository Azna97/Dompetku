const core = require("./coreService");
const auth = require("./authService");
const state = require("./stateService");
const response = require("./responseService");

module.exports = {
  ...core,
  ...auth,
  ...state,
  ...response
};

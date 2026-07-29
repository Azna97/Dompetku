const app = require("./app");
const core = require("./services/coreService");

function startServer() {
  core.startBackupScheduler();
  app.listen(core.PORT, core.HOST, () => {
    const urls = [`http://localhost:${core.PORT}`, ...core.getLocalNetworkUrls(core.PORT)];
    console.log(`DompetKu server running on ${core.HOST}:${core.PORT}`);
    urls.forEach((url) => console.log(`Akses: ${url}`));
  });
}

module.exports = { startServer };


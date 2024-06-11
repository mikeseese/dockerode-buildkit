const path = require("path");
const Docker = require("dockerode");

(async () => {
  const docker = new Docker();

  const pullStream = await docker.pull("alpine:latest");

  console.log("Pulling alpine:latest...");

  await new Promise((resolve, reject) => {
    docker.modem.followProgress(pullStream, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    }, (progress) => {
      if (progress.errorDetail?.message) {
        console.error(`ERROR: ${progress.errorDetail.message}`);
      }
    });
  });

  const buildStream = await docker.buildImage({
    context: process.cwd(),
    src: ["Dockerfile", "hello.txt"],
  }, { version: "2" });

  console.log("Building ./Dockerfile...");

  let imageBuilt = false;
  await new Promise((resolve, reject) => {
    docker.modem.followProgress(buildStream, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    }, (progress) => {
      if (progress.errorDetail?.message) {
        console.error(`ERROR: ${progress.errorDetail.message}`);
      } else if (progress.id === "moby.image.id") {
        imageBuilt = true;
        console.log(`Built image: ${progress.aux.ID}`);
      }
    });
  });

  if (!imageBuilt) {
    console.error("ERROR: Failed to build image");
    return;
  }
})();
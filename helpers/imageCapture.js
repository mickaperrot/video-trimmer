const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const util = require("util");

module.exports = {
    captureImages: async function (localFile, scenes) {
        let imageBaseName = path.parse(localFile).name;

        try {
            for (scene of scenes) {
                console.log("creating screenshot for scene: ", +scene);
                await createScreenshot(localFile, imageBaseName, scene);
            }
        } catch (error) {
            console.log("error gathering screenshots: ", error);
        }

        console.log("finished gathering the screenshots");
        return imageBaseName; // return the base filename for each image
    }
};

async function createScreenshot(localFile, imageBaseName, scene) {
    return new Promise((resolve, reject) => {
        ffmpeg(localFile)
            .screenshots({
                timestamps: [scene],
                filename: `${imageBaseName}-${scene}.png`,
                folder: "output",
                size: "320x240"
            })
            .on("error", () => {
                console.log(
                    "Failed to create scene for timestamp: " + scene
                );
                return reject(
                    "Failed to create scene for timestamp: " + scene
                );
            })
            .on("end", () => {
                return resolve();
            });
    });
}
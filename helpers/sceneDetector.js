const fs = require("fs");
const util = require("util");
const readFile = util.promisify(fs.readFile);
const ffmpeg = require("fluent-ffmpeg");

const Video = require("@google-cloud/video-intelligence");
const client = new Video.VideoIntelligenceServiceClient();

module.exports = {
    detectSceneChanges: async function (downloadedFile) {
        // Reads a local video file and converts it to base64
        const file = await readFile(downloadedFile);
        const inputContent = file.toString("base64");

        // setup request for shot change detection
        const videoContext = {
            speechTranscriptionConfig: {
                languageCode: "en-US",
                enableAutomaticPunctuation: true
            }
        };

        const request = {
            inputContent: inputContent,
            features: ["SHOT_CHANGE_DETECTION"]
        };

        // Detects camera shot changes
        const [operation] = await client.annotateVideo(request);
        console.log("Shot (scene) detection in progress...");
        const [operationResult] = await operation.promise();

        // Gets shot changes
        const shotChanges =
            operationResult.annotationResults[0].shotAnnotations;

        console.log(
            "Shot (scene) changes detected: " + shotChanges.length
        );

        // data structure to be returned
        let sceneChanges = [];

        // for the initial scene
        sceneChanges.push(1);

        // if only one scene, keep at 1 second
        if (shotChanges.length === 1) {
            return sceneChanges;
        }

        // get length of video
        const videoLength = await getVideoLength(downloadedFile);

        shotChanges.forEach((shot, shotIndex) => {
            if (shot.endTimeOffset === undefined) {
                shot.endTimeOffset = {};
            }
            if (shot.endTimeOffset.seconds === undefined) {
                shot.endTimeOffset.seconds = 0;
            }
            if (shot.endTimeOffset.nanos === undefined) {
                shot.endTimeOffset.nanos = 0;
            }

            // convert to a number
            let currentTimestampSecond = Number(
                shot.endTimeOffset.seconds
            );

            let sceneChangeTime = 0;
            // double-check no scenes were detected within the last second
            if (currentTimestampSecond + 1 > videoLength) {
                sceneChangeTime = currentTimestampSecond;
            } else {
                // otherwise, for simplicity, just round up to the next second
                sceneChangeTime = currentTimestampSecond + 1;
            }

            sceneChanges.push(sceneChangeTime);
        });

        return sceneChanges;
    }
};

async function getVideoLength(localFile) {
    let getLength = util.promisify(ffmpeg.ffprobe);
    let length = await getLength(localFile);

    console.log("video length: ", length.format.duration);
    return length.format.duration;
}
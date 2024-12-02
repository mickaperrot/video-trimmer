const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const util = require("util");

module.exports = {
    getVideoClips: async function (localFile, splitDuration) {
        let videoDuration;
        try {
            videoDuration = await getVideoDuration(localFile);
            console.log("Video duration: " + videoDuration);
        } catch (error) {
            console.log("error gathering video metadata: ", error);
        }
        splitDuration = 60
        const sequences = getSequences(videoDuration,splitDuration);

        //console.log('Sequences:' + sequences);
        let promises = [];

        try {
            for(let i = 0; i < sequences.length; i++){
                //console.log('Working on sequence start:' + sequences[i]);
                promises.push(getVideoClip(localFile, sequences[i], i+1));
            }
        }
        catch (error) {
            console.log(error);
        }

        await Promise.all(promises);
        console.log('All clips processed');
        return;
        /*let imageBaseName = path.parse(localFile).name;

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
        */
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
};

async function getVideoDuration(localFile) {
    return new Promise((resolve, reject) => {
        ffmpeg(localFile)
            .ffprobe(function(err,metadata){
                //console.log("Video duration: " + metadata.streams[0].duration);
                resolve(metadata.streams[0].duration);
            })/*
            .on("error", (err) => {
                console.log(
                    "Failed to get video duration: " + err
                );
                return reject(
                    "Failed to get video duration: " + err
                );
            })
            .on("end", (metadata) => {
                console.log(metadata);
                return resolve();
            })*/;
    });
}
/*
function getSequences(duration,splitDuration){
    let remainingDuration = duration;
    let lowerBound = 0;
    let sequences = [];
    while (remainingDuration > 0){
        const sequenceDuration = Math.min(remainingDuration, splitDuration);
        const upperBound = lowerBound + sequenceDuration;
        //sequences.push([lowerBound,upperBound]);
        sequences.push({
            'startTime': lowerBound,
            'duration': sequenceDuration
            }
        );
        //console.log('Sequence start time: ' + lowerBound + ' duration: ' + sequenceDuration);
        //sequences.push(upperBound);
        lowerBound = upperBound;
        remainingDuration -= sequenceDuration;
    }
    return sequences;
}
*/

async function getVideoClip(localFile,sequence) {
    //console.log('Working on sequence start:' + sequence.startTime);
    return new Promise((resolve, reject) => {
        const inputFile = path.parse(localFile).name;
        const outputFile = path.parse(localFile).name + '-' + sequence.sequenceNumber + ".mp4";
        const clipEnd = sequence.startTime + sequence.duration;
        console.log("Extracting clip for " + inputFile + " from " + sequence.startTime + " to " + clipEnd);
        ffmpeg(localFile)
            .setStartTime(sequence.startTime)
            .setDuration(sequence.duration)
            .on("error", () => {
                console.log(
                    "Failed to create scene for timestamp: "
                );
                return reject(
                    "Failed to create scene for timestamp: "
                );
            })
            .on("end", () => {
                console.log('Successfuly written: ' + outputFile);
                return resolve();
            })
            .saveToFile(outputFile);
    });
}
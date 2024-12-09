const ffmpeg = require("fluent-ffmpeg");
const path = require("path");

module.exports = {
    getVideoDuration: async function (localFile) {
        return new Promise((resolve, reject) => {
            ffmpeg(localFile)
                .ffprobe(function(err, metadata){
                    resolve(metadata.streams[0].duration);
                })
            ;
        });
    },
    getVideoClip: async function (localFile,sequence) {
        return new Promise((resolve, reject) => {
            const inputFile = path.parse(localFile).name;
            const outputFile = path.parse(localFile).name + '-' + sequence.sequenceNumber + ".mp4";
            const clipEnd = sequence.startTime + sequence.duration;
            console.log("Extracting clip for " + inputFile + " from " + sequence.startTime + " to " + clipEnd);
            ffmpeg(localFile)
                .setStartTime(sequence.startTime)
                .setDuration(sequence.duration)
                .on("error", (err) => {
                    console.log(
                        "Failed to extract clip: "
                    );
                    console.log(err);
                    return reject(err);
                })
                .on("end", () => {
                    console.log('Successfuly extracted: ' + outputFile);
                    return resolve(outputFile);
                })
                .saveToFile(outputFile);
        });
    }
}
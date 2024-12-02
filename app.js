const path = require("path");

const storageHelper = require("./helpers/storage.js");
const ffmpegHelper = require("./helpers/ffmpeg.js");

const fs = require("fs").promises;

console.log('Bucket: ' + process.env.BUCKET_NAME);

const main = async () => {

    try {
        const bucketName = process.env.BUCKET_NAME;
        const videoFilename = process.env.VIDEO_FILENAME;
        const splitDuration = process.env.SPLIT_DURATION;
        const inputDir = process.env.INPUT_DIR;
        const outputDir = process.env.OUTPUT_DIR + splitDuration;

        // download the file to locally to the Cloud Run Job instance
        let localFilename = await storageHelper.downloadVideoFile(
            bucketName,
            videoFilename
        );

        let videoDuration;
        try {
            videoDuration = await ffmpegHelper.getVideoDuration(localFilename);
            console.log("Video duration: " + videoDuration);
        } catch (error) {
            console.log("error gathering video metadata: ", error);
        }

        let remainingDuration = videoDuration;
        let sequenceStart = 0;
        let sequences = [];
        let i = 1;
        while (remainingDuration > 0){
            const sequenceDuration = Math.min(remainingDuration, splitDuration);
            sequences.push({
                'startTime': sequenceStart,
                'duration': sequenceDuration,
                'sequenceNumber': i
                }
            );
            sequenceStart += sequenceDuration;
            remainingDuration -= sequenceDuration;
            i++;
        }

        console.log('Sequences: ');
        console.log(sequences);

        sequences.map(function(sequence){
            ffmpegHelper.getVideoClip(localFilename, sequence)
                .then(function(outputFile){
                    storageHelper.uploadVideoFile(
                        bucketName,
                        path.dirname(videoFilename).replace(inputDir, outputDir) + '/' + outputFile
                    );
                });
        });
    } catch (error) {
        //return an error
        console.error("received error: ", error);
    }
};

// Start script
main().catch((err) => {
    console.error(err);
});
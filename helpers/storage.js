const { Storage } = require("@google-cloud/storage");

module.exports = {
    downloadVideoFile: async function (bucketName, videoFilename) {
        // Creates a client
        const storage = new Storage();

        // keep same name locally
        let localFilename = videoFilename;

        const options = {
            destination: localFilename
        };

        // Download the file
        await storage
            .bucket(bucketName)
            .file(videoFilename)
            .download(options);

        console.log(
            `gs://${bucketName}/${videoFilename} downloaded locally to ${localFilename}.`
        );

        return localFilename;
    }
};
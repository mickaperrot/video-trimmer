const { Storage } = require("@google-cloud/storage");
const path = require("path");

module.exports = {
    downloadVideoFile: async function (bucketName, videoFilename) {
        // Creates a client
        const storage = new Storage();

        // keep same name locally
        let localFilename = path.basename(videoFilename);

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
    },
    uploadVideoFile: async function (bucketName, destinationFilename) {
        // Creates a client
        const storage = new Storage();

        // keep same name locally
        let localFilename = path.basename(destinationFilename);

        const options = {
            destination: destinationFilename
        };

        // Upload the file
        await storage
            .bucket(bucketName)
            .upload(localFilename ,options);

        console.log(
            `${localFilename} uploaded to gs://${bucketName}/${destinationFilename}.`
        );

        return;
    }
};
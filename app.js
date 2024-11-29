const bucketName = "mickael-canal-genai-poc";
const videoFilename = "testvideo.mp4";

const { captureImages } = require("./helpers/imageCapture.js");
const { detectSceneChanges } = require("./helpers/sceneDetector.js");
const { getImageCaption } = require("./helpers/imageCaptioning.js");
const storageHelper = require("./helpers/storage.js");
const authHelper = require("./helpers/auth.js");

const fs = require("fs").promises;
const path = require("path");

const main = async () => {

    try {

        // download the file to locally to the Cloud Run Job instance
        let localFilename = await storageHelper.downloadVideoFile(
            bucketName,
            videoFilename
        );

        // PART 1 - Use Video Intelligence API
        // detect all the scenes in the video & save timestamps to an array

        // EXAMPLE OUTPUT
        // Detected scene changes at the following timestamps:
        // [1, 7, 11, 12]
        let timestamps = await detectSceneChanges(localFilename);
        console.log(
            "Detected scene changes at the following timestamps: ",
            timestamps
        );

        // PART 2 - Use ffmpeg via dockerfile install
        // create an image of each scene change
        // and save to a local directory called "output"
        // returns the base filename for the generated images

        // EXAMPLE OUTPUT
        // creating screenshot for scene:  1 at output/video-filename-1.png
        // creating screenshot for scene:  7 at output/video-filename-7.png
        // creating screenshot for scene:  11 at output/video-filename-11.png
        // creating screenshot for scene:  12 at output/video-filename-12.png
        // returns the base filename for the generated images
        let imageBaseName = await captureImages(localFilename, timestamps);

        // PART 3a - get Access Token to call Vertex AI APIs via REST
        // needed for the image captioning
        // since we're calling the Vertex AI APIs directly
        let accessToken = await authHelper.getAccessToken();
        console.log("got an access token");

        // PART 3b - use Image Captioning to describe each scene per screenshot
        // EXAMPLE OUTPUT
        /*
        [
            {
                timestamp: 1,
                description:
                    "an aerial view of a city with a bridge in the background"
            },
            {
                timestamp: 7,
                description:
                    "a man in a blue shirt sits in front of shelves of donuts"
            },
            {
                timestamp: 11,
                description:
                    "a black and white photo of people working in a bakery"
            },
            {
                timestamp: 12,
                description:
                    "a black and white photo of a man and woman working in a bakery"
            }
        ]; */

        // instantiate the data structure for storing the scene description and timestamp
        // e.g. an array of json objects,
        // [{ timestamp: 5, description: "..." }, ...]
        let scenes = [];

        // for each timestamp, send the image to Vertex AI
        console.log("getting Vertex AI description for each timestamps");
        scenes = await Promise.all(
            timestamps.map(async (timestamp) => {
                let filepath = path.join(
                    "./output",
                    imageBaseName + "-" + timestamp + ".png"
                );

                // get the base64 encoded image bc sending via REST
                const encodedFile = await fs.readFile(filepath, "base64");

                // send each screenshot to Vertex AI for description
                let description = await getImageCaption(
                    accessToken,
                    encodedFile
                );

                return { timestamp: timestamp, description: description };
            })
        );

        console.log("finished collecting all the scenes");
        console.log(scenes);
    } catch (error) {
        //return an error
        console.error("received error: ", error);
    }
};

// Start script
main().catch((err) => {
    console.error(err);
});
const axios = require("axios");
const { GoogleAuth } = require("google-auth-library");

const auth = new GoogleAuth({
    scopes: "https://www.googleapis.com/auth/cloud-platform"
});

module.exports = {
    getImageCaption: async function (token, encodedFile) {
        // this example shows you how to call the Vertex REST APIs directly
        // https://cloud.google.com/vertex-ai/generative-ai/docs/image/image-captioning#get-captions-short
        // https://cloud.google.com/vertex-ai/generative-ai/docs/model-reference/image-captioning

        let projectId = await auth.getProjectId();

        let config = {
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json; charset=utf-8"
            }
        };

        const json = {
            "instances": [
                {
                    "image": {
                        "bytesBase64Encoded": encodedFile
                    }
                }
            ],
            "parameters": {
                "sampleCount": 1,
                "language": "en"
            }
        };

        let response = await axios.post(
            "https://us-central1-aiplatform.googleapis.com/v1/projects/" +
                projectId +
                "/locations/us-central1/publishers/google/models/imagetext:predict",
            json,
            config
        );

        return response.data.predictions[0];
    }
};
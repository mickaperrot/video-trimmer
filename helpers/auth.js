const { GoogleAuth } = require("google-auth-library");

const auth = new GoogleAuth({
    scopes: "https://www.googleapis.com/auth/cloud-platform"
});

module.exports = {
    getAccessToken: async function () {
        return await auth.getAccessToken();
    }
};
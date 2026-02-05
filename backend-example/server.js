const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET;
const LINKEDIN_REDIRECT_URI = "http://localhost:3000"; // Frontend URL
const GEMINI_API_KEY = process.env.API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

app.post('/auth/linkedin/callback', async (req, res) => {
    const { code } = req.body;

    try {
        // 1. Exchange code for access token
        const tokenResponse = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
            params: {
                grant_type: 'authorization_code',
                code,
                client_id: LINKEDIN_CLIENT_ID,
                client_secret: LINKEDIN_CLIENT_SECRET,
                redirect_uri: LINKEDIN_REDIRECT_URI,
            },
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const accessToken = tokenResponse.data.access_token;

        // 2. Fetch Profile Data
        const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        // 3. (Opsiyonel) LinkedIn'den ham veriyi alıp Gemini ile JSON'a dönüştür
        // Burada model.generateContent kullanarak frontend'deki parseProfileData mantığını sunucuda yapabilirsiniz.
        
        res.json({
            header: {
                name: `${profileResponse.data.localizedFirstName} ${profileResponse.data.localizedLastName}`,
                email: "fetched-via-email-endpoint@linkedin.com"
            },
            experience: [], // LinkedIn API'den gelen diğer veriler...
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "LinkedIn Auth Error" });
    }
});

app.listen(5000, () => console.log("Server running on port 5000"));
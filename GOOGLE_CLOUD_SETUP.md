# Google Cloud Speech-to-Text Setup Guide

This guide will walk you through setting up Google Cloud Speech-to-Text API for voice input in your Boogie app.

## Prerequisites

- A Google account
- A credit card (for verification, though free tier is generous)
- Node.js and npm installed

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click on the project dropdown at the top
4. Click **"New Project"**
5. Enter project name: `boogie-speech` (or any name you prefer)
6. Click **"Create"**
7. Wait for the project to be created, then select it from the dropdown

## Step 2: Enable Speech-to-Text API

1. In the Google Cloud Console, go to **"APIs & Services"** > **"Library"**
2. Search for **"Cloud Speech-to-Text API"**
3. Click on **"Cloud Speech-to-Text API"**
4. Click **"Enable"**
5. Wait for the API to be enabled (may take a minute)

## Step 3: Create API Credentials

1. Go to **"APIs & Services"** > **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"API key"**
4. Your API key will be created and displayed
5. **Important**: Copy this API key immediately - you won't be able to see it again!
6. Click **"Restrict Key"** (recommended for security):
   - Under **"API restrictions"**, select **"Restrict key"**
   - Check **"Cloud Speech-to-Text API"**
   - Click **"Save"**

## Step 4: Set Up Billing (Required for API usage)

**Note**: Google requires a billing account even for free tier usage, but you won't be charged unless you exceed the free tier.

1. Go to **"Billing"** in the left sidebar
2. Click **"Link a billing account"** or **"Create billing account"**
3. Fill in your billing information
4. Google will verify your account (may take a few minutes)

## Step 5: Understand the Free Tier

Google Cloud Speech-to-Text offers:
- **Free tier**: First 60 minutes per month free
- **After free tier**: $0.006 per 15 seconds of audio
- For a typical ride booking conversation (30-60 seconds), you'd use about 1-2 minutes per session

**Cost estimate**: 
- ~30 ride bookings per month = free
- 100 bookings/month = ~$0.12/month
- Very affordable for development and small-scale use

## Step 6: Add API Key to Your Project

1. In your Boogie project root directory, create a `.env` file:
   ```bash
   touch .env
   ```

2. Add your API key to the `.env` file:
   ```
   EXPO_PUBLIC_GOOGLE_SPEECH_API_KEY=your_api_key_here
   ```

3. **Important**: Make sure `.env` is in your `.gitignore` (it should be already)

4. Restart your Expo development server:
   ```bash
   npm start
   ```

## Step 7: Test the Setup

1. Start your app: `npm start`
2. Navigate to the Voice Input screen
3. Tap the microphone button
4. Speak your destination
5. The audio should be transcribed using Google Cloud Speech-to-Text

## Troubleshooting

### "API key not valid" error
- Make sure you copied the entire API key
- Check that the API key is not restricted incorrectly
- Verify the API key is enabled in the Google Cloud Console

### "Billing account required" error
- Make sure you've set up billing in Google Cloud Console
- Wait a few minutes after setting up billing for it to activate

### "Quota exceeded" error
- You've used your free 60 minutes for the month
- Check usage in Google Cloud Console > APIs & Services > Dashboard
- Wait until next month or upgrade your quota

### "Permission denied" error
- Make sure Cloud Speech-to-Text API is enabled
- Check that your API key has the correct permissions

## Monitoring Usage

To monitor your API usage:

1. Go to Google Cloud Console
2. Navigate to **"APIs & Services"** > **"Dashboard"**
3. Select **"Cloud Speech-to-Text API"**
4. View your usage metrics and quotas

## Security Best Practices

1. **Restrict your API key**:
   - Only allow Cloud Speech-to-Text API
   - Add HTTP referrer restrictions if deploying to web
   - Add IP restrictions for production

2. **Set up billing alerts**:
   - Go to **"Billing"** > **"Budgets & alerts"**
   - Create a budget alert to notify you if spending exceeds a threshold

3. **Rotate keys regularly**:
   - Create new API keys periodically
   - Revoke old keys that are no longer in use

## Alternative: Using Service Account (More Secure)

For production apps, consider using a service account instead of an API key:

1. Go to **"IAM & Admin"** > **"Service Accounts"**
2. Create a new service account
3. Grant it the **"Cloud Speech-to-Text API User"** role
4. Download the JSON key file
5. Store it securely (never commit to git!)
6. Use it in your backend server (not in the mobile app)

## Cost Optimization Tips

1. **Use shorter audio clips**: Only send the necessary audio
2. **Cache common phrases**: Store frequently used locations
3. **Use streaming API**: For real-time transcription (more efficient)
4. **Monitor usage**: Set up alerts to avoid unexpected charges

## Next Steps

Once you have the API key set up, you'll need to implement the integration code. The implementation would:

1. Record audio using `expo-av`
2. Convert audio to base64 or send as file
3. Make HTTP POST request to Google Cloud Speech-to-Text API
4. Process the transcription result
5. Handle errors gracefully

Would you like me to help implement the code integration once you have your API key set up?

## Resources

- [Google Cloud Speech-to-Text Documentation](https://cloud.google.com/speech-to-text/docs)
- [Pricing Information](https://cloud.google.com/speech-to-text/pricing)
- [API Reference](https://cloud.google.com/speech-to-text/docs/reference/rest)
- [Free Tier Details](https://cloud.google.com/free/docs/free-cloud-features)

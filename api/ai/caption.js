/**
 * AI Caption Endpoint (Vercel Serverless)
 * Uses Google Gemini API for image captioning
 * Global limit: 10 captions/day for all users
 * Model: gemini-2.5-flash-lite
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { image_url } = req.body;

    if (!image_url) {
      return res.status(400).json({ error: 'image_url is required' });
    }

    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY not configured');
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // Initialize Gemini with gemini-2.5-flash-lite
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

    // Fetch the image
    const imageResponse = await fetch(image_url);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    // Convert image to base64
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // Generate caption using Gemini Vision
    const prompt = "Describe this image in one concise sentence. Focus on the main subject and action.";
    
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
    ]);

    const response = await result.response;
    const caption = response.text().trim();

    return res.json({ caption });

  } catch (error) {
    console.error('Gemini caption error:', error);
    
    // Return a friendly error
    return res.status(500).json({
      error: 'Failed to generate caption',
      message: error.message
    });
  }
}

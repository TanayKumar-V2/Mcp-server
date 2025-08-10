// index.js - AI Content Assistant MCP Server

// 1. Import Dependencies
import express from 'express';
import { McpExpress } from '@model-context/server/express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import 'dotenv/config'; // Loads environment variables from .env file

// 2. Initialize Express App and Dependencies
const app = express();
const port = process.env.PORT || 3000;

// Get Gemini API key from environment variables
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error("Error: GEMINI_API_KEY is not set in the environment.");
  process.exit(1); // Exit if the key is not found
}
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


// 3. Initialize the MCP Server
const mcp = new McpExpress({
  name: 'AI Content Assistant',
  description: 'A powerful assistant to help you brainstorm and structure articles, blog posts, and essays.',
});

// 4. Define the `generateContentOutline` Tool
mcp.tool(
  'generateContentOutline',
  {
    description: 'Takes a topic and generates a detailed, structured outline for a blog post or essay. Perfect for overcoming writer\'s block.',
    // Use Zod to define the expected input: an object with a 'topic' string.
    input: z.object({
      topic: z.string().describe('The main topic or title of the content you want to write. For example: "the future of artificial intelligence".'),
    }),
    // The output will be a single string containing the formatted outline.
    output: z.object({
      outline: z.string().describe('The formatted, multi-level content outline.'),
    }),
  },
  // This is the handler function that runs when the tool is called.
  async (input) => {
    try {
      // Craft a detailed prompt for the Gemini model.
      // This is the "secret sauce" of our tool.
      const prompt = `
        You are an expert content strategist and editor.
        A user wants to write a blog post about the following topic: "${input.topic}".

        Your task is to generate a comprehensive, well-structured content outline for this blog post.
        The outline should be logical, flow well, and cover the key aspects of the topic.
        Use a multi-level format with headings and bullet points.

        Example Structure:
        I. Introduction
           - Hook: Start with a compelling statistic or question.
           - Briefly introduce the topic and its importance.
           - State the main argument or what the reader will learn.
        II. Main Point 1
           - Sub-point A
           - Sub-point B
        III. Main Point 2
           - Sub-point A
           - Sub-point B
        IV. Conclusion
           - Summarize the key points.
           - Offer a final thought or call to action.

        Generate the outline now for the topic: "${input.topic}"
      `;

      // Call the Gemini API
      const result = await model.generateContent(prompt);
      const response = result.response;
      const outlineText = response.text();

      // Return the generated text in the format expected by our output schema.
      return { outline: outlineText };

    } catch (error) {
      console.error('Error calling Gemini API:', error);
      throw new Error('There was an issue contacting the AI content strategist.');
    }
  },
);

// 5. Attach MCP to Express and Start the Server
app.use('/mcp', mcp.router);

app.get('/', (req, res) => {
  res.send('AI Content Assistant MCP Server is running and ready to help!');
});

app.listen(port, () => {
  console.log(`Server is live on port ${port}`);
});

import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post("/ai-suggestion", async (req, res) => {
    try {
        const { documentText } = req.body;
        console.log("Received text from frontend:", documentText); // Debugging

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

        const response = await model.generateContent({
            contents: [{
                role: "user",
                parts: [{
                    text:  `Improve the following text by correcting grammar and spelling mistakes. Return only the improved text without any additional comments, explanations, or formatting:

                    ${documentText}`
                }]
            }]
        });
        
        const suggestion = await response.response.text();


        res.json({ suggestion });
    } catch (error) {
        console.error("Error generating AI suggestion:", error);
        res.status(500).json({ error: "Failed to get AI suggestion" });
    }
});

// Chat about code: accepts code + question and returns an AI answer
router.post("/ai-code-chat", async (req, res) => {
  try {
    const { code, question, language } = req.body || {};
    if (!question || typeof code !== 'string') {
      return res.status(400).json({ error: "question and code are required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const prompt = `You are a helpful code assistant. Answer the user's question about the code clearly and concisely.
Language: ${language || 'unknown'}
Question: ${question}

Code:
\n\n${code}\n\n`;

    const response = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: prompt }],
      }],
    });

    const answer = await response.response.text();
    res.json({ answer });
  } catch (error) {
    console.error("Error in ai-code-chat:", error);
    res.status(500).json({ error: "Failed to get AI answer" });
  }
});

// Derived code chat: accepts code + request, returns plain text with explanation and revised code
router.post("/ai-code-derive", async (req, res) => {
  try {
    const { code, request, language } = req.body || {};
    if (!code || typeof code !== "string" || !request || typeof request !== "string") {
      return res.status(400).type("text/plain").send("Both 'code' and 'request' are required.");
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

    const prompt = `You are a senior code assistant. Perform the user's request on the supplied code.
Return output as plain text in exactly this format:
1) A brief explanation (1-3 sentences)
2) Revised code in a fenced code block, with the correct language hint

User request:
${request}

Language: ${language || "unknown"}

Original code:
${code}
`;

    const structuredPrompt = `Role: You are a senior software engineer.

Goal: Apply the user's request to the supplied code and return a minimal, high-quality result.

Inputs:
- Language (hint): ${language || 'infer'}
- User request:
"""${request}"""
- Original code:
<<<CODE_START
${code}
CODE_END>>>

Constraints:
- Preserve existing behavior, public APIs, signatures, and style unless the request requires changes.
- Keep the solution correct, idiomatic, and safe. Add brief inline comments only when they clarify non-obvious logic.
- If the request is ambiguous or risky, make the minimal reasonable assumption and mention it briefly in the explanation.
- Do not invent nonexistent APIs or libraries.

Output format (return ONLY the two sections below; no extra text):
Explanation: 1–3 concise sentences summarizing what changed and why.

RevisedCode:
Use a single fenced code block containing the complete, self-contained revised source (not a diff or snippet).
The fence language tag must be the provided Language hint if present; otherwise infer the best tag.

Example (format only):
Explanation: <your 1–3 sentence summary>

RevisedCode:
\`\`\`<language-tag>
<full revised code>
\`\`\`
`;

    const response = await model.generateContent({
      contents: [{
        role: "user",
        parts: [{ text: structuredPrompt }],
      }],
    });

    const text = await response.response.text();
    return res.type("text/plain").send(text);
  } catch (error) {
    console.error("Error in ai-code-derive:", error);
    return res.status(500).type("text/plain").send("Failed to derive AI response");
  }
});

export default router;

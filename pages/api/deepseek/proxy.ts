import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
    api: {
        bodyParser: {
            sizeLimit: '4mb',
        },
        // Important for streaming
        externalResolver: true,
    },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.DEEPSEEK_API_KEY;

    if (!apiKey) {
        return res.status(500).json({ error: 'DeepSeek API key not configured on server' });
    }

    try {
        const response = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify(req.body),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return res.status(response.status).json({ error: errorData.error?.message || response.statusText });
        }

        if (!response.body) {
            return res.status(500).json({ error: 'No response body from DeepSeek' });
        }

        // Set headers for SSE/streaming
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // Pipe the response body to the client
        // @ts-ignore - response.body is a ReadableStream in Fetch API, but Node Response expects standard Node stream or similar. 
        // We can iterate the reader and write to res.

        // Better approach for Next.js API routes with fetch streams:
        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            res.write(value);
        }

        res.end();

    } catch (error: any) {
        console.error('Proxy Error:', error);
        res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
}

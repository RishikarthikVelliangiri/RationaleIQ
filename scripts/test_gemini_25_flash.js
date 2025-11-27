#!/usr/bin/env node
/**
 * test_gemini_25_flash.js
 * Simple script to test Gemini 2.5 Flash limits and responsiveness.
 * Usage:
 *  - locally: GEMINI_API_KEY=xxx node scripts/test_gemini_25_flash.js
 *  - or: node scripts/test_gemini_25_flash.js --key=xxx --mode=long --repeats=5
 */

import dotenv from 'dotenv';
import { performance } from 'perf_hooks';

dotenv.config();

// Parse simple CLI args (no dependencies) --format: --key=VALUE --mode=long --repeats=3
const args = process.argv.slice(2);
const argv = args.reduce((acc, arg) => {
  if (arg.startsWith('--')) {
    const [k, v] = arg.slice(2).split('=');
    acc[k] = v === undefined ? true : v;
  }
  return acc;
}, {});
const apiKey = argv.key || process.env.GEMINI_API_KEY;
const mode = argv.mode || 'short';
const repeats = parseInt(argv.repeats || '1', 10);
const baseUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

if (!apiKey) {
  console.error('GEMINI_API_KEY is not set. Use --key or set GEMINI_API_KEY in env.');
  process.exit(1);
}

const shortPrompt = 'Write a concise explanation for why a company would migrate to a cloud provider instead of self-hosting.';
const longPrompt = `You are an expert technical and financial analyst. Write a detailed multi-section analysis (5-6 paragraphs) of the risks, advantages, cost tradeoffs, migration steps,
performance and operational considerations for migrating from on-premises infrastructure to cloud hosting for an enterprise-scale web application. Include example timelines, cost estimates, and migration strategy options.

Here are additional details: 1) 120k monthly users, 2) low-latency requirements for authenticated APIs, 3) existing monolith in a data center, 4) desire to cut operating costs by 30%. Provide specifics.`;

let prompt = mode === 'long' ? longPrompt : shortPrompt;
if (mode === 'huge') {
  // Create a very large prompt to test input size limits: 50,000 characters
  const hugePrompt = 'A'.repeat(50_000);
  console.log('Using huge prompt of length:', hugePrompt.length);
  prompt = hugePrompt; // override
}
// Special mode to request a very large output
const bigOutPrompt = `Write a very long, detailed, and technical article of roughly 3,000 words (around 20,000 characters) about the migration of an enterprise-scale web application from on-prem to cloud.
Include sections on architecture changes, cost models, security, performance optimization, data migration strategies, and a migration timeline. Use clear headings and bullet lists where relevant.`;
if (mode === 'bigout') {
  prompt = bigOutPrompt;
}

async function callGemini(index) {
  const url = `${baseUrl}?key=${apiKey}`;
  const body = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ]
  };

  console.log(`\nRequest #${index} - Sending request to ${baseUrl}?key=***...`);
  const start = performance.now();
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const elapsed = performance.now() - start;
    console.log(`Status: ${resp.status} (${resp.statusText}) - Time: ${elapsed.toFixed(2)} ms`);

    // Log some typical headers (if present)
    const headersToCheck = [
      'x-ratelimit-limit',
      'x-ratelimit-remaining',
      'x-ratelimit-reset',
      'retry-after',
      'content-length'
    ];

    headersToCheck.forEach(h => {
      const val = resp.headers.get(h) || resp.headers.get(h.toLowerCase());
      if (val) console.log(`${h}: ${val}`);
    });

    const text = await resp.text();
    if (resp.ok) {
      let size = Buffer.byteLength(text, 'utf8');
      console.log(`Response size (bytes): ${size}`);

      // Attempt to parse JSON and print a snippet
      try {
        const data = JSON.parse(text);
        const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('Candidate snippet (first 300 chars):\n', candidate.substring(0, 300));
        console.log('Full candidate length (chars):', candidate.length);
      } catch (e) {
        console.warn('Response not JSON or failed to parse:', e.message);
      }

    } else {
      console.error('Error response body:', text.substring(0, 1000));
    }
  } catch (error) {
    console.error('Request error:', error.message);
  }
}

(async () => {
  for (let i=1; i<=repeats; i++) {
    await callGemini(i);
  }
})();

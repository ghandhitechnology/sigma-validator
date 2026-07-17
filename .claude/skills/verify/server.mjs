import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const skillDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(skillDirectory, '../../..');
const publicRoot = path.join(root, 'public');
const port = Number(process.env.PORT || 8788);
const apiSource = await readFile(path.join(root, 'functions/api/evaluate.js'), 'utf8');
const api = await import(`data:text/javascript;base64,${Buffer.from(apiSource).toString('base64')}`);
const useMockAI = process.env.SIGMA_VERIFY_MOCK_AI === '1';
const stores = { cache: new Map(), reports: new Map() };
const memoryKV = store => ({
  get: key => store.get(key) || null,
  put: (key, value) => { store.set(key, value); },
});
const env = useMockAI ? {
  DEEPSEEK_API_KEY: 'verification-only',
  SIGMA_CACHE: memoryKV(stores.cache),
  SIGMA_REPORTS: memoryKV(stores.reports),
} : {};

if (useMockAI) {
  globalThis.fetch = async (url, options) => {
    if (!String(url).startsWith('https://api.deepseek.com/')) throw new Error(`Unexpected outbound request: ${url}`);
    const request = JSON.parse(options.body);
    const isEnglish = request.messages[0].content.includes('human-readable field in English');
    const keys = ['problem', 'solution', 'revenue', 'market', 'differentiation', 'feasibility', 'scalability'];
    const axes = keys.map((key, index) => ({
      key,
      name: 'model supplied label',
      question: 'model supplied question',
      score: 60 + index,
      analysis: isEnglish ? `Evidence-led analysis ${index + 1}.` : `근거 중심 분석 ${index + 1}입니다.`,
    }));
    const content = JSON.stringify({
      overall_score: 64,
      summary: isEnglish ? 'The case requires external proof.' : '이 아이디어는 외부 근거가 더 필요합니다.',
      axes,
      slops: [],
    });
    return new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  };
}
const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};
const staticHeaders = {
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'",
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

async function sendFetchResponse(nodeResponse, response) {
  nodeResponse.writeHead(response.status, Object.fromEntries(response.headers.entries()));
  nodeResponse.end(Buffer.from(await response.arrayBuffer()));
}

const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://127.0.0.1:${port}`);
    if (url.pathname === '/api/evaluate') {
      const chunks = [];
      for await (const chunk of request) chunks.push(chunk);
      const body = chunks.length ? Buffer.concat(chunks) : undefined;
      const webRequest = new Request(url, { method: request.method, headers: request.headers, body });
      const handler = request.method === 'POST' ? api.onRequestPost : request.method === 'OPTIONS' ? api.onRequestOptions : api.onRequestGet;
      await sendFetchResponse(response, await handler({ request: webRequest, env }));
      return;
    }

    let pathname = decodeURIComponent(url.pathname);
    if (pathname.endsWith('/')) pathname += 'index.html';
    const filePath = path.resolve(publicRoot, '.' + pathname);
    if (!filePath.startsWith(publicRoot)) {
      response.writeHead(403).end('Forbidden');
      return;
    }
    const info = await stat(filePath);
    if (!info.isFile()) throw new Error('Not found');
    const body = await readFile(filePath);
    response.writeHead(200, { ...staticHeaders, 'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  }
});

server.listen(port, '127.0.0.1', () => console.log(`SIGMA verification server http://127.0.0.1:${port}`));

import server from '../dist/server/server.js';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  // If Vercel provides a Web Request natively
  if (req instanceof Request) {
    return await server.fetch(req);
  }
  
  // Otherwise, manually adapt Node IncomingMessage to Web Request
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  
  // Clean the URL (Vercel sometimes passes the full URL or just the path)
  const path = req.url.startsWith('http') ? new URL(req.url).pathname : req.url;
  const url = new URL(path, `${protocol}://${host}`);
  
  const requestInit = {
    method: req.method,
    headers: req.headers,
  };
  
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    requestInit.body = req;
    requestInit.duplex = 'half';
  }
  
  const webRequest = new Request(url.toString(), requestInit);
  const response = await server.fetch(webRequest);
  
  res.statusCode = response.status;
  response.headers.forEach((value, key) => {
    res.setHeader(key, value);
  });
  
  if (response.body) {
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
  }
  res.end();
}

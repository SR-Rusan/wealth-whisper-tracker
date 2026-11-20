import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 5001;
const DATA_FILE = path.resolve('./data.json');
const SCRIPT_FILE = path.resolve('./wealth-whisper-safari.user.js');

// Helper to read data
function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ transactions: [], investments: [] }, null, 2));
  }
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (e) {
    return { transactions: [], investments: [] };
  }
}

// Helper to write data
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Serve the Safari Userscript directly for one-click installation
  if (req.method === 'GET' && req.url === '/wealth-whisper-safari.user.js') {
    if (fs.existsSync(SCRIPT_FILE)) {
      res.writeHead(200, { 'Content-Type': 'text/javascript' });
      res.end(fs.readFileSync(SCRIPT_FILE, 'utf-8'));
    } else {
      res.writeHead(404);
      res.end('Script file not found');
    }
    return;
  }

  // GET /api/data
  if (req.method === 'GET' && req.url === '/api/data') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(readData()));
    return;
  }

  // POST /api/transactions
  if (req.method === 'POST' && req.url === '/api/transactions') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const newTx = JSON.parse(body);
        const data = readData();
        
        // De-duplication
        const exists = data.transactions.some(t => t.id === newTx.id);
        if (!exists) {
          data.transactions.unshift(newTx);
          writeData(data);
          console.log(`[Server] Logged transaction: ${newTx.description} - Tk ${newTx.amount}`);
          res.writeHead(201, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, tx: newTx }));
        } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Duplicate transaction' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // POST /api/investments
  if (req.method === 'POST' && req.url === '/api/investments') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const newInv = JSON.parse(body);
        const data = readData();
        data.investments.unshift(newInv);
        writeData(data);
        console.log(`[Server] Logged investment: ${newInv.assetName} - Tk ${newInv.amount}`);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, inv: newInv }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // DELETE /api/transactions/:id
  if (req.method === 'DELETE' && req.url.startsWith('/api/transactions/')) {
    const id = req.url.split('/').pop();
    const data = readData();
    data.transactions = data.transactions.filter(t => t.id !== id);
    writeData(data);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // DELETE /api/investments/:id
  if (req.method === 'DELETE' && req.url.startsWith('/api/investments/')) {
    const id = req.url.split('/').pop();
    const data = readData();
    data.investments = data.investments.filter(inv => inv.id !== id);
    writeData(data);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // POST /api/import
  if (req.method === 'POST' && req.url === '/api/import') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const importedTxs = JSON.parse(body);
        if (Array.isArray(importedTxs)) {
          const data = readData();
          data.transactions = importedTxs;
          writeData(data);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Data must be an array' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // POST /api/clear
  if (req.method === 'POST' && req.url === '/api/clear') {
    writeData({ transactions: [], investments: [] });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true }));
    return;
  }

  // Serve gold favicon for any favicon request
  if (req.url.includes('favicon') || req.url === '/favicon.ico') {
    const favPath = path.resolve('./public/favicon.svg');
    if (fs.existsSync(favPath)) {
      res.writeHead(200, {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(fs.readFileSync(favPath));
      return;
    }
  }

  // Serve static files from ./dist
  let filePath = path.join('./dist', req.url === '/' ? 'index.html' : req.url);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.svg': 'image/svg+xml',
      '.png': 'image/png'
    };
    res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
    res.end(fs.readFileSync(filePath));
    return;
  } else if (req.method === 'GET' && !req.url.startsWith('/api')) {
    let indexPath = path.join('./dist', 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(indexPath));
      return;
    }
  }

  res.writeHead(404);
  res.end();
});

server.listen(PORT, () => {
  console.log(`[Server] Wealth Whisper API running on port ${PORT}`);
});

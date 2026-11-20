import fs from 'fs';
import path from 'path';
import http from 'http';
import https from 'https';

const DATA_FILE = path.resolve('/Users/rusan/Documents/Google anti-gravity projects/wealth-whisper-tracker/data.json');
const LOG_FILE = path.resolve('/Users/rusan/Documents/Google anti-gravity projects/wealth-whisper-tracker/location_daemon.log');

function log(msg) {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${msg}\n`;
  fs.appendFileSync(LOG_FILE, entry);
}

// Distance helper (Haversine formula in KM)
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Dhanmondi coordinates
const DHANMONDI = { lat: 23.7461, lng: 90.3742, name: 'Dhanmondi' };

function fetchIPLocation() {
  return new Promise((resolve, reject) => {
    http.get('http://ip-api.com/json', (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          const data = JSON.parse(raw);
          if (data.status === 'success') {
            resolve({ lat: data.lat, lng: data.lon, city: data.city });
          } else {
            reject(new Error('IP API error'));
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', err => reject(err));
  });
}

function checkAndAutoLog() {
  fetchIPLocation()
    .then((coords) => {
      log(`Fetched current location: Lat ${coords.lat}, Lng ${coords.lng} (${coords.city})`);
      const dist = getDistanceKm(coords.lat, coords.lng, DHANMONDI.lat, DHANMONDI.lng);
      log(`Distance to Dhanmondi: ${dist.toFixed(2)} km`);

      if (dist <= 3.0) { // Within 3km radius
        let data = { transactions: [], investments: [] };
        if (fs.existsSync(DATA_FILE)) {
          data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        }

        const now = Date.now();
        const FOUR_HOURS = 4 * 60 * 60 * 1000;

        // Check last automated log
        const lastAutoLog = data.transactions.find(t => t.description && t.description.includes('Dhanmondi'));
        if (!lastAutoLog || (now - new Date(lastAutoLog.timestamp || lastAutoLog.date).getTime()) > FOUR_HOURS) {
          const newTx = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            type: 'expense',
            amount: 100,
            category: 'Transport',
            method: 'Cash',
            description: 'Travel Expense: Home → Dhanmondi (Background Auto-Log)',
            isMFS: false
          };

          data.transactions.unshift(newTx);
          fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
          log(`SUCCESS: Auto-logged 100 TK travel expense for Home -> Dhanmondi!`);
        } else {
          log(`Skipped log: Expense for Dhanmondi was logged recently.`);
        }
      }
    })
    .catch((err) => {
      log(`Location check failed: ${err.message}`);
    });
}

log('Wealth Whisper macOS Location Daemon Started');
checkAndAutoLog();
// Check location every 3 minutes
setInterval(checkAndAutoLog, 3 * 60 * 1000);

require('dotenv').config({ path: '/Users/revinaawalia/Downloads/imron-hacktiv8-excercise/phase2/snp-500-ai/server/.env' });
const WebSocket = require('ws');
const key = process.env.FINNHUB_API_KEY || '';
const url = 'wss://ws.finnhub.io?token=' + key;
console.log('Connecting to Finnhub WS...');
const ws = new WebSocket(url);
let trades = 0;
let errors = 0;
ws.on('open', () => {
  console.log('WS OPEN');
  ws.send(JSON.stringify({ type: 'subscribe', symbol: 'BINANCE:BTCUSDT' }));
  console.log('Subscribed BINANCE:BTCUSDT');
});
ws.on('message', (data) => {
  try {
    const msg = JSON.parse(data.toString());
    if (msg.type === 'trade' && msg.data) {
      trades++;
      if (trades <= 3) console.log('TRADE:', JSON.stringify(msg.data[0]).slice(0, 120));
    } else {
      console.log('MSG:', JSON.stringify(msg).slice(0, 150));
    }
  } catch (e) { console.log('PARSE ERR:', e.message); }
});
ws.on('error', (e) => { errors++; console.log('WS ERROR:', e.message); });
ws.on('close', (code, reason) => { console.log('WS CLOSED:', code, reason.toString()); });
setTimeout(() => {
  console.log('--- SUMMARY ---');
  console.log('trades received:', trades, '| errors:', errors);
  console.log('readyState:', ws.readyState, '(1=OPEN)');
  process.exit(0);
}, 15000);
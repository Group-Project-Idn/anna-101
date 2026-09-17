const { Server } = require('socket.io');
const WebSocket = require('ws');
const { Stock, Quote } = require('../models');
const { toFinnhubWsSymbol, fromFinnhubWsSymbol } = require('../constants/stocks');

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_WS_URL = `wss://ws.finnhub.io?token=${FINNHUB_API_KEY}`;

let io = null;
let finnhubWs = null;
const subscribedSymbols = new Set();
const roomSubscriptions = new Map();
const liveCandles = new Map();
const throttleTimers = new Map();

const connectFinnhubWS = () => {
  if (finnhubWs) return;

  finnhubWs = new WebSocket(FINNHUB_WS_URL);

  finnhubWs.on('open', () => {
    console.log('[Socket] Connected to Finnhub WebSocket');
    subscribedSymbols.forEach((symbol) => {
      // crypto perlu format Finnhub WS (mis. BTC -> BINANCE:BTCUSDT)
      finnhubWs.send(JSON.stringify({ type: 'subscribe', symbol: toFinnhubWsSymbol(symbol) }));
    });
  });

  finnhubWs.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      if (message.type === 'trade' && message.data) {
        message.data.forEach((trade) => {
          // trade.s dari Finnhub bisa "BINANCE:BTCUSDT" -> kembalikan ke room "BTC"
          const roomSymbol = fromFinnhubWsSymbol(trade.s);
          handleTradeUpdate({ ...trade, s: roomSymbol });
        });
      }
    } catch (error) {
      console.error('[Socket] Error parsing Finnhub message:', error.message);
    }
  });

  finnhubWs.on('close', () => {
    console.log('[Socket] Finnhub WebSocket disconnected');
    finnhubWs = null;
    setTimeout(connectFinnhubWS, 5000);
  });

  finnhubWs.on('error', (error) => {
    console.error('[Socket] Finnhub WebSocket error:', error.message);
  });
};

const handleTradeUpdate = async (trade) => {
  const { s: symbol, p: price, t: timestamp } = trade;

  if (!liveCandles.has(symbol)) {
    liveCandles.set(symbol, {
      open: price,
      high: price,
      low: price,
      close: price,
      timestamp,
    });
  } else {
    const candle = liveCandles.get(symbol);
    candle.high = Math.max(candle.high, price);
    candle.low = Math.min(candle.low, price);
    candle.close = price;
    candle.timestamp = timestamp;
  }

  // Throttle 1x/detik per simbol: data candle selalu di-update dari tiap trade,
  // tapi emit 'candle-update' ke room maksimal sekali per detik.
  if (throttleTimers.has(symbol)) {
    return;
  }

  throttleTimers.set(
    symbol,
    setTimeout(() => {
      const candle = liveCandles.get(symbol);
      if (candle && io) {
        // Chart detail (per room simbol) — OHLC lengkap.
        io.to(symbol).emit('candle-update', {
          symbol,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          timestamp: candle.timestamp,
        });
        // Card harga (broadcast global) — didengar Stocks/Home/Watchlist.
        // Client yang filter per simbol via realtimePrices[symbol].
        io.emit('price-update', {
          symbol,
          price: candle.close,
          timestamp: candle.timestamp,
        });
      }
      throttleTimers.delete(symbol);
    }, 1000),
  );
};

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    socket.on('subscribe', async ({ symbol }) => {
      if (!symbol) return;

      const upperSymbol = symbol.toUpperCase();
      socket.join(upperSymbol);

      if (!roomSubscriptions.has(upperSymbol)) {
        roomSubscriptions.set(upperSymbol, new Set());
      }
      roomSubscriptions.get(upperSymbol).add(socket.id);

      if (roomSubscriptions.get(upperSymbol).size === 1) {
        if (!subscribedSymbols.has(upperSymbol)) {
          subscribedSymbols.add(upperSymbol);
          if (finnhubWs && finnhubWs.readyState === WebSocket.OPEN) {
            finnhubWs.send(JSON.stringify({
              type: 'subscribe',
              symbol: toFinnhubWsSymbol(upperSymbol),
            }));
          }
        }
      }

      try {
        const stock = await Stock.findOne({
          where: { symbol: upperSymbol },
          include: [Quote],
        });

        if (stock && stock.Quote) {
          socket.emit('candle-update', {
            symbol: upperSymbol,
            open: stock.Quote.open,
            high: stock.Quote.high,
            low: stock.Quote.low,
            close: stock.Quote.current_price,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        console.error(`[Socket] Error fetching initial data for ${upperSymbol}:`, error.message);
      }
    });

    socket.on('unsubscribe', ({ symbol }) => {
      if (!symbol) return;

      const upperSymbol = symbol.toUpperCase();
      socket.leave(upperSymbol);

      if (roomSubscriptions.has(upperSymbol)) {
        roomSubscriptions.get(upperSymbol).delete(socket.id);

        if (roomSubscriptions.get(upperSymbol).size === 0) {
          roomSubscriptions.delete(upperSymbol);
          subscribedSymbols.delete(upperSymbol);

          if (finnhubWs && finnhubWs.readyState === WebSocket.OPEN) {
            finnhubWs.send(JSON.stringify({
              type: 'unsubscribe',
              symbol: toFinnhubWsSymbol(upperSymbol),
            }));
          }

          liveCandles.delete(upperSymbol);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);

      roomSubscriptions.forEach((clients, symbol) => {
        if (clients.has(socket.id)) {
          clients.delete(socket.id);
          if (clients.size === 0) {
            roomSubscriptions.delete(symbol);
            subscribedSymbols.delete(symbol);

            if (finnhubWs && finnhubWs.readyState === WebSocket.OPEN) {
              finnhubWs.send(JSON.stringify({
                type: 'unsubscribe',
                symbol: toFinnhubWsSymbol(symbol),
              }));
            }

            liveCandles.delete(symbol);
          }
        }
      });
    });
  });

  connectFinnhubWS();
};

module.exports = { initSocket };

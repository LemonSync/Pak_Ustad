const fetch = require('node-fetch');
const Canvas = require('canvas');
const path = require('path');

const ipCache = new Map();
const RATE_LIMIT = 6;
const TIME_WINDOW = 1 * 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  const record = ipCache.get(ip) || { count: 0, startTime: now };

  if (now - record.startTime > TIME_WINDOW) {
    ipCache.set(ip, { count: 1, startTime: now });
    return false;
  }

  if (record.count >= RATE_LIMIT) return true;

  record.count += 1;
  ipCache.set(ip, record);
  return false;
}

let globalRequestCount = 0;
let globalStartTime = Date.now();
const GLOBAL_RATE_LIMIT = 20;
const GLOBAL_TIME_WINDOW = 2 * 60 * 1000;

function isGloballyRateLimited() {
  const now = Date.now();
  if (now - globalStartTime > GLOBAL_TIME_WINDOW) {
    globalStartTime = now;
    globalRequestCount = 1;
    return false;
  }

  if (globalRequestCount >= GLOBAL_RATE_LIMIT) return true;

  globalRequestCount += 1;
  return false;
}

Canvas.registerFont(path.join(__dirname, '../media/fonts/Lemon.ttf'), { family: 'default' });

function wrapText(context, text, x, y, maxWidth, lineHeight) {
  let line = '';
  const lines = [];

  for (let i = 0; i < text.length; i++) {
    const testLine = line + text[i];
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && line !== '') {
      lines.push(line);
      line = text[i];
    } else {
      line = testLine;
    }
  }

  if (line) lines.push(line);

  for (let j = 0; j < lines.length; j++) {
    context.fillText(lines[j], x, y + j * lineHeight);
  }
}

module.exports = async (req, res) => {
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0]?.trim() || req.socket.remoteAddress;

  if (isGloballyRateLimited()) {
    return res.status(503).json({
      message: 'Server menerima terlalu banyak permintaan. Coba lagi sebentar lagi.'
    });
  }

  if (isRateLimited(ip)) {
    return res.status(429).json({
      message: 'Terlalu banyak permintaan dari IP ini. Coba lagi nanti.'
    });
  }

  const { isi } = req.body;

  if (!isi) {
    return res.status(400).json({ message: 'Parameter "isi" wajib diisi.' });
  }

  if (isi.length > 68) {
    return res.status(400).json({ message: 'Teks tidak boleh lebih dari 68 karakter.' });
  }

  try {
    const canvas = Canvas.createCanvas(554, 554);
    const ctx = canvas.getContext('2d');

    const centerX = canvas.width / 2;

    const bg = await Canvas.loadImage(path.join(__dirname, '../media/image/pak_ustad.jpg'));
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000000';
    ctx.font = `bold 30px 'default'`;

    const maxTextWidth = 400;
    const startX = centerX - maxTextWidth / 2;
    const startY = 130;
    const lineHeight = 35;

    wrapText(ctx, isi, startX + 5, startY, maxTextWidth, lineHeight);

    const output = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename="generated.png"');
    res.send(output);
  } catch (err) {
    console.error('Error generate-image:', err);
    res.status(500).send('Gagal memproses gambar.');
  }
};

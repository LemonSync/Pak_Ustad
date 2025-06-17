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

function wrapText(ctx, text, centerX, startY, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let line = '';

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const testLine = line + (line ? ' ' : '') + word;
    const testWidth = ctx.measureText(testLine).width;

    if (testWidth <= maxWidth) {
      line = testLine;
    } else {
      if (line) {
        lines.push(line);
        line = word;
      } else {
        let subLine = '';
        for (const char of word) {
          const testSub = subLine + char;
          if (ctx.measureText(testSub).width > maxWidth) {
            lines.push(subLine);
            subLine = char;
          } else {
            subLine = testSub;
          }
        }
        if (subLine) lines.push(subLine);
        line = '';
      }
    }
  }

  if (line) lines.push(line);

  for (let i = 0; i < lines.length; i++) {
    const textLine = lines[i];
    const lineWidth = ctx.measureText(textLine).width;
    const x = centerX - lineWidth / 2;
    const y = startY + i * lineHeight;
    ctx.fillText(textLine, x, y);
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

  const { isi, option } = req.body;

  if (!isi) {
    return res.status(400).json({ message: 'Parameter "isi" wajib diisi.' });
  }

  if (isi.length > 68) {
    return res.status(400).json({ message: 'Teks tidak boleh lebih dari 68 karakter.' });
  }

  try {
    if (option === "type1") {
      const canvas = Canvas.createCanvas(554, 554);
    const ctx = canvas.getContext('2d');

    const centerX = canvas.width / 2;

    const bg = await Canvas.loadImage(path.join(__dirname, '../media/image/pak_ustad.jpg'));
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000000';
    ctx.font = `bold 30px 'default'`;

    const maxTextWidth = 405;
    const startY = 120;
    const lineHeight = 35;

    wrapText(ctx, isi, centerX, startY, maxTextWidth, lineHeight);

    const output = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename="generated.png"');
    res.send(output);
    } else if (option === "type2") {
      const canvas = Canvas.createCanvas(720, 1065);
    const ctx = canvas.getContext('2d');

    const centerX = canvas.width / 2;

    const bg = await Canvas.loadImage(path.join(__dirname, '../media/image/pak_ustad2.jpg'));
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000000';
    ctx.font = `bold 40px 'default'`;

    const maxTextWidth = 500;
    const startY = 220;
    const lineHeight = 35;

    wrapText(ctx, isi, centerX, startY, maxTextWidth, lineHeight);

    const output = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename="generated.png"');
    res.send(output);
    } else { // untuk else
    const canvas = Canvas.createCanvas(554, 554);
    const ctx = canvas.getContext('2d');

    const centerX = canvas.width / 2;

    const bg = await Canvas.loadImage(path.join(__dirname, '../media/image/pak_ustad.jpg'));
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#000000';
    ctx.font = `bold 30px 'default'`;

    const maxTextWidth = 405;
    const startY = 120;
    const lineHeight = 35;

    wrapText(ctx, isi, centerX, startY, maxTextWidth, lineHeight);

    const output = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename="generated.png"');
    res.send(output);
    }
  } catch (err) {
    console.error('Error generate-image:', err);
    res.status(500).send('Gagal memproses gambar.');
  }
};

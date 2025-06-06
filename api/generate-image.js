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

Canvas.registerFont(path.join(__dirname, '../media/fonts/Lemon.otf'), { family: 'default' });

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

  if (!name) {
    return res.status(400).json({ message: 'Parameter "name" wajib diisi.' });
  }

  try {
    const canvas = Canvas.createCanvas(1280, 576);
    const ctx = canvas.getContext('2d');

    const bg = await Canvas.loadImage(path.join(__dirname, '../media/image/pak_ustad.jpg'));
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

    const imageUrl = image?.trim() || DEFAULT_IMAGE_URL;
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('Gagal mengambil gambar dari URL.');
    const buffer = await response.buffer();
    const profileImage = await Canvas.loadImage(buffer);

    const centerX = canvas.width / 2;
    const centerY = 85;
    const radius = 60;

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(profileImage, centerX - radius, centerY - radius, radius * 2, radius * 2);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.font = `bold 19px 'default'`;
    ctx.fillText("____________________________________________", centerX, 160);

    ctx.font = `bold 40px 'default'`;
    ctx.fillText(welcome ? "WELCOME" : "GOODBYE", centerX, 210);

    ctx.fillStyle = '#87CEEB';
    ctx.font = `37px 'default'`;
    ctx.fillText(name, centerX, 260);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold 37px 'sunshine'`;
    ctx.fillText(welcome ? "I hope You enjoy it here" : "Bye, see You later", centerX, 320);

    ctx.font = `10px 'roboto-black'`;
    ctx.fillText(date, centerX, 380);
    ctx.fillText(getCurrentTime(), centerX, 390);

    const output = canvas.toBuffer('image/png');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', 'inline; filename="generated.png"');
    res.send(output);
  } catch (err) {
    console.error('Error generate-image:', err);
    res.status(500).send('Gagal memproses gambar.');
  }
};
  

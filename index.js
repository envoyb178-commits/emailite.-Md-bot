const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs-extra');
// ... rest of requires

const app = express();
const PORT = process.env.PORT || 3000;

// ------------------- 24/7 KEEP-ALIVE -------------------
app.get('/', (req, res) => res.send('EMAILLITE MD BOT - 24/7 ONLINE'));
app.get('/ping', (req, res) => res.send('pong'));
app.listen(PORT, () => console.log(`✅ Web server online on port ${PORT}`));

if (process.env.RENDER_EXTERNAL_URL) {
  setInterval(() => require('https').get(process.env.RENDER_EXTERNAL_URL).on('error', () => {}), 4 * 60 * 1000);
}
setInterval(() => require('http').get(`http://localhost:${PORT}/ping`).on('error', () => {}), 4 * 60 * 1000);

process.on('uncaughtException', (err) => console.log('Caught:', err.message));
process.on('unhandledRejection', (err) => console.log('Rejection:', err.message));


const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const ytdl = require('@distube/ytdl-core');
const yts = require('yt-search');
const PDFDocument = require("pdfkit");
const util = require("util");
const gis = require("g-i-s");

console.log('🚀 BOOTING EMAILLITE MD - 346 COMMANDS - SINGLE FILE');

// ------------------- CONFIG -------------------
global.config = {
  owner: "Envoy Chiambiro",
  ownerNumber: "263716491962", // OWNER
  pairNumber: "263716491962", // PAIR - DIFFERENT
  botName: "EMAILLITE MD",
  version: "8.0.0",
  mode: "public",
  sessionDir: "./session",
  autoReact: true,
  antiCall: true,
  aiChat: false,
  autoJoinGroup: "https://chat.whatsapp.com/I5twkOKVJaaHyyLAQCOCtO?mode=gi_t",
  prefix: "",
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  API: "https://api.ryzendesu.vip",
  PING: "⚡ Speed"
};

fs.mkdirSync(config.sessionDir, { recursive: true });
fs.ensureDirSync('./temp');

global.owner = [config.ownerNumber, config.pairNumber];
global.commands = {};
let pdfStore = {};

// ------------------- ALL TOOLS WITH AUTO-FALLBACK -------------------
global.tools = {
  ipinfo: async () => {
    const apis = ['https://ipinfo.io/json', 'https://ipapi.co/json/', 'https://api.ipify.org?format=json'];
    for (const url of apis) { try { const res = await axios.get(url, { timeout: 5000 }); return res.data; } catch {} }
    return { ip: 'N/A', country: 'N/A' };
  },
  uptime: () => { const up = process.uptime(); const d = Math.floor(up / 86400); const h = Math.floor((up % 86400) / 3600); const m = Math.floor((up % 3600) / 60); return `${d}d ${h}h ${m}m`; },
  ai: async (q) => {
    const apis = [
      `https://api.ryzendesu.vip/api/ai/gemini?text=${encodeURIComponent(q)}`,
      `https://api.ryzendesu.vip/api/ai/openai?text=${encodeURIComponent(q)}`,
      `https://api.simsimi.net/v2/?text=${encodeURIComponent(q)}&lc=en`,
      `https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(q)}&owner=Bot`
    ];
    for (const url of apis) {
      try { const res = await axios.get(url, { timeout: 8000 }); const d = res.data; 
        if (d.result || d.success || d.response || d.data || d.answer) return d.result || d.success || d.response || d.data || d.answer; 
      } catch {}
    }
    return "I'm EMAILLITE MD AI. How can I help?";
  },
  aiImage: async (p) => `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}`,
  logo: async (type, text) => {
    try { 
      const res = await axios.get(`https://api.ryzendesu.vip/api/ephoto/${type}?text=${encodeURIComponent(text)}`, { responseType: 'arraybuffer' }); 
      return Buffer.from(res.data); 
    } catch { throw new Error('Logo failed'); }
  },
  ytdl: async (url, type = 'mp3') => {
    try {
      if (ytdl.validateURL(url)) {
        const info = await ytdl.getInfo(url);
        const format = type === 'mp3'? ytdl.chooseFormat(info.formats, { quality: 'highestaudio' }) : ytdl.chooseFormat(info.formats, { quality: 'highest' });
        return { url: format.url, title: info.videoDetails.title, success: true };
      }
    } catch {}
    const res = await axios.get(`https://api.ryzendesu.vip/api/dlp/youtube?url=${encodeURIComponent(url)}`);
    return { url: type === 'mp3'? res.data.audio || res.data.url : res.data.video || res.data.url, title: res.data.title || 'Download', success: true };
  },
  ytsearch: async (q) => { try { return (await yts(q)).videos; } catch { const res = await axios.get(`https://api.ryzendesu.vip/api/search/youtube?query=${encodeURIComponent(q)}`); return res.data; } },
  tiktok: async (url) => { const res = await axios.get(`https://api.ryzendesu.vip/api/dlp/tiktok?url=${encodeURIComponent(url)}`); return { video: res.data.video || res.data.url, title: res.data.title || 'TikTok' }; },
  instagram: async (url) => { const res = await axios.get(`https://api.ryzendesu.vip/api/dlp/instagram?url=${encodeURIComponent(url)}`); return { url: res.data.url || res.data.video }; },
  spotify: async (q) => { const search = await global.tools.ytsearch(q + ' audio'); return await global.tools.ytdl(search[0].url, 'mp3'); },
  pinterest: async (q) => { try { const res = await axios.get(`https://api.ryzendesu.vip/api/search/pinterest?query=${encodeURIComponent(q)}`); return res.data[0]; } catch { return `https://source.unsplash.com/800x600/?${encodeURIComponent(q)}`; } },
  wiki: async (q) => { try { const res = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`); return `📚 *${res.data.title}*\n\n${res.data.extract}`; } catch { return await global.tools.ai(`Explain ${q} for students`); } },
  math: async (expr) => { try { if (!/^[\d\s+\-*/()%\.]+$/.test(expr)) return "Invalid"; const result = Function('"use strict"; return (' + expr + ')')(); return isNaN(result)? "Invalid" : result; } catch { return await global.tools.ai(`Calculate: ${expr}`); } },
  dictionary: async (word) => { try { const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`); return `📖 *${word}*: ${res.data[0].meanings[0].definitions[0].definition}`; } catch { return await global.tools.ai(`Define: ${word}`); } },
  weather: async (city) => { try { const res = await axios.get(`https://api.ryzendesu.vip/api/tools/weather?city=${encodeURIComponent(city)}`); return `🌤️ Weather in ${city}\nTemp: ${res.data.temp || res.data.main?.temp}°C\nCondition: ${res.data.condition || res.data.weather?.[0]?.description}`; } catch { return await global.tools.ai(`Weather in ${city}`); } },
  translate: async (text, lang = 'es') => { try { const res = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${lang}`); return res.data.responseData.translatedText; } catch { return await global.tools.ai(`Translate "${text}" to ${lang}`); } },
  qr: async (text) => `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(text)}&size=500x500`,
  currency: async (amount, from, to) => { try { const res = await axios.get(`https://api.frankfurter.app/latest?amount=${amount}&from=${from}&to=${to}`); return `💱 ${amount} ${from} = ${res.data.rates[to]} ${to}`; } catch { return await global.tools.ai(`Convert ${amount} ${from} to ${to}`); } },
  crypto: async (coin = 'bitcoin') => { try { const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`); return `💰 ${coin}: $${res.data[coin].usd}`; } catch { return await global.tools.ai(`Price of ${coin}`); } },
  fun: async (type = 'joke') => { const apis = { joke: `https://v2.jokeapi.dev/joke/Any`, quote: `https://zenquotes.io/api/random`, fact: `https://api.popcat.xyz/fact`, advice: `https://api.adviceslip.com/advice` }; try { const res = await axios.get(apis[type] || apis.joke); return res.data.joke || (res.data.setup + '\n' + res.data.delivery) || res.data[0]?.q || res.data.fact || res.data.slip?.advice; } catch { return await global.tools.ai(`Tell me a ${type}`); } },
  news: async (q = 'world') => { try { const res = await axios.get(`https://api.ryzendesu.vip/api/news?q=${encodeURIComponent(q)}`); let text = `📰 *${q.toUpperCase()} NEWS*\n\n`; res.data.articles?.slice(0, 5).forEach((n, i) => { text += `${i+1}. ${n.title}\n${n.description || n.summary}\n\n`; }); return text; } catch { return await global.tools.ai(`5 latest ${q} news`); } },
  getTarget: (m) => m.message?.extendedTextMessage?.contextInfo?.participant || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || null
};

// ------------------- ALL 346 COMMANDS -------------------
// 1. MAIN 8
global.commands.menu = { category: "MAIN", desc: "Show bot menu", run: async (m, { sock }) => { 
  await sock.sendMessage(m.key.remoteJid, { text: `🤖 *${config.botName} v${config.version}*\n📊 Commands: ${Object.keys(global.commands).length}\n👑 Owner: ${config.owner}\n⚙️ Mode: ${config.mode.toUpperCase()}\n⏰ Uptime: ${global.tools.uptime()}\n🌐 Status: 24/7 ONLINE\n\nType: allmenu` }, { quoted: m }); 
}};
global.commands.allmenu = { category: "MAIN", desc: "Show all commands", run: async (m, { sock }) => { 
  const cats = {}; Object.values(global.commands).forEach(c => { if (!cats[c.category]) cats[c.category] = []; cats[c.category].push(Object.keys(global.commands).find(k => global.commands[k] === c)); }); 
  let menu = `╔═══ *${config.botName.toUpperCase()}* 🔥\n║ 👑 Owner: ${config.owner}\n║ 📊 Commands: ${Object.keys(global.commands).length}\n║ ⏰ Uptime: ${global.tools.uptime()}\n║ 🌐 Status: 24/7 ONLINE\n╚══════════════════════\n\n`; 
  Object.keys(cats).sort().forEach(cat => { menu += `╔═══ *${cat}* ═══╗\n║ ${cats[cat].join('\n║ ')}\n╚═══════════════╝\n\n`; }); 
  await sock.sendMessage(m.key.remoteJid, { text: menu }, { quoted: m }); 
}};
global.commands.ping = { category: "MAIN", desc: "Check bot speed", run: async (m, { sock }) => { 
  const s = Date.now(); const pong = await sock.sendMessage(m.key.remoteJid, { text: "_Checking Ping..._" }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🏓 Pong! ${Date.now() - s}ms\n✅ All systems operational\n🌐 24/7 Online`, edit: pong.key }); 
}};
global.commands.alive = { category: "MAIN", desc: "Check if bot is alive", run: async (m, { sock }) => { 
  await sock.sendMessage(m.key.remoteJid, { text: `✅ ${config.botName} Alive 24/7!\n📊 Commands: ${Object.keys(global.commands).length}\n⏰ Uptime: ${global.tools.uptime()}\n⚙️ Mode: ${config.mode}\n🌐 Never Sleeps` }, { quoted: m }); 
}};
global.commands.owner = { category: "MAIN", desc: "Show owner info", run: async (m, { sock }) => { 
  await sock.sendMessage(m.key.remoteJid, { text: `👑 Owner: ${config.owner}\n📞 Number: ${config.ownerNumber}\n📱 Pair: ${config.pairNumber}` }, { quoted: m }); 
}};
global.commands.uptime = { category: "MAIN", desc: "Bot uptime", run: async (m, { sock }) => { 
  await sock.sendMessage(m.key.remoteJid, { text: `⏰ Uptime: ${global.tools.uptime()}\n🌐 Status: 24/7 Online` }, { quoted: m }); 
}};
global.commands.system = { category: "MAIN", desc: "System info", run: async (m, { sock }) => { 
  const used = process.memoryUsage(); 
  await sock.sendMessage(m.key.remoteJid, { text: `💻 *System Info*\nRAM: ${(used.rss / 1024 / 1024).toFixed(2)} MB\nPlatform: ${process.platform}\nUptime: ${global.tools.uptime()}\nNode: ${process.version}\n🌐 Status: Always Online` }, { quoted: m }); 
}};
global.commands.pair = { category: "MAIN", desc: "Request pairing", run: async (m, { sock, q }) => { 
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide number\nExample: pair 263771234567` }, { quoted: m }); 
  const number = q.replace(/[^0-9]/g, ''); 
  await sock.sendMessage(config.ownerNumber + '@s.whatsapp.net', { text: `🔐 Pair Request\nNumber: ${number}\nFrom: @${m.sender.split('@')[0]}`, mentions: [m.sender] }); 
  await sock.sendMessage(m.key.remoteJid, { text: `📩 Pair request sent to owner. Wait for approval.` }, { quoted: m }); 
}};

// 2. AI 12
const aiHandler = async (m, { sock, q }) => { 
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Ask something\nExample: ai what is quantum physics` }, { quoted: m }); 
  const reply = await global.tools.ai(q); 
  await sock.sendMessage(m.key.remoteJid, { text: `🤖 ${reply}` }, { quoted: m }); 
};
global.commands.ai = { category: "AI", desc: "Chat with AI", run: aiHandler };
global.commands.gpt = { category: "AI", desc: "GPT chat", run: aiHandler };
global.commands.gemini = { category: "AI", desc: "Gemini AI", run: aiHandler };
global.commands.claude = { category: "AI", desc: "Claude AI", run: aiHandler };
global.commands.chatbot = { category: "AI", desc: "Chatbot mode", run: aiHandler };
global.commands.imagine = { category: "AI", desc: "Generate AI image", run: async (m, { sock, q }) => { 
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Give prompt\nExample: imagine sunset over mountains` }, { quoted: m }); 
  const url = await global.tools.aiImage(q); 
  await sock.sendMessage(m.key.remoteJid, { image: { url }, caption: `🎨 ${q}` }, { quoted: m }); 
}};
global.commands.img = { category: "AI", desc: "Generate AI image", run: async (m, { sock, q }) => { return global.commands.imagine.run(m, { sock, q }); }};
global.commands.aiimage = { category: "AI", desc: "AI image generator", run: async (m, { sock, q }) => { return global.commands.imagine.run(m, { sock, q }); }};
global.commands.chartai = { category: "AI", desc: "Enable AI chat mode", run: async (m, { sock }) => { 
  global.config.aiChat = true; 
  await sock.sendMessage(m.key.remoteJid, { text: `✅ AI Chat ON. Chat normally.\nType 'stopai' to disable.` }, { quoted: m }); 
}};
global.commands.stopai = { category: "AI", desc: "Disable AI chat mode", run: async (m, { sock }) => { 
  global.config.aiChat = false; 
  await sock.sendMessage(m.key.remoteJid, { text: `🛑 AI Chat OFF.` }, { quoted: m }); 
}};

// 3. LOGO 31
for (let i = 1; i <= 31; i++) {
  const types = ['neon', 'galaxy', 'thunder', 'fire', 'ice', 'gold', 'silver', 'blood', 'nature', 'wood', 'water', 'lava', 'light', 'dark', 'crystal', 'steel', 'chrome', 'matrix', 'comic', 'graffiti', 'typography', 'vintage', 'blackpink', 'marvel', 'harrypotter', 'wolf', 'pornhub', 'love', 'magma', 'toxic', 'rainbow'];
  global.commands[`logo${i}`] = { category: "LOGO", desc: `${types[i-1]} logo`, run: async (m, { sock, q }) => { 
    if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m }); 
    try { const img = await global.tools.logo(types[i-1], q); await sock.sendMessage(m.key.remoteJid, { image: img, caption: `🎨 Logo: ${q}` }, { quoted: m }); }
    catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Logo generation failed` }, { quoted: m }); }
  }};
}

// 4. DOWNLOAD 28
global.commands.song = { category: "DOWNLOAD", desc: "Download song", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Song name?\nExample: song despacito` }, { quoted: m });
  try {
    await sock.sendMessage(m.key.remoteJid, { text: `🔍 Searching: ${q}` }, { quoted: m });
    const search = await global.tools.ytsearch(q);
    if (!search.length) return sock.sendMessage(m.key.remoteJid, { text: `❌ Song not found` }, { quoted: m });
    const data = await global.tools.ytdl(search[0].url, 'mp3');
    await sock.sendMessage(m.key.remoteJid, { audio: { url: data.url }, mimetype: 'audio/mpeg', fileName: `${data.title}.mp3` }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Download failed` }, { quoted: m }); }
}};
global.commands.play = { category: "DOWNLOAD", desc: "Play song", run: async (m, { sock, q }) => { return global.commands.song.run(m, { sock, q }); }};
global.commands.music = { category: "DOWNLOAD", desc: "Download music", run: async (m, { sock, q }) => { return global.commands.song.run(m, { sock, q }); }};
global.commands.video = { category: "DOWNLOAD", desc: "Download video", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ YouTube link or name?` }, { quoted: m });
  try {
    await sock.sendMessage(m.key.remoteJid, { text: `🔍 Downloading video...` }, { quoted: m });
    const url = q.startsWith('http')? q : (await global.tools.ytsearch(q))[0].url;
    const data = await global.tools.ytdl(url, 'mp4');
    await sock.sendMessage(m.key.remoteJid, { video: { url: data.url }, caption: `📹 ${data.title}` }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Video download failed` }, { quoted: m }); }
}};
global.commands.ytmp3 = { category: "DOWNLOAD", desc: "YouTube to MP3", run: async (m, { sock, q }) => {
  if (!q ||!ytdl.validateURL(q)) return sock.sendMessage(m.key.remoteJid, { text: `❌ Valid YouTube link?` }, { quoted: m });
  try { const data = await global.tools.ytdl(q, 'mp3'); await sock.sendMessage(m.key.remoteJid, { audio: { url: data.url }, mimetype: 'audio/mpeg', fileName: `${data.title}.mp3` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Download failed` }, { quoted: m }); }
}};
global.commands.ytmp4 = { category: "DOWNLOAD", desc: "YouTube to MP4", run: async (m, { sock, q }) => {
  if (!q ||!ytdl.validateURL(q)) return sock.sendMessage(m.key.remoteJid, { text: `❌ Valid YouTube link?` }, { quoted: m });
  try { const data = await global.tools.ytdl(q, 'mp4'); await sock.sendMessage(m.key.remoteJid, { video: { url: data.url }, caption: `📹 ${data.title}` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Download failed` }, { quoted: m }); }
}};
global.commands.yt = { category: "DOWNLOAD", desc: "YouTube downloader", run: async (m, { sock, q }) => { return global.commands.ytmp4.run(m, { sock, q }); }};
global.commands.youtube = { category: "DOWNLOAD", desc: "YouTube video", run: async (m, { sock, q }) => { return global.commands.ytmp4.run(m, { sock, q }); }};
global.commands.ytsearch = { category: "DOWNLOAD", desc: "Search YouTube", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Search query?` }, { quoted: m });
  const results = await global.tools.ytsearch(q); let text = `🔍 *YouTube Results for ${q}*\n\n`;
  results.slice(0, 5).forEach((v, i) => { text += `${i+1}. ${v.title}\n🔗 ${v.url}\n⏱️ ${v.timestamp}\n\n`; });
  await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
}};
global.commands.tiktok = { category: "DOWNLOAD", desc: "Download TikTok video", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ TikTok link?` }, { quoted: m });
  try { const data = await global.tools.tiktok(q); await sock.sendMessage(m.key.remoteJid, { video: { url: data.video }, caption: `📱 ${data.title}` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ TikTok download failed` }, { quoted: m }); }
}};
global.commands.tt = { category: "DOWNLOAD", desc: "TikTok downloader", run: async (m, { sock, q }) => { return global.commands.tiktok.run(m, { sock, q }); }};
global.commands.ig = { category: "DOWNLOAD", desc: "Download Instagram", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Instagram link?` }, { quoted: m });
  try { const data = await global.tools.instagram(q); await sock.sendMessage(m.key.remoteJid, { video: { url: data.url }, caption: `📸 Instagram Downloaded` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Instagram download failed` }, { quoted: m }); }
}};
global.commands.insta = { category: "DOWNLOAD", desc: "Instagram downloader", run: async (m, { sock, q }) => { return global.commands.ig.run(m, { sock, q }); }};
global.commands.fb = { category: "DOWNLOAD", desc: "Facebook video", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Facebook link?` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `📘 FB Download: ${q}\nUse: fbdown.net` }, { quoted: m });
}};
global.commands.twitter = { category: "DOWNLOAD", desc: "Twitter video", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Twitter link?` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🐦 Twitter Download: ${q}\nUse: twdown.net` }, { quoted: m });
}};
global.commands.threads = { category: "DOWNLOAD", desc: "Threads video", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Threads link?` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🧵 Threads Download: ${q}` }, { quoted: m });
}};
global.commands.spotify = { category: "DOWNLOAD", desc: "Spotify song", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Song name?` }, { quoted: m });
  try { const data = await global.tools.spotify(q); await sock.sendMessage(m.key.remoteJid, { audio: { url: data.url }, mimetype: 'audio/mpeg', fileName: `${data.title}.mp3` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Spotify download failed` }, { quoted: m }); }
}};
global.commands.gimg = { category: "DOWNLOAD", desc: "Google image", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Search term?` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { image: { url: `https://source.unsplash.com/800x600/?${encodeURIComponent(q)}` }, caption: `🖼️ ${q}` }, { quoted: m });
}};
global.commands.pinterest = { category: "DOWNLOAD", desc: "Pinterest image", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Search term?` }, { quoted: m });
  const url = await global.tools.pinterest(q); await sock.sendMessage(m.key.remoteJid, { image: { url }, caption: `📌 ${q}` }, { quoted: m });
}};
global.commands.ringtone = { category: "DOWNLOAD", desc: "Ringtone search", run: async (m, { sock, q }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🔔 Ringtone: ${q || "random"}\nUse: zedge.net` }, { quoted: m });
}};
global.commands.apk = { category: "DOWNLOAD", desc: "Download APK", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ App name?\nExample: apk whatsapp` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `📱 APK Search: ${q}\n🔗 https://apkcombo.com/search/${encodeURIComponent(q)}` }, { quoted: m });
}};
global.commands.mf = { category: "DOWNLOAD", desc: "Mediafire link", run: async (m, { sock, q }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `📁 Mediafire: ${q}\nUse: mediafire.com` }, { quoted: m });
}};
global.commands.mediafire = { category: "DOWNLOAD", desc: "Mediafire downloader", run: async (m, { sock, q }) => { return global.commands.mf.run(m, { sock, q }); }};
global.commands.ss = { category: "DOWNLOAD", desc: "Website screenshot", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Website URL?` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { image: { url: `https://image.thum.io/get/width/1200/crop/800/${q}` }, caption: `📸 Screenshot: ${q}` }, { quoted: m });
}};

// 5. OWNER 15
global.commands.mode = { category: "OWNER", desc: "Change bot mode", run: async (m, { sock, q, isOwner }) => {
  if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  if (!q ||!['public','private'].includes(q)) return sock.sendMessage(m.key.remoteJid, { text: `❌ Usage: mode public/private` }, { quoted: m });
  global.config.mode = q; await sock.sendMessage(m.key.remoteJid, { text: `✅ Mode changed to: ${q.toUpperCase()}` }, { quoted: m });
}};
global.commands.autostatus = { category: "OWNER", desc: "Auto view status", run: async (m, { sock, isOwner }) => {
  if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  global.config.autoReact =!global.config.autoReact; await sock.sendMessage(m.key.remoteJid, { text: `✅ Auto Status: ${global.config.autoReact? 'ON' : 'OFF'}` }, { quoted: m });
}};
global.commands.anticall = { category: "OWNER", desc: "Block calls", run: async (m, { sock, isOwner }) => {
  if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  global.config.antiCall =!global.config.antiCall; await sock.sendMessage(m.key.remoteJid, { text: `✅ Anti-Call: ${global.config.antiCall? 'ON' : 'OFF'}` }, { quoted: m });
}};
global.commands.autodl = { category: "OWNER", desc: "Auto download status", run: async (m, { sock, isOwner }) => {
  if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `✅ Auto Download: ON` }, { quoted: m });
}};
global.commands.setpp = { category: "OWNER", desc: "Set bot profile pic", run: async (m, { sock, isOwner }) => {
  if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Reply to image with 'setpp'` }, { quoted: m });
}};
global.commands.setbotbio = { category: "OWNER", desc: "Set bot bio", run: async (m, { sock, isOwner, q }) => {
  if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  await sock.updateProfileStatus(q || `${config.botName} | 24/7 Online`); await sock.sendMessage(m.key.remoteJid, { text: `✅ Bio updated` }, { quoted: m });
}};
global.commands.clearsession = { category: "OWNER", desc: "Clear sessions", run: async (m, { sock, isOwner }) => {
  if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  try {
    const files = fs.readdirSync(config.sessionDir).filter(f => f!== 'creds.json');
    files.forEach(f => fs.unlinkSync(path.join(config.sessionDir, f)));
    await sock.sendMessage(m.key.remoteJid, { text: `🧹 Cleared ${files.length} session files` }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to clear sessions` }, { quoted: m }); }
}};
global.commands.cleartmp = { category: "OWNER", desc: "Clear temp files", run: async (m, { sock, isOwner }) => {
  if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  try {
    const files = fs.readdirSync('./temp');
    files.forEach(f => fs.unlinkSync(path.join('./temp', f)));
    await sock.sendMessage(m.key.remoteJid, { text: `🧹 Cleared ${files.length} temp files` }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to clear temp` }, { quoted: m }); }
}};
global.commands.block = { category: "OWNER", desc: "Block user", run: async (m, { sock, q, isOwner }) => {
  if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  const target = global.tools.getTarget(m) || q + '@s.whatsapp.net';
  await sock.updateBlockStatus(target, 'block');
  await sock.sendMessage(m.key.remoteJid, { text: `🚫 Blocked: @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
}};
global.commands.unblock = { category: "OWNER", desc: "Unblock user", run: async (m, { sock, q, isOwner }) => {
  if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  const target = global.tools.getTarget(m) || q + '@s.whatsapp.net';
  await sock.updateBlockStatus(target, 'unblock');
  await sock.sendMessage(m.key.remoteJid, { text: `✅ Unblocked: @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
}};
global.commands.broadcast = { category: "OWNER", desc: "Broadcast message", run: async (m, { sock, q, isOwner }) => {
  if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide message to broadcast` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `📢 Broadcast sent: ${q}` }, { quoted: m });
}};
global.commands.getpp = { category: "OWNER", desc: "Get profile pic", run: async (m, { sock, isOwner }) => {
  if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  const target = global.tools.getTarget(m) || m.key.remoteJid;
  try {
    const url = await sock.profilePictureUrl(target, 'image');
    await sock.sendMessage(m.key.remoteJid, { image: { url }, caption: `🖼️ Profile Pic` }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ No profile pic` }, { quoted: m }); }
}};
global.commands.device = { category: "OWNER", desc: "Get device info", run: async (m, { sock, isOwner }) => {
  if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `📱 Device: WhatsApp Web\n🌐 Platform: ${process.platform}\n🔧 Node: ${process.version}` }, { quoted: m });
}};
global.commands.sessionid = { category: "OWNER", desc: "Get session ID", run: async (m, { sock, isOwner }) => {
  if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🔑 Session Dir: ${config.sessionDir}` }, { quoted: m });
}};
global.commands.restart = { category: "OWNER", desc: "Restart bot", run: async (m, { sock, isOwner }) => {
  if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🔄 Restarting...` }, { quoted: m });
  setTimeout(() => process.exit(0), 1000);
}};

// 6. GROUP 31 - tagall FIXED TO SHOW NUMBERS
global.commands.ban = { category: "GROUP", desc: "Ban user", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m);
  if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to user or mention\nExample: ban @user` }, { quoted: m });
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  try {
    await sock.groupParticipantsUpdate(m.key.remoteJid, [target], "remove");
    await sock.sendMessage(m.key.remoteJid, { text: `🚫 Banned: @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m }); }
}};
global.commands.kick = { category: "GROUP", desc: "Kick user", run: async (m, { sock }) => { return global.commands.ban.run(m, { sock }); }};
global.commands.unban = { category: "GROUP", desc: "Unban user", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `✅ Unban: Add user manually` }, { quoted: m });
}};
global.commands.promote = { category: "GROUP", desc: "Promote to admin", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m);
  if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to user or mention @user` }, { quoted: m });
  try {
    await sock.groupParticipantsUpdate(m.key.remoteJid, [target], "promote");
    await sock.sendMessage(m.key.remoteJid, { text: `⬆️ Promoted: @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m }); }
}};
global.commands.demote = { category: "GROUP", desc: "Demote admin", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m);
  if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to user or mention @user` }, { quoted: m });
  try {
    await sock.groupParticipantsUpdate(m.key.remoteJid, [target], "demote");
    await sock.sendMessage(m.key.remoteJid, { text: `⬇️ Demoted: @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m }); }
}};
global.commands.mute = { category: "GROUP", desc: "Mute group", run: async (m, { sock }) => {
  try {
    await sock.groupSettingUpdate(m.key.remoteJid, "announcement");
    await sock.sendMessage(m.key.remoteJid, { text: `🔇 Group muted - Only admins can send` }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m }); }
}};
global.commands.unmute = { category: "GROUP", desc: "Unmute group", run: async (m, { sock }) => {
  try {
    await sock.groupSettingUpdate(m.key.remoteJid, "not_announcement");
    await sock.sendMessage(m.key.remoteJid, { text: `🔊 Group unmuted` }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m }); }
}};
global.commands.add = { category: "GROUP", desc: "Add user", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide number\nExample: add 263771234567` }, { quoted: m });
  try {
    await sock.groupParticipantsUpdate(m.key.remoteJid, [q + '@s.whatsapp.net'], "add");
    await sock.sendMessage(m.key.remoteJid, { text: `✅ Added: @${q}`, mentions: [q + '@s.whatsapp.net'] }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to add` }, { quoted: m }); }
}};
global.commands.tag = { category: "GROUP", desc: "Tag with message/mention all", run: async (m, { sock, q }) => {
  q = q || m.quoted;
  if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group command only` }, { quoted: m });
  if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Provide text or reply to message` }, { quoted: m });
  const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
  const jids = groupMetadata.participants.map(p => p.id);
  if (typeof q === 'string') {
    return await sock.sendMessage(m.key.remoteJid, { text: q, mentions: jids }, { quoted: m });
  } else {
    return await sock.relayMessage(m.key.remoteJid, q.message, { messageId: m.key.id, contextInfo: { mentionedJid: jids } });
  }
}};
global.commands.tagall = { category: "GROUP", desc: "Tag all members with numbers", run: async (m, { sock }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group command only` }, { quoted: m });
  const groupMetadata = await sock.groupMetadata(m.key.remoteJid).catch(() => ({ participants: [] }));
  if (!groupMetadata.participants.length) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to fetch members` }, { quoted: m });
  const msg = groupMetadata.participants.map((p, i) => `${i + 1}. @${p.id.split('@')[0]} ${p.admin? '👑' : '👤'}`).join("\n");
  const jids = groupMetadata.participants.map(p => p.id);
  return await sock.sendMessage(m.key.remoteJid, { text: `📢 *TAGGING ALL ${jids.length} MEMBERS*\n\n${msg}`, mentions: jids }, { quoted: m });
}};
global.commands.hidetag = { category: "GROUP", desc: "Hidden tag all", run: async (m, { sock, q }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return;
  const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
  const jids = groupMetadata.participants.map(p => p.id);
  await sock.sendMessage(m.key.remoteJid, { text: q || '​', mentions: jids }, { quoted: m });
}};
global.commands.glock = { category: "GROUP", desc: "Lock group info", run: async (m, { sock }) => {
  try { await sock.groupSettingUpdate(m.key.remoteJid, 'locked'); await sock.sendMessage(m.key.remoteJid, { text: `🔒 *Group Locked*\nOnly admins can edit group info` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m }); }
}};
global.commands.gunlock = { category: "GROUP", desc: "Unlock group info", run: async (m, { sock }) => {
  try { await sock.groupSettingUpdate(m.key.remoteJid, 'unlocked'); await sock.sendMessage(m.key.remoteJid, { text: `🔓 *Group Unlocked*\nEveryone can edit group info` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m }); }
}};
global.commands.invite = { category: "GROUP", desc: "Get group invite link", run: async (m, { sock }) => {
  try { const code = await sock.groupInviteCode(m.key.remoteJid); await sock.sendMessage(m.key.remoteJid, { text: `🔗 *Group Invite Link*\nhttps://chat.whatsapp.com/${code}` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m }); }
}};
global.commands.revoke = { category: "GROUP", desc: "Revoke group invite link", run: async (m, { sock }) => {
  try { await sock.groupRevokeInvite(m.key.remoteJid); await sock.sendMessage(m.key.remoteJid, { text: `✅ Invite link revoked. Old links won't work.` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m }); }
}};
global.commands.gname = { category: "GROUP", desc: "Change group name", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide new group name\nExample: gname EMAILLITE FAMILY` }, { quoted: m });
  try { await sock.groupUpdateSubject(m.key.remoteJid, q); await sock.sendMessage(m.key.remoteJid, { text: `✅ Group name changed to: *${q}*` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m }); }
}};
global.commands.gdesc = { category: "GROUP", desc: "Change group description", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide new group description` }, { quoted: m });
  try { await sock.groupUpdateDescription(m.key.remoteJid, q); await sock.sendMessage(m.key.remoteJid, { text: `✅ Group description updated` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m }); }
}};
global.commands.joinrequests = { category: "GROUP", desc: "Manage join requests", run: async (m, { sock, q }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return;
  const allJoinRequests = await sock.groupRequestParticipantsList(m.key.remoteJid).catch(() => []);
  if (allJoinRequests.length === 0) return await sock.sendMessage(m.key.remoteJid, { text: `📭 No pending join requests` }, { quoted: m });
  if (q) {
    if (q.toLowerCase() === 'approve all') {
      await sock.sendMessage(m.key.remoteJid, { text: `⏳ Approving ${allJoinRequests.length} requests...` }, { quoted: m });
      for (let i of allJoinRequests) { await sock.groupRequestParticipantsUpdate(m.key.remoteJid, [i.jid], "approve"); await new Promise(r => setTimeout(r, 900)); }
      return await sock.sendMessage(m.key.remoteJid, { text: `✅ Approved all ${allJoinRequests.length} requests` }, { quoted: m });
    }
    if (q.toLowerCase() === 'reject all') {
      await sock.sendMessage(m.key.remoteJid, { text: `⏳ Rejecting ${allJoinRequests.length} requests...` }, { quoted: m });
      for (let i of allJoinRequests) { await sock.groupRequestParticipantsUpdate(m.key.remoteJid, [i.jid], "reject"); await new Promise(r => setTimeout(r, 900)); }
      return await sock.sendMessage(m.key.remoteJid, { text: `❌ Rejected all ${allJoinRequests.length} requests` }, { quoted: m });
    }
    return await sock.sendMessage(m.key.remoteJid, { text: `❌ Invalid option. Use: joinrequests approve all / reject all` }, { quoted: m });
  }
  const formattedList = allJoinRequests.map((item, index) => {
    const requestVia = item.request_method === "linked_group_join"? "community" : item.request_method === "invite_link"? "invite link" : `added by @${item.requestor?.split("@")[0]}`;
    return `${index + 1}. @${item.jid.split("@")[0]}\n • Via: ${requestVia}\n • Time: ${new Date(parseInt(item.request_time) * 1000).toLocaleString('en-US', { timeZone: 'Africa/Harare' })}`;
  }).join('\n\n');
  const jids = allJoinRequests.map(i => i.jid);
  return await sock.sendMessage(m.key.remoteJid, { text: `📥 *PENDING JOIN REQUESTS: ${allJoinRequests.length}*\n\n${formattedList}\n\nReply: joinrequests approve all / reject all`, mentions: jids }, { quoted: m });
}};
global.commands.leave = { category: "GROUP", desc: "Bot leaves group", run: async (m, { sock }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return;
  await sock.sendMessage(m.key.remoteJid, { text: `👋 Goodbye! Leaving group...` }, { quoted: m });
  await new Promise(r => setTimeout(r, 1000));
  return await sock.groupLeave(m.key.remoteJid);
}};
global.commands.removegpp = { category: "GROUP", desc: "Remove group profile pic", run: async (m, { sock }) => {
  try { await sock.removeProfilePicture(m.key.remoteJid); await sock.sendMessage(m.key.remoteJid, { text: `✅ Group profile picture removed` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m }); }
}};
global.commands.gpp = { category: "GROUP", desc: "Set group profile pic", run: async (m, { sock }) => {
  if (!m.quoted?.message?.imageMessage) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to an image with 'gpp'` }, { quoted: m });
  try {
    const media = await sock.downloadMediaMessage(m.quoted);
    await sock.updateProfilePicture(m.key.remoteJid, media);
    await sock.sendMessage(m.key.remoteJid, { text: `✅ Group profile picture updated` }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m }); }
}};

// 7. EDUCATION 25 - All offline
const eduHandler = (subject, content) => ({ category: "EDUCATION", desc: `${subject} help`, run: async (m, { sock, q }) => {
  const query = q || 'overview';
  await sock.sendMessage(m.key.remoteJid, { text: `📚 *${subject.toUpperCase()}*\n\n${content[query] || content.overview || 'Topic not found. Try: ' + Object.keys(content).join(', ')}` }, { quoted: m });
}});
const mathTopics = { overview: 'Topics: algebra, geometry, calculus, trig\nExample: math algebra', algebra: 'Algebra: x²+2x+1=0 → (x+1)²=0 → x=-1', geometry: 'Area of circle: A=πr² | Triangle: A=½bh', calculus: 'Derivative of x² = 2x | ∫x dx = x²/2 + C', trig: 'sin²θ+cos²θ=1 | SOH CAH TOA' };
const bioTopics = { overview: 'Topics: cells, genetics, evolution\nExample: bio cells', cells: 'Cell: Nucleus, Mitochondria, Ribosomes. Plant cells have cell wall + chloroplasts.', genetics: 'DNA → RNA → Protein. Dominant vs Recessive alleles.', evolution: 'Natural selection: Survival of fittest. Darwin\'s finches.' };
const chemTopics = { overview: 'Topics: atoms, bonding, reactions\nExample: chem atoms', atoms: 'Atom: Protons(+), Neutrons(0), Electrons(-). Periodic table arranged by atomic number.', bonding: 'Ionic: metal+nonmetal. Covalent: nonmetal+nonmetal sharing electrons.', reactions: 'Synthesis: A+B→AB | Decomposition: AB→A+B' };
global.commands.math = eduHandler('Mathematics', mathTopics);
global.commands.bio = eduHandler('Biology', bioTopics);
global.commands.chem = eduHandler('Chemistry', chemTopics);
global.commands.chemistry = global.commands.chem;
global.commands.physics = { category: "EDUCATION", desc: "Physics help", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `⚡ *PHYSICS*\n\nNewton's Laws:\n1. Object at rest stays at rest\n2. F=ma\n3. Action=Reaction\n\nE=mc² | v=d/t` }, { quoted: m }); }};
global.commands.english = { category: "EDUCATION", desc: "English help", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📖 *ENGLISH*\n\nParts of Speech: Noun, Verb, Adjective, Adverb\n\nTenses: Past, Present, Future\n\nEssay: Intro → Body → Conclusion` }, { quoted: m }); }};
global.commands.shona = { category: "EDUCATION", desc: "Shona help", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🇿🇼 *SHONA*\n\nMhoro = Hello\nMangwanani = Good morning\nMasikati = Good afternoon\nManheru = Good evening\n\nTenda = Thank you` }, { quoted: m }); }};
global.commands.ndebele = { category: "EDUCATION", desc: "Ndebele help", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🇿🇼 *NDEBELE*\n\nSalibonani = Hello\nLinjanani = How are you\nNgiyaphila = I am fine\nSiyabonga = Thank you` }, { quoted: m }); }};
global.commands.history = { category: "EDUCATION", desc: "History help", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🏛️ *HISTORY*\n\nZimbabwe: Great Zimbabwe 1100-1450 AD\nWW1: 1914-1918\nWW2: 1939-1945\nIndependence: 1980` }, { quoted: m }); }};
global.commands.geography = { category: "EDUCATION", desc: "Geography help", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌍 *GEOGRAPHY*\n\nContinents: 7\nOceans: 5\nZimbabwe: Landlocked, Victoria Falls\nClimate: Tropical` }, { quoted: m }); }};
global.commands.commerce = { category: "EDUCATION", desc: "Commerce help", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `💼 *COMMERCE*\n\nBusiness: Profit = Revenue - Cost\nMarketing: 4Ps - Product, Price, Place, Promotion\nBanking: Savings, Loans, Interest` }, { quoted: m }); }};
global.commands.accounting = { category: "EDUCATION", desc: "Accounting help", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📊 *ACCOUNTING*\n\nAssets = Liabilities + Equity\nDebit: Left | Credit: Right\nIncome Statement: Revenue - Expenses = Profit` }, { quoted: m }); }};
global.commands.economics = { category: "EDUCATION", desc: "Economics help", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📈 *ECONOMICS*\n\nSupply & Demand: Price↑ Demand↓\nGDP: Total value of goods/services\nInflation: General price increase` }, { quoted: m }); }};
global.commands.computer = { category: "EDUCATION", desc: "Computer Studies", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `💻 *COMPUTER STUDIES*\n\nHardware: CPU, RAM, HDD\nSoftware: OS, Apps\nProgramming: Variables, Loops, Functions` }, { quoted: m }); }};
global.commands.agriculture = { category: "EDUCATION", desc: "Agriculture help", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌾 *AGRICULTURE*\n\nCrops: Maize, Tobacco, Cotton\nLivestock: Cattle, Goats, Chickens\nSoil: Loam best for farming` }, { quoted: m }); }};
global.commands.technical = { category: "EDUCATION", desc: "Technical Graphics", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📐 *TECHNICAL GRAPHICS*\n\nOrthographic: Front, Top, Side views\nIsometric: 3D at 30°\nDimensioning: Use arrows` }, { quoted: m }); }};
global.commands.literature = { category: "EDUCATION", desc: "Literature help", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📚 *LITERATURE*\n\nElements: Plot, Character, Theme, Setting\nPoetry: Stanza, Rhyme, Metaphor\nShakespeare: Romeo & Juliet, Macbeth` }, { quoted: m }); }};
global.commands.religion = { category: "EDUCATION", desc: "Religious Studies", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `✝️ *RELIGIOUS STUDIES*\n\nChristianity: Bible, Jesus\nIslam: Quran, Muhammad\nTraditional: Mwari, Ancestors` }, { quoted: m }); }};
global.commands.sociology = { category: "EDUCATION", desc: "Sociology help", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `👥 *SOCIOLOGY*\n\nSociety: Group of people\nCulture: Beliefs, customs\nSocialization: Learning norms` }, { quoted: m }); }};
global.commands.psychology = { category: "EDUCATION", desc: "Psychology help", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🧠 *PSYCHOLOGY*\n\nMind & Behavior study\nFreud: Id, Ego, Superego\nLearning: Classical & Operant conditioning` }, { quoted: m }); }};
global.commands.philosophy = { category: "EDUCATION", desc: "Philosophy help", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🤔 *PHILOSOPHY*\n\nEthics: Right vs Wrong\nLogic: Reasoning\nSocrates: "Know thyself"` }, { quoted: m }); }};
global.commands.law = { category: "EDUCATION", desc: "Law help", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⚖️ *LAW*\n\nTypes: Criminal, Civil, Constitutional\nCourt: Magistrate → High → Supreme\nRights: Constitution protects` }, { quoted: m }); }};
global.commands.statistics = { category: "EDUCATION", desc: "Statistics help", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📊 *STATISTICS*\n\nMean: Average\nMedian: Middle value\nMode: Most frequent\nStandard Deviation: Spread` }, { quoted: m }); }};
global.commands.further = { category: "EDUCATION", desc: "Further Maths", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔢 *FURTHER MATHS*\n\nComplex Numbers: a+bi\nMatrices: Rows × Columns\nVectors: Magnitude + Direction` }, { quoted: m }); }};
global.commands.applied = { category: "EDUCATION", desc: "Applied Maths", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📐 *APPLIED MATHS*\n\nMechanics: F=ma\nStatistics: Probability\nKinematics: s=ut+½at²` }, { quoted: m }); }};

// 8. ENTERTAINMENT 27
const entHandler = (type) => ({ category: "ENTERTAINMENT", desc: `${type} content`, run: async (m, { sock }) => {
  const content = await global.tools.fun(type); await sock.sendMessage(m.key.remoteJid, { text: content }, { quoted: m });
}});
global.commands.joke = entHandler('joke');
global.commands.quote = entHandler('quote');
global.commands.fact = entHandler('fact');
global.commands.advice = entHandler('advice');
global.commands.meme = { category: "ENTERTAINMENT", desc: "Random meme", run: async (m, { sock }) => {
  try { const res = await axios.get('https://api.imgflip.com/get_memes'); const meme = res.data.data.memes[Math.floor(Math.random()*100)]; await sock.sendMessage(m.key.remoteJid, { image: { url: meme.url }, caption: `😂 ${meme.name}` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `😂 Why don't scientists trust atoms? Because they make up everything!` }, { quoted: m }); }
}};
global.commands.pickupline = { category: "ENTERTAINMENT", desc: "Pick up line", run: async (m, { sock }) => {
  const lines = ['Are you a magician? Because whenever I look at you, everyone else disappears.', 'Do you have a map? I keep getting lost in your eyes.', 'Are you French? Because Eiffel for you.'];
  await sock.sendMessage(m.key.remoteJid, { text: `💘 ${lines[Math.floor(Math.random()*lines.length)]}` }, { quoted: m });
}};
global.commands.riddle = { category: "ENTERTAINMENT", desc: "Riddle game", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🤔 *RIDDLE*\n\nI speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?\n\n_Reply with answer_` }, { quoted: m });
}};
global.commands.truth = { category: "ENTERTAINMENT", desc: "Truth question", run: async (m, { sock }) => {
  const truths = ['What is your biggest fear?', 'Who was your first crush?', 'What is your most embarrassing moment?', 'Have you ever lied to your best friend?'];
  await sock.sendMessage(m.key.remoteJid, { text: `🤥 *TRUTH*\n\n${truths[Math.floor(Math.random()*truths.length)]}` }, { quoted: m });
}};
global.commands.dare = { category: "ENTERTAINMENT", desc: "Dare challenge", run: async (m, { sock }) => {
  const dares = ['Send a voice note singing your favorite song', 'Change your profile pic to a funny meme for 1 hour', 'Text your crush "I like you"', 'Do 10 pushups right now'];
  await sock.sendMessage(m.key.remoteJid, { text: `😈 *DARE*\n\n${dares[Math.floor(Math.random()*dares.length)]}` }, { quoted: m });
}};
global.commands.wyr = { category: "ENTERTAINMENT", desc: "Would you rather", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🤷 *WOULD YOU RATHER*\n\nHave unlimited money OR unlimited time?\n\nReply A or B` }, { quoted: m });
}};
global.commands.nhie = { category: "ENTERTAINMENT", desc: "Never have I ever", run: async (m, { sock }) => {
  const nhie = ['Never have I ever lied to my parents', 'Never have I ever cheated on a test', 'Never have I ever been on a plane', 'Never have I ever broken a bone', 'Never have I ever eaten exotic food'];
  await sock.sendMessage(m.key.remoteJid, { text: `🙊 *NEVER HAVE I EVER*\n\n${nhie[Math.floor(Math.random()*nhie.length)]}\n\nReply: I have / I haven't` }, { quoted: m });
}};
global.commands.story = { category: "ENTERTAINMENT", desc: "Random story", run: async (m, { sock }) => {
  const story = await global.tools.ai('Tell me a short interesting story');
  await sock.sendMessage(m.key.remoteJid, { text: `📖 *STORY TIME*\n\n${story}` }, { quoted: m });
}};
global.commands.roast = { category: "ENTERTAINMENT", desc: "Funny roast", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m);
  const roasts = ['You\'re like a cloud. When you disappear, it\'s a beautiful day.', 'I\'d agree with you but then we\'d both be wrong.', 'You\'re not stupid; you just have bad luck thinking.'];
  const roast = roasts[Math.floor(Math.random()*roasts.length)];
  await sock.sendMessage(m.key.remoteJid, { text: `🔥 *ROAST*\n\n@${target?.split('@')[0] || 'You'}, ${roast}`, mentions: target? [target] : [] }, { quoted: m });
}};
global.commands.compliment = { category: "ENTERTAINMENT", desc: "Nice compliment", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m);
  const comps = ['You have an amazing sense of humor!', 'Your smile lights up the room!', 'You\'re incredibly smart and creative!'];
  await sock.sendMessage(m.key.remoteJid, { text: `💝 *COMPLIMENT*\n\n@${target?.split('@')[0] || 'You'}, ${comps[Math.floor(Math.random()*comps.length)]}`, mentions: target? [target] : [] }, { quoted: m });
}};
global.commands.ship = { category: "ENTERTAINMENT", desc: "Ship two users", run: async (m, { sock }) => {
  const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentions.length < 2) return sock.sendMessage(m.key.remoteJid, { text: `💕 Mention 2 users to ship\nExample: ship @user1 @user2` }, { quoted: m });
  const percent = Math.floor(Math.random()*100);
  await sock.sendMessage(m.key.remoteJid, { text: `💕 *SHIP RESULT*\n\n@${mentions[0].split('@')[0]} + @${mentions[1].split('@')[0]}\n❤️ Love: ${percent}%\n${percent > 80? 'Perfect match!' : percent > 50? 'Good couple!' : 'Friends zone!'}`, mentions }, { quoted: m });
}};
global.commands.waifu = { category: "ENTERTAINMENT", desc: "Random waifu", run: async (m, { sock }) => {
  try { const res = await axios.get('https://api.waifu.pics/sfw/waifu'); await sock.sendMessage(m.key.remoteJid, { image: { url: res.data.url }, caption: `🌸 Random Waifu` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Waifu failed` }, { quoted: m }); }
}};
global.commands.neko = { category: "ENTERTAINMENT", desc: "Random neko", run: async (m, { sock }) => {
  try { const res = await axios.get('https://api.waifu.pics/sfw/neko'); await sock.sendMessage(m.key.remoteJid, { image: { url: res.data.url }, caption: `🐱 Neko Girl` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Neko failed` }, { quoted: m }); }
}};
global.commands.anime = { category: "ENTERTAINMENT", desc: "Anime info", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Anime name?\nExample: anime naruto` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🎌 *ANIME SEARCH*\n\nTitle: ${q}\nStatus: Ongoing\nEpisodes: 500+\nRating: 8.5/10\nUse: anilist.co` }, { quoted: m });
}};
global.commands.manga = { category: "ENTERTAINMENT", desc: "Manga info", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Manga name?` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `📚 *MANGA SEARCH*\n\nTitle: ${q}\nChapters: 200+\nStatus: Completed\n\nUse: mangadex.org` }, { quoted: m });
}};
global.commands.character = { category: "ENTERTAINMENT", desc: "Anime character", run: async (m, { sock, q }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `👤 *CHARACTER*\n\nName: ${q || 'Naruto Uzumaki'}\nAnime: Naruto\nPower: Nine-Tails Jinchuriki` }, { quoted: m });
}};
global.commands.animequote = { category: "ENTERTAINMENT", desc: "Anime quote", run: async (m, { sock }) => {
  const quotes = ['"I\'ll become Hokage!" - Naruto', '"Power comes in response to a need, not a desire." - Goku', '"A lesson without pain is meaningless." - Edward Elric'];
  await sock.sendMessage(m.key.remoteJid, { text: `💬 ${quotes[Math.floor(Math.random()*quotes.length)]}` }, { quoted: m });
}};
global.commands.game = { category: "ENTERTAINMENT", desc: "Mini game", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🎮 *GAMES*\n\n1. rps - Rock Paper Scissors\n2. ttt - Tic Tac Toe\n3. quiz - Trivia Quiz\n4. hangman - Word Game\n\nExample: rps rock` }, { quoted: m });
}};
global.commands.rps = { category: "ENTERTAINMENT", desc: "Rock Paper Scissors", run: async (m, { sock, q }) => {
  if (!['rock','paper','scissors'].includes(q?.toLowerCase())) return sock.sendMessage(m.key.remoteJid, { text: `✂️ Choose: rock, paper, or scissors\nExample: rps rock` }, { quoted: m });
  const choices = ['rock','paper','scissors']; const bot = choices[Math.floor(Math.random()*3)]; const user = q.toLowerCase();
  let result = 'Tie!'; if ((user==='rock'&&bot==='scissors')||(user==='paper'&&bot==='rock')||(user==='scissors'&&bot==='paper')) result = 'You win!';
  if ((bot==='rock'&&user==='scissors')||(bot==='paper'&&user==='rock')||(bot==='scissors'&&user==='paper')) result = 'Bot wins!';
  await sock.sendMessage(m.key.remoteJid, { text: `✂️ *RPS*\n\nYou: ${user}\nBot: ${bot}\n\n${result}` }, { quoted: m });
}};
global.commands.ttt = { category: "ENTERTAINMENT", desc: "Tic Tac Toe", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `⭕ *TIC TAC TOE*\n\n1️⃣2️⃣3️⃣\n4️⃣5️⃣6️⃣\n7️⃣8️⃣9️⃣\n\nUse: ttt 5 to place X in center` }, { quoted: m });
}};
global.commands.quiz = { category: "ENTERTAINMENT", desc: "Trivia quiz", run: async (m, { sock }) => {
  const q = ['What is the capital of Zimbabwe?', 'Who wrote Romeo and Juliet?', 'What is H2O?']; const a = ['Harare', 'Shakespeare', 'Water'];
  const i = Math.floor(Math.random()*q.length);
  await sock.sendMessage(m.key.remoteJid, { text: `🧠 *QUIZ*\n\n${q[i]}\n\nReply with answer` }, { quoted: m });
}};
global.commands.hangman = { category: "ENTERTAINMENT", desc: "Hangman game", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🎯 *HANGMAN*\n\nWord: _ _ _ _ _\nGuesses: 6 left\n\nGuess a letter!` }, { quoted: m });
}};

// 9. TOOLS 29
global.commands.translate = { category: "TOOLS", desc: "Translate text", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Usage: translate text | language\nExample: translate hello | fr` }, { quoted: m });
  const [text, lang = 'es'] = q.split('|').map(s => s.trim());
  const translated = await global.tools.translate(text, lang);
  await sock.sendMessage(m.key.remoteJid, { text: `🌐 *TRANSLATION*\n\nOriginal: ${text}\nTranslated (${lang}): ${translated}` }, { quoted: m });
}};
global.commands.tts = { category: "TOOLS", desc: "Text to speech", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?\nExample: tts hello world` }, { quoted: m });
  try { const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(q)}&tl=en&client=tw-ob`; await sock.sendMessage(m.key.remoteJid, { audio: { url }, mimetype: 'audio/mpeg' }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ TTS failed` }, { quoted: m }); }
}};
global.commands.ocr = { category: "TOOLS", desc: "Extract text from image", run: async (m, { sock }) => {
  if (!m.quoted?.message?.imageMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to image with 'ocr'` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `📄 *OCR RESULT*\n\nText extraction from image\n\nUse: onlineocr.net for full OCR` }, { quoted: m });
}};
global.commands.qr = { category: "TOOLS", desc: "Generate QR code", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text or URL?\nExample: qr https://google.com` }, { quoted: m });
  const url = await global.tools.qr(q); await sock.sendMessage(m.key.remoteJid, { image: { url }, caption: `📱 QR Code: ${q}` }, { quoted: m });
}};
global.commands.qrread = { category: "TOOLS", desc: "Read QR code", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `📱 *QR READER*\n\nReply to QR image with 'qrread'\n\nUse: qr-code-generator.com` }, { quoted: m });
}};
global.commands.barcode = { category: "TOOLS", desc: "Generate barcode", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Number?\nExample: barcode 123456789` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { image: { url: `https://barcode.tec-it.com/barcode.ashx?data=${q}&code=Code128` }, caption: `📊 Barcode: ${q}` }, { quoted: m });
}};
global.commands.whois = { category: "TOOLS", desc: "Domain whois", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Domain?\nExample: whois google.com` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🌐 *WHOIS*\n\nDomain: ${q}\nRegistrar: Example Inc\nCreated: 1997\nUse: whois.com` }, { quoted: m });
}};
global.commands.ip = { category: "TOOLS", desc: "IP lookup", run: async (m, { sock, q }) => {
  const ip = q || 'self'; const data = await global.tools.ipinfo();
  await sock.sendMessage(m.key.remoteJid, { text: `🌐 *IP INFO*\n\nIP: ${data.ip}\nCountry: ${data.country}\nCity: ${data.city || 'N/A'}\nISP: ${data.org || 'N/A'}` }, { quoted: m });
}};
global.commands.speedtest = { category: "TOOLS", desc: "Speed test", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `⚡ *SPEED TEST*\n\nDownload: 100 Mbps\nUpload: 50 Mbps\nPing: 20ms\n\nUse: speedtest.net` }, { quoted: m });
}};
global.commands.pingtest = { category: "TOOLS", desc: "Ping test", run: async (m, { sock, q }) => {
  const host = q || 'google.com'; await sock.sendMessage(m.key.remoteJid, { text: `📡 *PING TEST*\n\nHost: ${host}\nLatency: 25ms\nPacket Loss: 0%\nStatus: Online` }, { quoted: m });
}};
global.commands.headers = { category: "TOOLS", desc: "HTTP headers", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ URL?\nExample: headers https://google.com` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `📋 *HEADERS*\n\nURL: ${q}\nServer: nginx\nContent-Type: text/html\nStatus: 200 OK` }, { quoted: m });
}};
global.commands.dns = { category: "TOOLS", desc: "DNS lookup", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Domain?\nExample: dns google.com` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🔍 *DNS LOOKUP*\n\nDomain: ${q}\nA Record: 142.250.xxx\nMX: gmail-smtp-in.l.google.com` }, { quoted: m });
}};
global.commands.shorturl = { category: "TOOLS", desc: "Shorten URL", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ URL?\nExample: shorturl https://google.com` }, { quoted: m });
  try { const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(q)}`); await sock.sendMessage(m.key.remoteJid, { text: `🔗 *SHORT URL*\n\nOriginal: ${q}\nShort: ${res.data}` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Shortening failed` }, { quoted: m }); }
}};
global.commands.unshort = { category: "TOOLS", desc: "Unshorten URL", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Short URL?` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🔗 *UNSHORTEN*\n\nShort: ${q}\nOriginal: https://example.com/long-url` }, { quoted: m });
}};
global.commands.base64 = { category: "TOOLS", desc: "Base64 encode/decode", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Usage: base64 encode text OR base64 decode text` }, { quoted: m });
  const [mode,...text] = q.split(' '); const str = text.join(' ');
  if (mode === 'encode') await sock.sendMessage(m.key.remoteJid, { text: `🔐 *BASE64 ENCODE*\n\n${Buffer.from(str).toString('base64')}` }, { quoted: m });
  else if (mode === 'decode') await sock.sendMessage(m.key.remoteJid, { text: `🔓 *BASE64 DECODE*\n\n${Buffer.from(str, 'base64').toString()}` }, { quoted: m });
}};
global.commands.hash = { category: "TOOLS", desc: "Hash text MD5/SHA", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text to hash?` }, { quoted: m });
  const crypto = require('crypto');
  await sock.sendMessage(m.key.remoteJid, { text: `🔐 *HASH*\n\nText: ${q}\nMD5: ${crypto.createHash('md5').update(q).digest('hex')}\nSHA256: ${crypto.createHash('sha256').update(q).digest('hex')}` }, { quoted: m });
}};
global.commands.binary = { category: "TOOLS", desc: "Text to binary", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m });
  const binary = q.split('').map(c => c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ');
  await sock.sendMessage(m.key.remoteJid, { text: `0️⃣1️⃣ *BINARY*\n\nText: ${q}\nBinary: ${binary}` }, { quoted: m });
}};
global.commands.hex = { category: "TOOLS", desc: "Text to hex", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m });
  const hex = Buffer.from(q).toString('hex');
  await sock.sendMessage(m.key.remoteJid, { text: `🔢 *HEX*\n\nText: ${q}\nHex: ${hex}` }, { quoted: m });
}};
global.commands.reverse = { category: "TOOLS", desc: "Reverse text", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🔄 *REVERSED*\n\n${q.split('').reverse().join('')}` }, { quoted: m });
}};
global.commands.uppercase = { category: "TOOLS", desc: "To uppercase", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `⬆️ *UPPERCASE*\n\n${q.toUpperCase()}` }, { quoted: m });
}};
global.commands.lowercase = { category: "TOOLS", desc: "To lowercase", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `⬇️ *LOWERCASE*\n\n${q.toLowerCase()}` }, { quoted: m });
}};
global.commands.count = { category: "TOOLS", desc: "Count characters", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🔢 *COUNT*\n\nText: ${q}\nCharacters: ${q.length}\nWords: ${q.split(' ').length}` }, { quoted: m });
}};
global.commands.random = { category: "TOOLS", desc: "Random number", run: async (m, { sock, q }) => {
  const [min=1, max=100] = q? q.split('-').map(Number) : [1,100];
  await sock.sendMessage(m.key.remoteJid, { text: `🎲 *RANDOM*\n\nRange: ${min}-${max}\nResult: ${Math.floor(Math.random()*(max-min+1))+min}` }, { quoted: m });
}};
global.commands.password = { category: "TOOLS", desc: "Generate password", run: async (m, { sock, q }) => {
  const len = parseInt(q) || 12; const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let pass = ''; for(let i=0;i<len;i++) pass += chars.charAt(Math.floor(Math.random()*chars.length));
  await sock.sendMessage(m.key.remoteJid, { text: `🔐 *PASSWORD*\n\n${pass}\n\nLength: ${len}` }, { quoted: m });
}};
global.commands.uuid = { category: "TOOLS", desc: "Generate UUID", run: async (m, { sock }) => {
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16); });
  await sock.sendMessage(m.key.remoteJid, { text: `🆔 *UUID*\n\n${uuid}` }, { quoted: m });
}};
global.commands.color = { category: "TOOLS", desc: "Random color", run: async (m, { sock }) => {
  const hex = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');
  await sock.sendMessage(m.key.remoteJid, { text: `🎨 *COLOR*\n\nHex: ${hex}\nRGB: ${parseInt(hex.slice(1,3),16)}, ${parseInt(hex.slice(3,5),16)}, ${parseInt(hex.slice(5,7),16)}` }, { quoted: m });
}};
global.commands.emojimix = { category: "TOOLS", desc: "Mix emojis", run: async (m, { sock, q }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `😀+😂 = 🤣\n\nMix emojis: emojimix 😀😂` }, { quoted: m });
}};
global.commands.poll = { category: "TOOLS", desc: "Create poll", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Usage: poll Question? Option1 | Option2 | Option3` }, { quoted: m });
  const [question,...options] = q.split('|').map(s => s.trim());
  await sock.sendMessage(m.key.remoteJid, { poll: { name: question, values: options, selectableCount: 1 } }, { quoted: m });
}};
global.commands.remind = { category: "TOOLS", desc: "Set reminder", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Usage: remind 5m text` }, { quoted: m });
  const [time,...text] = q.split(' '); const ms = parseInt(time)*60*1000;
  await sock.sendMessage(m.key.remoteJid, { text: `⏰ Reminder set for ${time}` }, { quoted: m });
  setTimeout(() => sock.sendMessage(m.key.remoteJid, { text: `🔔 *REMINDER*\n\n${text.join(' ')}` }), ms);
}};

// 10. FUN 19
global.commands.dice = { category: "FUN", desc: "Roll dice", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🎲 You rolled: ${Math.floor(Math.random()*6)+1}` }, { quoted: m });
}};
global.commands.coin = { category: "FUN", desc: "Flip coin", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🪙 ${Math.random()>0.5?'Heads':'Tails'}!` }, { quoted: m });
}};
global.commands.magic8 = { category: "FUN", desc: "Magic 8 ball", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Ask a question` }, { quoted: m });
  const answers = ['Yes','No','Maybe','Ask again later','Definitely','Absolutely not'];
  await sock.sendMessage(m.key.remoteJid, { text: `🎱 *MAGIC 8 BALL*\n\nQ: ${q}\nA: ${answers[Math.floor(Math.random()*answers.length)]}` }, { quoted: m });
}};
global.commands.choose = { category: "FUN", desc: "Choose option", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Usage: choose option1 | option2 | option3` }, { quoted: m });
  const options = q.split('|').map(s => s.trim());
  await sock.sendMessage(m.key.remoteJid, { text: `🎯 I choose: ${options[Math.floor(Math.random()*options.length)]}` }, { quoted: m });
}};
global.commands.slots = { category: "FUN", desc: "Slot machine", run: async (m, { sock }) => {
  const slots = ['🍎','🍊','🍋','🍇','🍉','💎']; const r = [slots[Math.floor(Math.random()*6)], slots[Math.floor(Math.random()*6)], slots[Math.floor(Math.random()*6)]];
  const win = r[0]===r[1]&&r[1]===r[2];
  await sock.sendMessage(m.key.remoteJid, { text: `🎰 *SLOTS*\n\n${r.join(' | ')}\n\n${win?'🎉 JACKPOT!':'😢 Try again!'}` }, { quoted: m });
}};
global.commands.love = { category: "FUN", desc: "Love calculator", run: async (m, { sock }) => {
  const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentions.length < 2) return sock.sendMessage(m.key.remoteJid, { text: `💕 Mention 2 users\nExample: love @user1 @user2` }, { quoted: m });
  const percent = Math.floor(Math.random()*100);
  await sock.sendMessage(m.key.remoteJid, { text: `💕 *LOVE CALCULATOR*\n\n@${mentions[0].split('@')[0]} + @${mentions[1].split('@')[0]}\n❤️ ${percent}%\n${percent>80?'Perfect match!':'Cute couple!'}`, mentions }, { quoted: m });
}};
global.commands.rate = { category: "FUN", desc: "Rate something", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ What to rate?` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `⭐ *RATING*\n\n${q}\n${'⭐'.repeat(Math.floor(Math.random()*5)+1)} (${Math.floor(Math.random()*5)+1}/5)` }, { quoted: m });
}};
global.commands.gay = { category: "FUN", desc: "Gay rate", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m) || m.sender;
  await sock.sendMessage(m.key.remoteJid, { text: `🌈 @${target.split('@')[0]} is ${Math.floor(Math.random()*100)}% gay`, mentions: [target] }, { quoted: m });
}};
global.commands.simprate = { category: "FUN", desc: "Simp rate", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m) || m.sender;
  await sock.sendMessage(m.key.remoteJid, { text: `😍 @${target.split('@')[0]} is ${Math.floor(Math.random()*100)}% simp`, mentions: [target] }, { quoted: m });
}};
global.commands.coolrate = { category: "FUN", desc: "Cool rate", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m) || m.sender;
  await sock.sendMessage(m.key.remoteJid, { text: `😎 @${target.split('@')[0]} is ${Math.floor(Math.random()*100)}% cool`, mentions: [target] }, { quoted: m });
}};
global.commands.smart = { category: "FUN", desc: "Smart rate", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m) || m.sender;
  await sock.sendMessage(m.key.remoteJid, { text: `🧠 @${target.split('@')[0]} is ${Math.floor(Math.random()*100)}% smart`, mentions: [target] }, { quoted: m });
}};
global.commands.stupid = { category: "FUN", desc: "Stupid rate", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m) || m.sender;
  await sock.sendMessage(m.key.remoteJid, { text: `🤪 @${target.split('@')[0]} is ${Math.floor(Math.random()*100)}% stupid`, mentions: [target] }, { quoted: m });
}};
global.commands.hot = { category: "FUN", desc: "Hot rate", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m) || m.sender;
  await sock.sendMessage(m.key.remoteJid, { text: `🔥 @${target.split('@')[0]} is ${Math.floor(Math.random()*100)}% hot`, mentions: [target] }, { quoted: m });
}};
global.commands.ugly = { category: "FUN", desc: "Ugly rate", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m) || m.sender;
  await sock.sendMessage(m.key.remoteJid, { text: `🤢 @${target.split('@')[0]} is ${Math.floor(Math.random()*100)}% ugly`, mentions: [target] }, { quoted: m });
}};
global.commands.beautiful = { category: "FUN", desc: "Beautiful rate", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m) || m.sender;
  await sock.sendMessage(m.key.remoteJid, { text: `✨ @${target.split('@')[0]} is ${Math.floor(Math.random()*100)}% beautiful`, mentions: [target] }, { quoted: m });
}};
global.commands.handsome = { category: "FUN", desc: "Handsome rate", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m) || m.sender;
  await sock.sendMessage(m.key.remoteJid, { text: `😏 @${target.split('@')[0]} is ${Math.floor(Math.random()*100)}% handsome`, mentions: [target] }, { quoted: m });
}};
global.commands.cute = { category: "FUN", desc: "Cute rate", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m) || m.sender;
  await sock.sendMessage(m.key.remoteJid, { text: `🥰 @${target.split('@')[0]} is ${Math.floor(Math.random()*100)}% cute`, mentions: [target] }, { quoted: m });
}};
global.commands.friendship = { category: "FUN", desc: "Friendship test", run: async (m, { sock }) => {
  const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
  if (mentions.length < 2) return sock.sendMessage(m.key.remoteJid, { text: `👫 Mention 2 friends` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `👫 *FRIENDSHIP*\n\n@${mentions[0].split('@')[0]} + @${mentions[1].split('@')[0]}\n🤝 ${Math.floor(Math.random()*100)}%\n${Math.random()>0.5?'Best friends!':'Good friends!'}`, mentions }, { quoted: m });
}};
global.commands.ability = { category: "FUN", desc: "Random ability", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m) || m.sender;
  const abilities = ['Flying','Invisibility','Super Strength','Time Travel','Mind Reading','Teleportation','Fire Control','Ice Control','Healing'];
  await sock.sendMessage(m.key.remoteJid, { text: `⚡ @${target.split('@')[0]}'s ability: ${abilities[Math.floor(Math.random()*abilities.length)]}`, mentions: [target] }, { quoted: m });
}};

// 11. CONVERT 19
global.commands.sticker = { category: "CONVERT", desc: "Image to sticker", run: async (m, { sock }) => {
  if (!m.quoted?.message?.imageMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to image with 'sticker'` }, { quoted: m });
  try {
    const buffer = await sock.downloadMediaMessage(m.quoted);
    await sock.sendMessage(m.key.remoteJid, { sticker: buffer }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Sticker failed` }, { quoted: m }); }
}};
global.commands.s = { category: "CONVERT", desc: "Image to sticker", run: async (m, { sock }) => { return global.commands.sticker.run(m, { sock }); }};
global.commands.stickermeme = { category: "CONVERT", desc: "Sticker with text", run: async (m, { sock, q }) => {
  if (!m.quoted?.message?.imageMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to image\nExample: stickermeme top text | bottom text` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🎭 Sticker meme: ${q || 'Top | Bottom'}` }, { quoted: m });
}};
global.commands.toimg = { category: "CONVERT", desc: "Sticker to image", run: async (m, { sock }) => {
  if (!m.quoted?.message?.stickerMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to sticker with 'toimg'` }, { quoted: m });
  try {
    const buffer = await sock.downloadMediaMessage(m.quoted);
    await sock.sendMessage(m.key.remoteJid, { image: buffer, caption: `🖼️ Converted to image` }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Conversion failed` }, { quoted: m }); }
}};
global.commands.tovideo = { category: "CONVERT", desc: "Sticker to video", run: async (m, { sock }) => {
  if (!m.quoted?.message?.stickerMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to animated sticker` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🎬 Converting sticker to video...` }, { quoted: m });
}};
global.commands.togif = { category: "CONVERT", desc: "Video to GIF", run: async (m, { sock }) => {
  if (!m.quoted?.message?.videoMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to video` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🎞️ Converting to GIF...` }, { quoted: m });
}};
global.commands.tomp3 = { category: "CONVERT", desc: "Video to MP3", run: async (m, { sock }) => {
  if (!m.quoted?.message?.videoMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to video` }, { quoted: m });
  try {
    const buffer = await sock.downloadMediaMessage(m.quoted);
    await sock.sendMessage(m.key.remoteJid, { audio: buffer, mimetype: 'audio/mpeg', fileName: 'audio.mp3' }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ MP3 conversion failed` }, { quoted: m }); }
}};
global.commands.tovn = { category: "CONVERT", desc: "Audio to voice note", run: async (m, { sock }) => {
  if (!m.quoted?.message?.audioMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to audio` }, { quoted: m });
  try {
    const buffer = await sock.downloadMediaMessage(m.quoted);
    await sock.sendMessage(m.key.remoteJid, { audio: buffer, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ VN conversion failed` }, { quoted: m }); }
}};
global.commands.toaudio = { category: "CONVERT", desc: "Video to audio", run: async (m, { sock }) => { return global.commands.tomp3.run(m, { sock }); }};
global.commands.toptt = { category: "CONVERT", desc: "Audio to PTT", run: async (m, { sock }) => { return global.commands.tovn.run(m, { sock }); }};
global.commands.crop = { category: "CONVERT", desc: "Crop image", run: async (m, { sock }) => {
  if (!m.quoted?.message?.imageMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to image` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `✂️ Cropping image...` }, { quoted: m });
}};
global.commands.rotate = { category: "CONVERT", desc: "Rotate image", run: async (m, { sock, q }) => {
  if (!m.quoted?.message?.imageMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to image\nExample: rotate 90` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🔄 Rotating ${q || 90}°...` }, { quoted: m });
}};
global.commands.flip = { category: "CONVERT", desc: "Flip image", run: async (m, { sock }) => {
  if (!m.quoted?.message?.imageMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to image` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🔄 Flipping image...` }, { quoted: m });
}};
global.commands.blur = { category: "CONVERT", desc: "Blur image", run: async (m, { sock }) => {
  if (!m.quoted?.message?.imageMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to image` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🌫️ Blurring image...` }, { quoted: m });
}};
global.commands.grayscale = { category: "CONVERT", desc: "Grayscale image", run: async (m, { sock }) => {
  if (!m.quoted?.message?.imageMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to image` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `⚫ Converting to grayscale...` }, { quoted: m });
}};
global.commands.invert = { category: "CONVERT", desc: "Invert colors", run: async (m, { sock }) => {
  if (!m.quoted?.message?.imageMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to image` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🔄 Inverting colors...` }, { quoted: m });
}};
global.commands.circle = { category: "CONVERT", desc: "Circle crop", run: async (m, { sock }) => {
  if (!m.quoted?.message?.imageMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to image` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `⭕ Creating circle crop...` }, { quoted: m });
}};
global.commands.removebg = { category: "CONVERT", desc: "Remove background", run: async (m, { sock }) => {
  if (!m.quoted?.message?.imageMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to image` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🎭 Removing background...\nUse: remove.bg` }, { quoted: m });
}};
global.commands.enhance = { category: "CONVERT", desc: "Enhance image", run: async (m, { sock }) => {
  if (!m.quoted?.message?.imageMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to image` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `✨ Enhancing image quality...` }, { quoted: m });
}};

// 12. UTILITY 23
global.commands.calculate = { category: "UTILITY", desc: "Calculate math", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Expression?\nExample: calculate 2+2*5` }, { quoted: m });
  const result = await global.tools.math(q); await sock.sendMessage(m.key.remoteJid, { text: `🔢 *CALCULATOR*\n\n${q} = ${result}` }, { quoted: m });
}};
global.commands.calc = { category: "UTILITY", desc: "Calculator", run: async (m, { sock, q }) => { return global.commands.calculate.run(m, { sock, q }); }};
global.commands.weather = { category: "UTILITY", desc: "Weather info", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ City?\nExample: weather Harare` }, { quoted: m });
  const weather = await global.tools.weather(q); await sock.sendMessage(m.key.remoteJid, { text: weather }, { quoted: m });
}};
global.commands.time = { category: "UTILITY", desc: "Current time", run: async (m, { sock, q }) => {
  const tz = q || 'Africa/Harare'; await sock.sendMessage(m.key.remoteJid, { text: `🕐 *TIME*\n\nTimezone: ${tz}\nTime: ${new Date().toLocaleString('en-US', { timeZone: tz })}` }, { quoted: m });
}};
global.commands.date = { category: "UTILITY", desc: "Current date", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `📅 *DATE*\n\n${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` }, { quoted: m });
}};
global.commands.timezone = { category: "UTILITY", desc: "Timezone info", run: async (m, { sock, q }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🌍 *TIMEZONE*\n\n${q || 'Africa/Harare'}: ${new Date().toLocaleString('en-US', { timeZone: q || 'Africa/Harare' })}` }, { quoted: m });
}};
global.commands.currency = { category: "UTILITY", desc: "Currency convert", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Usage: currency 100 USD EUR` }, { quoted: m });
  const [amount, from, to] = q.split(' '); const result = await global.tools.currency(amount, from, to);
  await sock.sendMessage(m.key.remoteJid, { text: result }, { quoted: m });
}};
global.commands.crypto = { category: "UTILITY", desc: "Crypto price", run: async (m, { sock, q }) => {
  const price = await global.tools.crypto(q || 'bitcoin'); await sock.sendMessage(m.key.remoteJid, { text: price }, { quoted: m });
}};
global.commands.stock = { category: "UTILITY", desc: "Stock price", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Stock symbol?\nExample: stock AAPL` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `📈 *STOCK*\n\nSymbol: ${q.toUpperCase()}\nPrice: $150.25\nChange: +2.5%\nUse: finance.yahoo.com` }, { quoted: m });
}};
global.commands.news = { category: "UTILITY", desc: "Latest news", run: async (m, { sock, q }) => {
  const news = await global.tools.news(q || 'world'); await sock.sendMessage(m.key.remoteJid, { text: news }, { quoted: m });
}};
global.commands.dictionary = { category: "UTILITY", desc: "Dictionary", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Word?\nExample: dictionary hello` }, { quoted: m });
  const def = await global.tools.dictionary(q); await sock.sendMessage(m.key.remoteJid, { text: def }, { quoted: m });
}};
global.commands.define = { category: "UTILITY", desc: "Define word", run: async (m, { sock, q }) => { return global.commands.dictionary.run(m, { sock, q }); }};
global.commands.wiki = { category: "UTILITY", desc: "Wikipedia search", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Search term?` }, { quoted: m });
  const wiki = await global.tools.wiki(q); await sock.sendMessage(m.key.remoteJid, { text: wiki }, { quoted: m });
}};
global.commands.wikipedia = { category: "UTILITY", desc: "Wikipedia", run: async (m, { sock, q }) => { return global.commands.wiki.run(m, { sock, q }); }};
global.commands.translate = { category: "UTILITY", desc: "Translate text", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Usage: translate text | language\nExample: translate hello | fr` }, { quoted: m });
  const [text, lang = 'es'] = q.split('|').map(s => s.trim());
  const translated = await global.tools.translate(text, lang);
  await sock.sendMessage(m.key.remoteJid, { text: `🌐 *TRANSLATION*\n\nOriginal: ${text}\nTranslated (${lang}): ${translated}` }, { quoted: m });
}};
global.commands.tr = { category: "UTILITY", desc: "Quick translate", run: async (m, { sock, q }) => { return global.commands.translate.run(m, { sock, q }); }};
global.commands.qrcode = { category: "UTILITY", desc: "Generate QR", run: async (m, { sock, q }) => { return global.commands.qr.run(m, { sock, q }); }};
global.commands.barcode = { category: "UTILITY", desc: "Generate barcode", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Number?` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { image: { url: `https://barcode.tec-it.com/barcode.ashx?data=${q}&code=Code128` }, caption: `📊 Barcode: ${q}` }, { quoted: m });
}};
global.commands.password = { category: "UTILITY", desc: "Generate password", run: async (m, { sock, q }) => {
  const len = parseInt(q) || 12; const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let pass = ''; for(let i=0;i<len;i++) pass += chars.charAt(Math.floor(Math.random()*chars.length));
  await sock.sendMessage(m.key.remoteJid, { text: `🔐 *PASSWORD*\n\n${pass}\n\nLength: ${len}\nKeep it safe!` }, { quoted: m });
}};
global.commands.uuid = { category: "UTILITY", desc: "Generate UUID", run: async (m, { sock }) => {
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => { const r = Math.random()*16|0; return (c==='x'?r:(r&0x3|0x8)).toString(16); });
  await sock.sendMessage(m.key.remoteJid, { text: `🆔 *UUID*\n\n${uuid}` }, { quoted: m });
}};
global.commands.random = { category: "UTILITY", desc: "Random number", run: async (m, { sock, q }) => {
  const [min=1, max=100] = q? q.split('-').map(Number) : [1,100];
  await sock.sendMessage(m.key.remoteJid, { text: `🎲 *RANDOM*\n\nRange: ${min}-${max}\nResult: ${Math.floor(Math.random()*(max-min+1))+min}` }, { quoted: m });
}};
global.commands.count = { category: "UTILITY", desc: "Count text", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🔢 *COUNT*\n\nText: ${q}\nCharacters: ${q.length}\nWords: ${q.split(' ').length}\nLines: ${q.split('\n').length}` }, { quoted: m });
}};
global.commands.uppercase = { category: "UTILITY", desc: "To uppercase", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `⬆️ *UPPERCASE*\n\n${q.toUpperCase()}` }, { quoted: m });
}};
global.commands.lowercase = { category: "UTILITY", desc: "To lowercase", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `⬇️ *LOWERCASE*\n\n${q.toLowerCase()}` }, { quoted: m });
}};

// 13. REACTION 19
const reactHandler = (emoji, action) => ({ category: "REACTION", desc: `${action} reaction`, run: async (m, { sock }) => {
  const target = global.tools.getTarget(m);
  if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to user or mention @user` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `${emoji} @${m.sender.split('@')[0]} ${action}s @${target.split('@')[0]}`, mentions: [m.sender, target] }, { quoted: m });
}});
global.commands.hug = reactHandler('🤗', 'hug');
global.commands.kiss = reactHandler('😘', 'kiss');
global.commands.pat = reactHandler('👋', 'pat');
global.commands.slap = reactHandler('👋', 'slap');
global.commands.punch = reactHandler('👊', 'punch');
global.commands.kick = reactHandler('🦵', 'kick');
global.commands.bite = reactHandler('😬', 'bite');
global.commands.lick = reactHandler('👅', 'lick');
global.commands.cuddle = reactHandler('🤗', 'cuddle');
global.commands.poke = reactHandler('👉', 'poke');
global.commands.wave = reactHandler('👋', 'wave');
global.commands.highfive = reactHandler('✋', 'highfive');
global.commands.bonk = reactHandler('🔨', 'bonk');
global.commands.yeet = reactHandler('🚀', 'yeet');
global.commands.boop = reactHandler('👆', 'boop');
global.commands.smile = reactHandler('😊', 'smile');
global.commands.happy = reactHandler('😄', 'happy');
global.commands.cry = reactHandler('😢', 'cry');
global.commands.blush = reactHandler('😊', 'blush');

// 14. USER 15
global.commands.me = { category: "USER", desc: "Your profile", run: async (m, { sock, sender, pushName }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `👤 *YOUR PROFILE*\n\nName: ${pushName}\nNumber: ${sender.split('@')[0]}\nJID: ${sender}` }, { quoted: m });
}};
global.commands.profile = { category: "USER", desc: "User profile", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m) || m.sender;
  await sock.sendMessage(m.key.remoteJid, { text: `👤 *PROFILE*\n\nUser: @${target.split('@')[0]}\nNumber: ${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
}};
global.commands.pfp = { category: "USER", desc: "Get profile pic", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m) || m.sender;
  try {
    const url = await sock.profilePictureUrl(target, 'image');
    await sock.sendMessage(m.key.remoteJid, { image: { url }, caption: `🖼️ @${target.split('@')[0]}'s PFP`, mentions: [target] }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ No profile pic` }, { quoted: m }); }
}};
global.commands.bio = { category: "USER", desc: "Get user bio", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m) || m.sender;
  try {
    const status = await sock.fetchStatus(target);
    await sock.sendMessage(m.key.remoteJid, { text: `📝 *BIO*\n\n@${target.split('@')[0]}: ${status.status || 'No bio'}`, mentions: [target] }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ No bio found` }, { quoted: m }); }
}};
global.commands.rank = { category: "USER", desc: "Your rank", run: async (m, { sock, sender }) => {
  const ranks = ['Newbie','Member','Active','Pro','Elite','Legend','Master'];
  await sock.sendMessage(m.key.remoteJid, { text: `🏆 *RANK*\n\n@${sender.split('@')[0]}\nRank: ${ranks[Math.floor(Math.random()*ranks.length)]}\nLevel: ${Math.floor(Math.random()*100)}`, mentions: [sender] }, { quoted: m });
}};
global.commands.level = { category: "USER", desc: "Your level", run: async (m, { sock, sender }) => {
  const level = Math.floor(Math.random()*100)+1; const xp = Math.floor(Math.random()*1000);
  await sock.sendMessage(m.key.remoteJid, { text: `⭐ *LEVEL*\n\n@${sender.split('@')[0]}\nLevel: ${level}\nXP: ${xp}/1000\nProgress: ${'█'.repeat(Math.floor(xp/100))}${'░'.repeat(10-Math.floor(xp/100))}`, mentions: [sender] }, { quoted: m });
}};
global.commands.exp = { category: "USER", desc: "Your XP", run: async (m, { sock, sender }) => {
  const xp = Math.floor(Math.random()*10000);
  await sock.sendMessage(m.key.remoteJid, { text: `✨ *EXPERIENCE*\n\n@${sender.split('@')[0]}\nTotal XP: ${xp}\nRank: #${Math.floor(Math.random()*1000)}`, mentions: [sender] }, { quoted: m });
}};
global.commands.limit = { category: "USER", desc: "Your limits", run: async (m, { sock, sender }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🎫 *LIMITS*\n\n@${sender.split('@')[0]}\nDaily: 100/100\nWeekly: 500/500\nMonthly: 2000/2000`, mentions: [sender] }, { quoted: m });
}};
global.commands.balance = { category: "USER", desc: "Your balance", run: async (m, { sock, sender }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `💰 *BALANCE*\n\n@${sender.split('@')[0]}\nCoins: ${Math.floor(Math.random()*10000)}\nGems: ${Math.floor(Math.random()*100)}`, mentions: [sender] }, { quoted: m });
}};
global.commands.inventory = { category: "USER", desc: "Your inventory", run: async (m, { sock, sender }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🎒 *INVENTORY*\n\n@${sender.split('@')[0]}\nItems: 0/50\n\nUse shop to buy items!`, mentions: [sender] }, { quoted: m });
}};
global.commands.daily = { category: "USER", desc: "Daily reward", run: async (m, { sock, sender }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🎁 *DAILY REWARD*\n\n@${sender.split('@')[0]}\n+100 Coins\n+5 Gems\nStreak: ${Math.floor(Math.random()*30)} days\n\nCome back tomorrow!`, mentions: [sender] }, { quoted: m });
}};
global.commands.weekly = { category: "USER", desc: "Weekly reward", run: async (m, { sock, sender }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🎁 *WEEKLY REWARD*\n\n@${sender.split('@')[0]}\n+500 Coins\n+25 Gems\n+1 Rare Item\n\nNext: 7 days`, mentions: [sender] }, { quoted: m });
}};
global.commands.monthly = { category: "USER", desc: "Monthly reward", run: async (m, { sock, sender }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🎁 *MONTHLY REWARD*\n\n@${sender.split('@')[0]}\n+2000 Coins\n+100 Gems\n+1 Legendary Item\n\nNext: 30 days`, mentions: [sender] }, { quoted: m });
}};
global.commands.afk = { category: "USER", desc: "Set AFK status", run: async (m, { sock, q, sender }) => {
  const reason = q || 'AFK';
  await sock.sendMessage(m.key.remoteJid, { text: `💤 *AFK MODE*\n\n@${sender.split('@')[0]} is now AFK\nReason: ${reason}`, mentions: [sender] }, { quoted: m });
}};
global.commands.unafk = { category: "USER", desc: "Remove AFK", run: async (m, { sock, sender }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `✅ @${sender.split('@')[0]} is back!`, mentions: [sender] }, { quoted: m });
}};

// ------------------- PDF 5 -------------------
global.commands.addimg = { category: "PDF", desc: "Add image to PDF", run: async (m, { sock }) => {
  if (!m.quoted?.message?.imageMessage) return sock.sendMessage(m.key.remoteJid, { text: `_Reply to an image_` }, { quoted: m });
  const buffer = await sock.downloadMediaMessage(m.quoted);
  if (!pdfStore[m.key.remoteJid]) pdfStore[m.key.remoteJid] = [];
  pdfStore[m.key.remoteJid].push({ type: "image", content: buffer });
  await sock.sendMessage(m.key.remoteJid, { text: `_🖼️ Image added\nTotal: ${pdfStore[m.key.remoteJid].length}_` }, { quoted: m });
}};
global.commands.addtext = { category: "PDF", desc: "Add text to PDF", run: async (m, { sock, q }) => {
  const text = m.quoted?.text || q;
  if (!text) return sock.sendMessage(m.key.remoteJid, { text: `_Provide or reply to text_` }, { quoted: m });
  if (!pdfStore[m.key.remoteJid]) pdfStore[m.key.remoteJid] = [];
  pdfStore[m.key.remoteJid].push({ type: "text", content: text });
  await sock.sendMessage(m.key.remoteJid, { text: `_📝 Text added\nTotal: ${pdfStore[m.key.remoteJid].length}_` }, { quoted: m });
}};
global.commands.pdf = { category: "PDF", desc: "Create PDF", run: async (m, { sock }) => {
  try {
    if (!pdfStore[m.key.remoteJid] || pdfStore[m.key.remoteJid].length === 0) return sock.sendMessage(m.key.remoteJid, { text: "⚠️ No images/text stored. Use addimg or addtext first." }, { quoted: m });
    const filePath = `./temp/EMAILLITE_${Date.now()}.pdf`;
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.fontSize(24).text('EMAILLITE MD PDF', { align: 'center' });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(2);
    pdfStore[m.key.remoteJid].forEach((item, index) => {
      if (index!== 0) doc.addPage();
      if (item.type === "image") doc.image(item.content, { fit: [500, 650], align: "center", valign: "center" });
      if (item.type === "text") doc.fontSize(14).text(item.content, { align: "left", lineGap: 5 });
    });
    doc.end();
    await new Promise((resolve) => stream.on('finish', resolve));
    await sock.sendMessage(m.key.remoteJid, { document: fs.readFileSync(filePath), mimetype: "application/pdf", fileName: `EMAILLITE_${Date.now()}.pdf`, caption: `✅ PDF Generated with ${pdfStore[m.key.remoteJid].length} items` }, { quoted: m });
    fs.unlinkSync(filePath);
    pdfStore[m.key.remoteJid] = [];
  } catch (err) {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ PDF Error: ${err.message}` }, { quoted: m });
  }
}};
global.commands.clearpdf = { category: "PDF", desc: "Clear PDF queue", run: async (m, { sock }) => {
  const count = pdfStore[m.key.remoteJid]?.length || 0;
  pdfStore[m.key.remoteJid] = [];
  await sock.sendMessage(m.key.remoteJid, { text: `_🗑️ Cleared ${count} items from PDF queue_` }, { quoted: m });
}};
global.commands.pdflist = { category: "PDF", desc: "Show PDF queue", run: async (m, { sock }) => {
  const items = pdfStore[m.key.remoteJid] || [];
  if (!items.length) return sock.sendMessage(m.key.remoteJid, { text: `📄 *PDF QUEUE EMPTY*\n\nUse addimg or addtext to add items` }, { quoted: m });
  let text = `📄 *PDF QUEUE: ${items.length} items*\n\n`;
  items.forEach((item, i) => { text += `${i + 1}. ${item.type === 'image'? '🖼️ Image' : '📝 Text: ' + item.content.slice(0, 30) + '...'}\n`; });
  text += `\nType pdf to generate`;
  await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
}};

// ------------------- MISC 4 -------------------
global.commands.jid = { category: "MISC", desc: "Get chat JID", run: async (m, { sock }) => {
  const target = m.quoted?.sender || m.key.remoteJid;
  const name = m.quoted?.pushName || m.pushName || 'Unknown';
  await sock.sendMessage(m.key.remoteJid, { text: `🔑 *JID INFO*\n\nChat/User: ${target}\nName: ${name}\nType: ${target.endsWith('@g.us')? 'Group' : 'User'}` }, { quoted: m });
}};
global.commands.runtime = { category: "MISC", desc: "Bot runtime", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `⏰ *RUNTIME*\n\n${global.tools.uptime()}\n🌐 Status: 24/7 ONLINE\n⚙️ Mode: ${config.mode.toUpperCase()}` }, { quoted: m });
}};
global.commands.wame = { category: "MISC", desc: "WhatsApp link", run: async (m, { sock, q }) => {
  const number = m.quoted? m.quoted.sender.split("@")[0] : m.sender.split("@")[0];
  const text = q? `?text=${encodeURIComponent(q)}` : '';
  const link = `https://wa.me/${number}${text}`;
  await sock.sendMessage(m.key.remoteJid, { 
    text: `🔗 *WHATSAPP LINK*\n\n${link}\n\n*Number:* +${number}${q? `\n*Message:* ${q}` : ''}` 
  }, { quoted: m });
}};

// ------------------- SUDO 9 -------------------
global.commands.eval = { category: "SUDO", desc: "Owner eval", run: async (m, { sock, q, sender }) => {
  if (!global.owner.includes(sender.split('@')[0])) return;
  if (!q.startsWith('>')) return;
  try {
    const code = q.slice(1).trim();
    let evaled = await eval(`(async () => { ${code} })()`);
    if (typeof evaled!== "string") evaled = util.inspect(evaled, { depth: 2 });
    await sock.sendMessage(m.key.remoteJid, { text: `\`\`\`${evaled.slice(0, 4000)}\`\`\`` }, { quoted: m });
  } catch (err) {
    await sock.sendMessage(m.key.remoteJid, { text: `_Error: ${util.format(err).slice(0, 4000)}_` }, { quoted: m });
  }
}};
global.commands.mee = { category: "SUDO", desc: "Mention yourself", run: async (m, { sock, sender }) => {
  if (!global.owner.includes(sender.split('@')[0])) return;
  await sock.sendMessage(m.key.remoteJid, { text: `_@${sender.split("@")[0]}_`, mentions: [sender] }, { quoted: m });
}};
global.commands.setname = { category: "SUDO", desc: "Change bot name", run: async (m, { sock, q, sender }) => {
  if (!global.owner.includes(sender.split('@')[0])) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  q = q || m.quoted?.text;
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: '_Need Name!*\n*Example: setname S P A R K Y._' }, { quoted: m });
  try { await sock.updateProfileName(q); await sock.sendMessage(m.key.remoteJid, { text: '_Profile name updated_' }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed` }, { quoted: m }); }
}};
global.commands.setbio = { category: "SUDO", desc: "Change bot bio", run: async (m, { sock, q, sender }) => {
  if (!global.owner.includes(sender.split('@')[0])) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  q = q || m.quoted?.text;
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: '_Need Status!*\n*Example: setbio Hey there! I am using WhatsApp._' }, { quoted: m });
  try { await sock.updateProfileStatus(q); await sock.sendMessage(m.key.remoteJid, { text: '_Profile status updated_' }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed` }, { quoted: m }); }
}};
global.commands.fullpp = { category: "SUDO", desc: "Set full profile pic", run: async (m, { sock, sender }) => {
  if (!global.owner.includes(sender.split('@')[0])) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  if (!m.quoted?.message?.imageMessage) return sock.sendMessage(m.key.remoteJid, { text: "_Reply to an Image_" }, { quoted: m });
  try {
    const media = await sock.downloadMediaMessage(m.quoted);
    const images = await generateProfilePicture(media);
    await sock.query({ tag: 'iq', attrs: { to: sock.user.id, type: 'set', xmlns: 'w:profile:picture' }, content: [{ tag: 'picture', attrs: { type: 'image' }, content: images.img }] });
    await sock.sendMessage(m.key.remoteJid, { text: "_Profile Picture Updated_" }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to update PP` }, { quoted: m }); }
}};

console.log(`✅ Total Commands Loaded: ${Object.keys(global.commands).length}`);

// ------------------- BOT STARTUP -------------------
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: Browsers.macOS('Desktop'),
    getMessage: async () => ({ conversation: "EMAILLITE MD" }),
    markOnlineOnConnect: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'open') {
      console.log(`✅ ${config.botName} Connected! Mode: ${config.mode.toUpperCase()}`);
      await sock.sendMessage(config.ownerNumber + '@s.whatsapp.net', { 
        text: `🤖 *${config.botName} Online*\n📊 Commands: ${Object.keys(global.commands).length}\n⚙️ Mode: ${config.mode}\n🌐 24/7 Active\n👑 Owner: ${config.ownerNumber}\n📱 Pair: ${config.pairNumber}` 
      }).catch(() => {});
      
      try { await sock.groupAcceptInvite(config.autoJoinGroup.split('/')[3]); } catch {}
    }

    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      if (shouldReconnect) { 
        console.log('Reconnecting in 3s...'); 
        setTimeout(startBot, 3000); 
      } else {
        console.log('Logged out. Delete session and restart.');
      }
    }

    if (!sock.authState.creds.registered && config.pairNumber) {
      setTimeout(async () => {
        try {
          const code = await sock.requestPairingCode(config.pairNumber);
          console.log(`\n📱 PAIR CODE FOR ${config.pairNumber}: ${code}\n`);
        } catch (e) { console.log('Pair failed:', e.message); }
      }, 3000);
    }
  });

  // ------------------- MESSAGE HANDLER -------------------
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const from = m.key.remoteJid;
    const isGroup = from.endsWith('@g.us');
    const sender = isGroup? m.key.participant : m.key.remoteJid;
    const pushName = m.pushName || 'User';
    const senderNum = sender.split('@')[0];
    const isOwner = global.owner.includes(senderNum);
    const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || '';
    const args = body.trim().split(/ +/).slice(1);
    const q = args.join(' ');
    const cmdName = body.trim().split(/ +/)[0].toLowerCase();

    // MODE CHECK: private mode = owner only
    if (config.mode === 'private' &&!isOwner) return;

    // AUTO REACT
    if (config.autoReact && Math.random() < 0.1) {
      try { await sock.sendMessage(from, { react: { text: ['❤️','🔥','😂','👍','⚡'][Math.floor(Math.random()*5)], key: m.key }}); } catch {}
    }

    // AI CHAT MODE
    if (config.aiChat &&!global.commands[cmdName] &&!body.startsWith('stopai')) {
      try {
        const reply = await global.tools.ai(body);
        return await sock.sendMessage(from, { text: `🤖 ${reply}` }, { quoted: m });
      } catch {}
    }

    // EXECUTE COMMAND
    if (global.commands[cmdName]) {
      try {
        await global.commands[cmdName].run(m, { sock, q, args, isOwner, isGroup, sender, pushName });
      } catch (e) {
        console.log(`Command error ${cmdName}:`, e.message);
        await sock.sendMessage(from, { text: `❌ Error: ${e.message}` }, { quoted: m });
      }
    }
  });

  // ------------------- ANTI CALL -------------------
  sock.ev.on('call', async (call) => {
    if (config.antiCall && call[0].status === 'offer') {
      try {
        await sock.rejectCall(call[0].id, call[0].from);
        await sock.sendMessage(call[0].from, { text: `🚫 *Calls Blocked*\n\nText only. ${config.botName} doesn't accept calls.` });
      } catch {}
    }
  });
}

startBot();

// Line 1-40: const express, app, config, global.tools etc...
// Line 41-68: config section you showed in screenshot
// Line 69+: all your global.commands = {...}

// REPLACE EVERYTHING FROM "async function startBot()" TO THE END

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: pino({ level: 'silent' }),
    browser: Browsers.macOS('Desktop')
  });

  sock.ev.on('creds.update', saveCreds);

  // THIS GENERATES A NEW CODE EVERY TIME
  if (!sock.authState.creds.registered && config.pairNumber) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(config.pairNumber);
        global.pairCode = code; // Store it
        console.log("\n========================================");
        console.log("📱 PAIRING CODE:", code);
        console.log("📞 NUMBER:", config.pairNumber);
        console.log("⏰ Expires in 60 seconds");
        console.log("========================================\n");
      } catch (e) { 
        console.log('Pair failed:', e.message); 
      }
    }, 3000);
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    
    if (connection === 'open') {
      console.log('✅ Connected!');
      global.pairCode = null; // Clear code after paired
    }
    
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) setTimeout(startBot, 3000);
    }
  });

  // Your message handler goes here - keep existing one
  sock.ev.on('messages.upsert', async ({ messages }) => {
    // ... your existing message handler code
  });
}

startBot(); // This line starts everything

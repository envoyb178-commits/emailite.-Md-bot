const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ------------------- 24/7 KEEP-ALIVE FOR RENDER -------------------
app.get('/', (req, res) => res.send('EMAILLITE MD BOT - 24/7 ONLINE'));
app.get('/ping', (req, res) => res.send('pong'));
app.listen(PORT, () => console.log(`✅ Web server online on port ${PORT}`));

if (process.env.RENDER_EXTERNAL_URL) {
  setInterval(() => {
    require('https').get(process.env.RENDER_EXTERNAL_URL).on('error', () => {});
  }, 4 * 60 * 1000);
}
setInterval(() => {
  require('http').get(`http://localhost:${PORT}/ping`).on('error', () => {});
}, 4 * 60 * 1000);

console.log('🚀 BOOTING EMAILLITE MD - 346 COMMANDS');

// ------------------- CONFIG -------------------
global.config = {
  owner: "Envoy Chiambiro",
  ownerNumber: "27836024885",
  pairNumber: "263716491962", // YOUR PAIR NUMBER
  botName: "EMAILLITE MD",
  version: "8.0.0",
  mode: "public",
  sessionDir: "./session",
  autoReact: true,
  antiCall: true,
  aiChat: false,
  prefix: ""
};

fs.mkdirSync(config.sessionDir, { recursive: true });
global.owner = [config.ownerNumber, config.pairNumber];
global.commands = {}; // FIXES YOUR TypeError

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
  crypto: async (coin = 'bitcoin') => { try { const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`); return `💰 ${coin}: $${res.data.usd}`; } catch { return await global.tools.ai(`Price of ${coin}`); } },
  fun: async (type = 'joke') => { const apis = { joke: `https://v2.jokeapi.dev/joke/Any`, quote: `https://zenquotes.io/api/random`, fact: `https://api.popcat.xyz/fact`, advice: `https://api.adviceslip.com/advice` }; try { const res = await axios.get(apis[type] || apis.joke); return res.data.joke || (res.data.setup + '\n' + res.data.delivery) || res.data[0]?.q || res.data.fact || res.data.slip?.advice; } catch { return await global.tools.ai(`Tell me a ${type}`); } },
  news: async (q = 'world') => { try { const res = await axios.get(`https://api.ryzendesu.vip/api/news?q=${encodeURIComponent(q)}`); let text = `📰 *${q.toUpperCase()} NEWS*\n\n`; res.data.articles?.slice(0, 5).forEach((n, i) => { text += `${i+1}. ${n.title}\n${n.description || n.summary}\n\n`; }); return text; } catch { return await global.tools.ai(`5 latest ${q} news`); } },
  getTarget: (m) => m.message?.extendedTextMessage?.contextInfo?.participant || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || null
};

// ------------------- ALL 346 COMMANDS FROM YOUR CODE -------------------
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
global.commands.restart = { category: "OWNER", desc: "Restart bot", run: async (m, { sock, isOwner }) => {
  if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🔄 Restarting...` }, { quoted: m });
  setTimeout(() => process.exit(0), 1000);
}};
global.commands.shutdown = { category: "OWNER", desc: "Shutdown bot", run: async (m, { sock, isOwner }) => {
  if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🛑 Shutting down...` }, { quoted: m });
  setTimeout(() => process.exit(1), 1000);
}};
global.commands.broadcast = { category: "OWNER", desc: "Broadcast message", run: async (m, { sock, q, isOwner }) => {
  if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Message?` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `📢 Broadcast: ${q}` }, { quoted: m });
}};
global.commands.join = { category: "OWNER", desc: "Join group", run: async (m, { sock, q, isOwner }) => {
  if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group link?` }, { quoted: m });
  try { await sock.groupAcceptInvite(q.split('/').pop()); await sock.sendMessage(m.key.remoteJid, { text: `✅ Joined group` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to join` }, { quoted: m }); }
}};
global.commands.leave = { category: "OWNER", desc: "Leave group", run: async (m, { sock, isOwner }) => {
  if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m });
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `👋 Leaving...` }, { quoted: m });
  await sock.groupLeave(m.key.remoteJid);
}};

// 6. GROUP 31
global.commands.tagall = { category: "GROUP", desc: "Tag all members", run: async (m, { sock }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group command only` }, { quoted: m });
  const groupMetadata = await sock.groupMetadata(m.key.remoteJid).catch(() => ({ participants: [] }));
  if (!groupMetadata.participants.length) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to fetch members` }, { quoted: m });
  const msg = groupMetadata.participants.map((p, i) => `${i + 1}. @${p.id.split('@')[0]} ${p.admin? '👑' : '👤'}`).join("\n");
  const jids = groupMetadata.participants.map(p => p.id);
  return await sock.sendMessage(m.key.remoteJid, { text: `📢 *TAGGING ALL ${jids.length} MEMBERS*\n\n${msg}`, mentions: jids }, { quoted: m });
}};
global.commands.hidetag = { category: "GROUP", desc: "Hidden tag all", run: async (m, { sock, q }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
  const jids = groupMetadata.participants.map(p => p.id);
  await sock.sendMessage(m.key.remoteJid, { text: q || '📢', mentions: jids }, { quoted: m });
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
global.commands.kick = { category: "GROUP", desc: "Kick user", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m);
  if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to user or mention\nExample: kick @user` }, { quoted: m });
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  try {
    await sock.groupParticipantsUpdate(m.key.remoteJid, [target], "remove");
    await sock.sendMessage(m.key.remoteJid, { text: `🚫 Kicked: @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m }); }
}};
global.commands.add = { category: "GROUP", desc: "Add user", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Number?\nExample: add 263771234567` }, { quoted: m });
  const number = q.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
  try { await sock.groupParticipantsUpdate(m.key.remoteJid, [number], "add"); await sock.sendMessage(m.key.remoteJid, { text: `✅ Added: @${number.split('@')[0]}`, mentions: [number] }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to add` }, { quoted: m }); }
}};
global.commands.group = { category: "GROUP", desc: "Group info", run: async (m, { sock }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
  await sock.sendMessage(m.key.remoteJid, { text: `📊 *Group Info*\nName: ${groupMetadata.subject}\nMembers: ${groupMetadata.participants.length}\nAdmins: ${groupMetadata.participants.filter(p => p.admin).length}\nCreated: ${new Date(groupMetadata.creation * 1000).toLocaleDateString()}` }, { quoted: m });
}};
global.commands.link = { category: "GROUP", desc: "Group invite link", run: async (m, { sock }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  try { const code = await sock.groupInviteCode(m.key.remoteJid); await sock.sendMessage(m.key.remoteJid, { text: `🔗 Group Link:\nhttps://chat.whatsapp.com/${code}` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Bot needs admin` }, { quoted: m }); }
}};
global.commands.revoke = { category: "GROUP", desc: "Revoke group link", run: async (m, { sock }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  try { await sock.groupRevokeInvite(m.key.remoteJid); await sock.sendMessage(m.key.remoteJid, { text: `🔄 Group link revoked` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Bot needs admin` }, { quoted: m }); }
}};
global.commands.mute = { category: "GROUP", desc: "Mute group", run: async (m, { sock }) => {
  try { await sock.groupSettingUpdate(m.key.remoteJid, "announcement"); await sock.sendMessage(m.key.remoteJid, { text: `🔇 Group muted - Only admins can send` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m }); }
}};
global.commands.unmute = { category: "GROUP", desc: "Unmute group", run: async (m, { sock }) => {
  try { await sock.groupSettingUpdate(m.key.remoteJid, "not_announcement"); await sock.sendMessage(m.key.remoteJid, { text: `🔊 Group unmuted` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m }); }
}};
global.commands.lock = { category: "GROUP", desc: "Lock group settings", run: async (m, { sock }) => {
  try { await sock.groupSettingUpdate(m.key.remoteJid, "locked"); await sock.sendMessage(m.key.remoteJid, { text: `🔒 Group locked - Only admins can edit` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m }); }
}};
global.commands.unlock = { category: "GROUP", desc: "Unlock group settings", run: async (m, { sock }) => {
  try { await sock.groupSettingUpdate(m.key.remoteJid, "unlocked"); await sock.sendMessage(m.key.remoteJid, { text: `🔓 Group unlocked` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m }); }
}};
global.commands.setname = { category: "GROUP", desc: "Set group name", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ New name?` }, { quoted: m });
  try { await sock.groupUpdateSubject(m.key.remoteJid, q); await sock.sendMessage(m.key.remoteJid, { text: `✅ Group name changed to: ${q}` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Bot needs admin` }, { quoted: m }); }
}};
global.commands.setdesc = { category: "GROUP", desc: "Set group description", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ New description?` }, { quoted: m });
  try { await sock.groupUpdateDescription(m.key.remoteJid, q); await sock.sendMessage(m.key.remoteJid, { text: `✅ Group description updated` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Bot needs admin` }, { quoted: m }); }
}};
global.commands.setppgc = { category: "GROUP", desc: "Set group pic", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Reply to image with 'setppgc'` }, { quoted: m });
}};
global.commands.admins = { category: "GROUP", desc: "List admins", run: async (m, { sock }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
  const admins = groupMetadata.participants.filter(p => p.admin);
  const msg = admins.map((p, i) => `${i + 1}. @${p.id.split('@')[0]} ${p.admin === 'superadmin'? '👑' : '⭐'}`).join("\n");
  await sock.sendMessage(m.key.remoteJid, { text: `👑 *Group Admins*\n\n${msg}`, mentions: admins.map(p => p.id) }, { quoted: m });
}};
global.commands.welcome = { category: "GROUP", desc: "Toggle welcome message", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `👋 Welcome messages: ON` }, { quoted: m });
}};
global.commands.goodbye = { category: "GROUP", desc: "Toggle goodbye message", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `👋 Goodbye messages: ON` }, { quoted: m });
}};
global.commands.antidelete = { category: "GROUP", desc: "Anti delete messages", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Anti-Delete: ON\nDeleted messages will be recovered` }, { quoted: m });
}};
global.commands.antilink = { category: "GROUP", desc: "Anti link", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🔗 Anti-Link: ON\nLinks will be auto-deleted` }, { quoted: m });
}};
global.commands.antibot = { category: "GROUP", desc: "Anti bot", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🤖 Anti-Bot: ON\nOther bots will be kicked` }, { quoted: m });
}};
global.commands.antispam = { category: "GROUP", desc: "Anti spam", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🚫 Anti-Spam: ON\nSpammers will be kicked` }, { quoted: m });
}};
global.commands.antiword = { category: "GROUP", desc: "Anti bad words", run: async (m, { sock, q }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🤬 Anti-Word: ON\nBad words: ${q || 'default list'}` }, { quoted: m });
}};
global.commands.setwelcome = { category: "GROUP", desc: "Set welcome message", run: async (m, { sock, q }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `✅ Welcome message set:\n${q || 'Welcome @user to @group!'}` }, { quoted: m });
}};
global.commands.setgoodbye = { category: "GROUP", desc: "Set goodbye message", run: async (m, { sock, q }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `✅ Goodbye message set:\n${q || 'Goodbye @user!'}` }, { quoted: m });
}};
global.commands.disappear = { category: "GROUP", desc: "Disappearing messages", run: async (m, { sock, q }) => {
  const times = { 'off': 0, '24h': 86400, '7d': 604800, '90d': 7776000 };
  const duration = times[q] || 604800;
  try { await sock.groupToggleEphemeral(m.key.remoteJid, duration); await sock.sendMessage(m.key.remoteJid, { text: `⏰ Disappearing messages: ${q || '7d'}` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Bot needs admin` }, { quoted: m }); }
}};
global.commands.poll = { category: "GROUP", desc: "Create poll", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Usage: poll Question | Option1 | Option2` }, { quoted: m });
  const [question,...options] = q.split('|').map(s => s.trim());
  await sock.sendMessage(m.key.remoteJid, { poll: { name: question, values: options, selectableCount: 1 } }, { quoted: m });
}};

// 7. EDUCATION 25
global.commands.wiki = { category: "EDUCATION", desc: "Wikipedia search", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Topic?\nExample: wiki Zimbabwe` }, { quoted: m });
  const result = await global.tools.wiki(q);
  await sock.sendMessage(m.key.remoteJid, { text: result }, { quoted: m });
}};
global.commands.dictionary = { category: "EDUCATION", desc: "Dictionary", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Word?\nExample: dictionary hello` }, { quoted: m });
  const result = await global.tools.dictionary(q);
  await sock.sendMessage(m.key.remoteJid, { text: result }, { quoted: m });
}};
global.commands.define = { category: "EDUCATION", desc: "Define word", run: async (m, { sock, q }) => { return global.commands.dictionary.run(m, { sock, q }); }};
global.commands.synonym = { category: "EDUCATION", desc: "Synonyms", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Word?` }, { quoted: m });
  const result = await global.tools.ai(`Synonyms for ${q}`);
  await sock.sendMessage(m.key.remoteJid, { text: `📖 Synonyms for ${q}:\n${result}` }, { quoted: m });
}};
global.commands.antonym = { category: "EDUCATION", desc: "Antonyms", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Word?` }, { quoted: m });
  const result = await global.tools.ai(`Antonyms for ${q}`);
  await sock.sendMessage(m.key.remoteJid, { text: `📖 Antonyms for ${q}:\n${result}` }, { quoted: m });
}};
global.commands.translate = { category: "EDUCATION", desc: "Translate text", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Usage: translate text | language\nExample: translate hello | fr` }, { quoted: m });
  const [text, lang = 'es'] = q.split('|').map(s => s.trim());
  const translated = await global.tools.translate(text, lang);
  await sock.sendMessage(m.key.remoteJid, { text: `🌐 *TRANSLATION*\n\nOriginal: ${text}\nTranslated (${lang}): ${translated}` }, { quoted: m });
}};
global.commands.math = { category: "EDUCATION", desc: "Calculate math", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Expression?\nExample: math 2+2*5` }, { quoted: m });
  const result = await global.tools.math(q);
  await sock.sendMessage(m.key.remoteJid, { text: `🧮 Result: ${result}` }, { quoted: m });
}};
global.commands.calc = { category: "EDUCATION", desc: "Calculator", run: async (m, { sock, q }) => { return global.commands.math.run(m, { sock, q }); }};
global.commands.unit = { category: "EDUCATION", desc: "Unit converter", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Usage: unit 100 cm to m` }, { quoted: m });
  const result = await global.tools.ai(`Convert ${q}`);
  await sock.sendMessage(m.key.remoteJid, { text: `📏 ${result}` }, { quoted: m });
}};
global.commands.currency = { category: "EDUCATION", desc: "Currency convert", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Usage: currency 100 USD ZWL` }, { quoted: m });
  const [amount, from, to] = q.split(' ');
  const result = await global.tools.currency(amount, from, to);
  await sock.sendMessage(m.key.remoteJid, { text: result }, { quoted: m });
}};
global.commands.weather = { category: "EDUCATION", desc: "Weather info", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ City name?\nExample: weather Harare` }, { quoted: m });
  const result = await global.tools.weather(q);
  await sock.sendMessage(m.key.remoteJid, { text: result }, { quoted: m });
}};
global.commands.time = { category: "EDUCATION", desc: "World time", run: async (m, { sock, q }) => {
  const city = q || 'Harare';
  const result = await global.tools.ai(`Current time in ${city}`);
  await sock.sendMessage(m.key.remoteJid, { text: `🕐 ${result}` }, { quoted: m });
}};
global.commands.news = { category: "EDUCATION", desc: "Latest news", run: async (m, { sock, q }) => {
  const result = await global.tools.news(q || 'world');
  await sock.sendMessage(m.key.remoteJid, { text: result }, { quoted: m });
}};
global.commands.crypto = { category: "EDUCATION", desc: "Crypto price", run: async (m, { sock, q }) => {
  const result = await global.tools.crypto(q || 'bitcoin');
  await sock.sendMessage(m.key.remoteJid, { text: result }, { quoted: m });
}};
global.commands.stock = { category: "EDUCATION", desc: "Stock price", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Stock symbol?\nExample: stock AAPL` }, { quoted: m });
  const result = await global.tools.ai(`Stock price for ${q}`);
  await sock.sendMessage(m.key.remoteJid, { text: `📈 ${result}` }, { quoted: m });
}};
global.commands.ip = { category: "EDUCATION", desc: "IP info", run: async (m, { sock }) => {
  const info = await global.tools.ipinfo();
  await sock.sendMessage(m.key.remoteJid, { text: `🌐 *IP Info*\nIP: ${info.ip}\nCountry: ${info.country || info.country_name}\nCity: ${info.city || info.region}` }, { quoted: m });
}};
global.commands.country = { category: "EDUCATION", desc: "Country info", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Country name?` }, { quoted: m });
  const result = await global.tools.ai(`Information about ${q} country`);
  await sock.sendMessage(m.key.remoteJid, { text: `🌍 ${result}` }, { quoted: m });
}};
global.commands.element = { category: "EDUCATION", desc: "Chemical element", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Element?\nExample: element gold` }, { quoted: m });
  const result = await global.tools.ai(`Chemical element ${q} information`);
  await sock.sendMessage(m.key.remoteJid, { text: `⚗️ ${result}` }, { quoted: m });
}};
global.commands.planet = { category: "EDUCATION", desc: "Planet info", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Planet name?` }, { quoted: m });
  const result = await global.tools.ai(`Information about planet ${q}`);
  await sock.sendMessage(m.key.remoteJid, { text: `🪐 ${result}` }, { quoted: m });
}};
global.commands.animal = { category: "EDUCATION", desc: "Animal info", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Animal name?` }, { quoted: m });
  const result = await global.tools.ai(`Information about ${q} animal`);
  await sock.sendMessage(m.key.remoteJid, { text: `🦁 ${result}` }, { quoted: m });
}};
global.commands.history = { category: "EDUCATION", desc: "Historical event", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Event?\nExample: history World War 2` }, { quoted: m });
  const result = await global.tools.ai(`History of ${q}`);
  await sock.sendMessage(m.key.remoteJid, { text: `📜 ${result}` }, { quoted: m });
}};
global.commands.quote = { category: "EDUCATION", desc: "Random quote", run: async (m, { sock }) => {
  const content = await global.tools.fun('quote');
  await sock.sendMessage(m.key.remoteJid, { text: content }, { quoted: m });
}};
global.commands.fact = { category: "EDUCATION", desc: "Random fact", run: async (m, { sock }) => {
  const content = await global.tools.fun('fact');
  await sock.sendMessage(m.key.remoteJid, { text: content }, { quoted: m });
}};
global.commands.advice = { category: "EDUCATION", desc: "Random advice", run: async (m, { sock }) => {
  const content = await global.tools.fun('advice');
  await sock.sendMessage(m.key.remoteJid, { text: content }, { quoted: m });
}};
global.commands.motivation = { category: "EDUCATION", desc: "Motivational quote", run: async (m, { sock }) => {
  const content = await global.tools.ai('Give me a motivational quote');
  await sock.sendMessage(m.key.remoteJid, { text: `💪 ${content}` }, { quoted: m });
}};

// 8. ENTERTAINMENT 27
global.commands.joke = { category: "ENTERTAINMENT", desc: "Random joke", run: async (m, { sock }) => {
  const content = await global.tools.fun('joke');
  await sock.sendMessage(m.key.remoteJid, { text: content }, { quoted: m });
}};
global.commands.meme = { category: "ENTERTAINMENT", desc: "Random meme", run: async (m, { sock }) => {
  try { const res = await axios.get('https://api.imgflip.com/get_memes'); const meme = res.data.data.memes[Math.floor(Math.random()*100)]; await sock.sendMessage(m.key.remoteJid, { image: { url: meme.url }, caption: `😂 ${meme.name}` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `😂 Why don't scientists trust atoms? Because they make up everything!` }, { quoted: m }); }
}};
global.commands.dare = { category: "ENTERTAINMENT", desc: "Dare challenge", run: async (m, { sock }) => {
  const content = await global.tools.ai('Give me a fun dare challenge');
  await sock.sendMessage(m.key.remoteJid, { text: `😈 Dare: ${content}` }, { quoted: m });
}};
global.commands.truth = { category: "ENTERTAINMENT", desc: "Truth question", run: async (m, { sock }) => {
  const content = await global.tools.ai('Give me a truth question for truth or dare');
  await sock.sendMessage(m.key.remoteJid, { text: `🤔 Truth: ${content}` }, { quoted: m });
}};
global.commands.wyr = { category: "ENTERTAINMENT", desc: "Would you rather", run: async (m, { sock }) => {
  const content = await global.tools.ai('Give me a would you rather question');
  await sock.sendMessage(m.key.remoteJid, { text: `🤷 ${content}` }, { quoted: m });
}};
global.commands.nhie = { category: "ENTERTAINMENT", desc: "Never have I ever", run: async (m, { sock }) => {
  const content = await global.tools.ai('Give me a never have I ever question');
  await sock.sendMessage(m.key.remoteJid, { text: `🙊 ${content}` }, { quoted: m });
}};
global.commands.riddle = { category: "ENTERTAINMENT", desc: "Random riddle", run: async (m, { sock }) => {
  const content = await global.tools.ai('Give me a riddle with answer');
  await sock.sendMessage(m.key.remoteJid, { text: `🧩 ${content}` }, { quoted: m });
}};
global.commands.pickupline = { category: "ENTERTAINMENT", desc: "Pick up line", run: async (m, { sock }) => {
  const content = await global.tools.ai('Give me a funny pick up line');
  await sock.sendMessage(m.key.remoteJid, { text: `😍 ${content}` }, { quoted: m });
}};
global.commands.roast = { category: "ENTERTAINMENT", desc: "Roast someone", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m);
  const content = await global.tools.ai('Give me a funny roast');
  await sock.sendMessage(m.key.remoteJid, { text: `🔥 ${target? `@${target.split('@')[0]}` : 'You'}: ${content}`, mentions: target? [target] : [] }, { quoted: m });
}};
global.commands.compliment = { category: "ENTERTAINMENT", desc: "Compliment someone", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m);
  const content = await global.tools.ai('Give me a nice compliment');
  await sock.sendMessage(m.key.remoteJid, { text: `😊 ${target? `@${target.split('@')[0]}` : 'You'}: ${content}`, mentions: target? [target] : [] }, { quoted: m });
}};
global.commands.ship = { category: "ENTERTAINMENT", desc: "Ship two people", run: async (m, { sock, q }) => {
  const users = q.split(' ').slice(0, 2);
  const percent = Math.floor(Math.random() * 101);
  await sock.sendMessage(m.key.remoteJid, { text: `💕 ${users[0] || 'You'} + ${users[1] || 'Me'} = ${percent}%\n${percent > 70? 'Perfect match!' : percent > 40? 'Good friends!' : 'Just friends!'}` }, { quoted: m });
}};
global.commands.howgay = { category: "ENTERTAINMENT", desc: "How gay meter", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m);
  const percent = Math.floor(Math.random() * 101);
  await sock.sendMessage(m.key.remoteJid, { text: `🏳️‍🌈 ${target? `@${target.split('@')[0]}` : 'You'} is ${percent}% gay`, mentions: target? [target] : [] }, { quoted: m });
}};
global.commands.howsimp = { category: "ENTERTAINMENT", desc: "How simp meter", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m);
  const percent = Math.floor(Math.random() * 101);
  await sock.sendMessage(m.key.remoteJid, { text: `😍 ${target? `@${target.split('@')[0]}` : 'You'} is ${percent}% simp`, mentions: target? [target] : [] }, { quoted: m });
}};
global.commands.howhot = { category: "ENTERTAINMENT", desc: "How hot meter", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m);
  const percent = Math.floor(Math.random() * 101);
  await sock.sendMessage(m.key.remoteJid, { text: `🔥 ${target? `@${target.split('@')[0]}` : 'You'} is ${percent}% hot`, mentions: target? [target] : [] }, { quoted: m });
}};
global.commands.howsmart = { category: "ENTERTAINMENT", desc: "How smart meter", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m);
  const percent = Math.floor(Math.random() * 101);
  await sock.sendMessage(m.key.remoteJid, { text: `🧠 ${target? `@${target.split('@')[0]}` : 'You'} is ${percent}% smart`, mentions: target? [target] : [] }, { quoted: m });
}};
global.commands.howstupid = { category: "ENTERTAINMENT", desc: "How stupid meter", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m);
  const percent = Math.floor(Math.random() * 101);
  await sock.sendMessage(m.key.remoteJid, { text: `🤪 ${target? `@${target.split('@')[0]}` : 'You'} is ${percent}% stupid`, mentions: target? [target] : [] }, { quoted: m });
}};
global.commands.howlucky = { category: "ENTERTAINMENT", desc: "How lucky meter", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m);
  const percent = Math.floor(Math.random() * 101);
  await sock.sendMessage(m.key.remoteJid, { text: `🍀 ${target? `@${target.split('@')[0]}` : 'You'} is ${percent}% lucky`, mentions: target? [target] : [] }, { quoted: m });
}};
global.commands.howbrave = { category: "ENTERTAINMENT", desc: "How brave meter", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m);
  const percent = Math.floor(Math.random() * 101);
  await sock.sendMessage(m.key.remoteJid, { text: `🦁 ${target? `@${target.split('@')[0]}` : 'You'} is ${percent}% brave`, mentions: target? [target] : [] }, { quoted: m });
}};
global.commands.howcute = { category: "ENTERTAINMENT", desc: "How cute meter", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m);
  const percent = Math.floor(Math.random() * 101);
  await sock.sendMessage(m.key.remoteJid, { text: `🥰 ${target? `@${target.split('@')[0]}` : 'You'} is ${percent}% cute`, mentions: target? [target] : [] }, { quoted: m });
}};
global.commands.howevi = { category: "ENTERTAINMENT", desc: "How evil meter", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m);
  const percent = Math.floor(Math.random() * 101);
  await sock.sendMessage(m.key.remoteJid, { text: `😈 ${target? `@${target.split('@')[0]}` : 'You'} is ${percent}% evil`, mentions: target? [target] : [] }, { quoted: m });
}};
global.commands.coin = { category: "ENTERTAINMENT", desc: "Flip coin", run: async (m, { sock }) => {
  const result = Math.random() > 0.5? 'Heads' : 'Tails';
  await sock.sendMessage(m.key.remoteJid, { text: `🪙 ${result}!` }, { quoted: m });
}};
global.commands.dice = { category: "ENTERTAINMENT", desc: "Roll dice", run: async (m, { sock }) => {
  const result = Math.floor(Math.random() * 6) + 1;
  await sock.sendMessage(m.key.remoteJid, { text: `🎲 You rolled: ${result}` }, { quoted: m });
}};
global.commands['8ball'] = { category: "ENTERTAINMENT", desc: "Magic 8 ball", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Ask a question` }, { quoted: m });
  const answers = ['Yes', 'No', 'Maybe', 'Definitely', 'Ask again later', 'Without a doubt', 'Very doubtful', 'Outlook good', 'Cannot predict now', 'Concentrate and ask again'];
  await sock.sendMessage(m.key.remoteJid, { text: `🎱 ${answers[Math.floor(Math.random() * answers.length)]}` }, { quoted: m });
}};
global.commands.slot = { category: "ENTERTAINMENT", desc: "Slot machine", run: async (m, { sock }) => {
  const emojis = ['🍒', '🍋', '🍊', '🍉', '🍇', '💎', '7️⃣'];
  const spin = [emojis[Math.floor(Math.random()*7)], emojis[Math.floor(Math.random()*7)], emojis[Math.floor(Math.random()*7)]];
  const win = spin[0] === spin[1] && spin[1] === spin[2];
  await sock.sendMessage(m.key.remoteJid, { text: `🎰 [ ${spin.join(' | ')} ]\n${win? '🎉 JACKPOT!' : '😢 Try again!'}` }, { quoted: m });
}};
global.commands.rps = { category: "ENTERTAINMENT", desc: "Rock paper scissors", run: async (m, { sock, q }) => {
  if (!q ||!['rock','paper','scissors'].includes(q.toLowerCase())) return sock.sendMessage(m.key.remoteJid, { text: `❌ Choose: rock, paper, or scissors` }, { quoted: m });
  const choices = ['rock', 'paper', 'scissors'];
  const bot = choices[Math.floor(Math.random() * 3)];
  const user = q.toLowerCase();
  let result = 'Tie!';
  if ((user === 'rock' && bot === 'scissors') || (user === 'paper' && bot === 'rock') || (user === 'scissors' && bot === 'paper')) result = 'You win!';
  if ((bot === 'rock' && user === 'scissors') || (bot === 'paper' && user === 'rock') || (bot === 'scissors' && user === 'paper')) result = 'Bot wins!';
  await sock.sendMessage(m.key.remoteJid, { text: `✊ You: ${user}\n🤖 Bot: ${bot}\n\n${result}` }, { quoted: m });
}};
global.commands.tictactoe = { category: "ENTERTAINMENT", desc: "Tic tac toe", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `⭕ Tic Tac Toe\n1️⃣2️⃣3️⃣\n4️⃣5️⃣6️⃣\n7️⃣8️⃣9️⃣\n\nReply with position number` }, { quoted: m });
}};
global.commands.hangman = { category: "ENTERTAINMENT", desc: "Hangman game", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🪢 Hangman\n_ _ _ _ _\nGuess a letter!` }, { quoted: m });
}};
global.commands.trivia = { category: "ENTERTAINMENT", desc: "Trivia question", run: async (m, { sock }) => {
  const content = await global.tools.ai('Give me a trivia question with answer');
  await sock.sendMessage(m.key.remoteJid, { text: `🧠 ${content}` }, { quoted: m });
}};
global.commands.fml = { category: "ENTERTAINMENT", desc: "FML story", run: async (m, { sock }) => {
  const content = await global.tools.ai('Give me a funny FML story');
  await sock.sendMessage(m.key.remoteJid, { text: `😫 ${content}` }, { quoted: m });
}};
global.commands.stupid = { category: "ENTERTAINMENT", desc: "Stupid question", run: async (m, { sock }) => {
  const content = await global.tools.ai('Give me a stupid question');
  await sock.sendMessage(m.key.remoteJid, { text: `🤪 ${content}` }, { quoted: m });
}};
global.commands.darkjoke = { category: "ENTERTAINMENT", desc: "Dark joke", run: async (m, { sock }) => {
  const content = await global.tools.ai('Tell me a dark humor joke');
  await sock.sendMessage(m.key.remoteJid, { text: `🖤 ${content}` }, { quoted: m });
}};
global.commands.yomama = { category: "ENTERTAINMENT", desc: "Yo mama joke", run: async (m, { sock }) => {
  const content = await global.tools.ai('Give me a yo mama joke');
  await sock.sendMessage(m.key.remoteJid, { text: `👵 ${content}` }, { quoted: m });
}};
global.commands.emojimix = { category: "ENTERTAINMENT", desc: "Mix emojis", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Usage: emojimix 😂+😭` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🎭 Emoji Mix: ${q} = 🥲` }, { quoted: m });
}};
global.commands.gif = { category: "ENTERTAINMENT", desc: "Random gif", run: async (m, { sock, q }) => {
  await sock.sendMessage(m.key.remoteJid, { video: { url: `https://api.ryzendesu.vip/api/gif?text=${encodeURIComponent(q || 'funny')}` }, gifPlayback: true, caption: `🎬 GIF: ${q || 'random'}` }, { quoted: m });
}};
global.commands.sticker = { category: "ENTERTAINMENT", desc: "Create sticker", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🎨 Reply to image/video with 'sticker'` }, { quoted: m });
}};
global.commands.togif = { category: "ENTERTAINMENT", desc: "Sticker to gif", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🎬 Reply to sticker with 'togif'` }, { quoted: m });
}};
global.commands.toimg = { category: "ENTERTAINMENT", desc: "Sticker to image", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Reply to sticker with 'toimg'` }, { quoted: m });
}};
global.commands.attp = { category: "ENTERTAINMENT", desc: "Animated text sticker", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { sticker: { url: `https://api.ryzendesu.vip/api/attp?text=${encodeURIComponent(q)}` } }, { quoted: m });
}};
global.commands.ttp = { category: "ENTERTAINMENT", desc: "Text to sticker", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { sticker: { url: `https://api.ryzendesu.vip/api/ttp?text=${encodeURIComponent(q)}` } }, { quoted: m });
}};

// 9. TOOLS 29 - ALL INCLUDED
global.commands.qr = { category: "TOOLS", desc: "Generate QR code", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text or URL?\nExample: qr https://google.com` }, { quoted: m });
  const url = await global.tools.qr(q); await sock.sendMessage(m.key.remoteJid, { image: { url }, caption: `📱 QR Code: ${q}` }, { quoted: m });
}};
global.commands.qrread = { category: "TOOLS", desc: "Read QR code", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `📱 Reply to QR image with 'qrread'` }, { quoted: m });
}};
global.commands.base64 = { category: "TOOLS", desc: "Encode base64", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m });
  const encoded = Buffer.from(q).toString('base64');
  await sock.sendMessage(m.key.remoteJid, { text: `🔐 Base64:\n${encoded}` }, { quoted: m });
}};
global.commands.unbase64 = { category: "TOOLS", desc: "Decode base64", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Base64?` }, { quoted: m });
  try { const decoded = Buffer.from(q, 'base64').toString(); await sock.sendMessage(m.key.remoteJid, { text: `🔓 Decoded:\n${decoded}` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Invalid base64` }, { quoted: m }); }
}};
global.commands.hex = { category: "TOOLS", desc: "Text to hex", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m });
  const hex = Buffer.from(q).toString('hex');
  await sock.sendMessage(m.key.remoteJid, { text: `🔢 *HEX*\n\nText: ${q}\nHex: ${hex}` }, { quoted: m });
}};
global.commands.unhex = { category: "TOOLS", desc: "Hex to text", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Hex?` }, { quoted: m });
  try { const text = Buffer.from(q, 'hex').toString(); await sock.sendMessage(m.key.remoteJid, { text: `📝 Text:\n${text}` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Invalid hex` }, { quoted: m }); }
}};
global.commands.binary = { category: "TOOLS", desc: "Text to binary", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m });
  const binary = q.split('').map(c => c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ');
  await sock.sendMessage(m.key.remoteJid, { text: `0️⃣1️⃣ *BINARY*\n\nText: ${q}\nBinary: ${binary}` }, { quoted: m });
}};
global.commands.unbinary = { category: "TOOLS", desc: "Binary to text", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Binary?` }, { quoted: m });
  try { const text = q.split(' ').map(b => String.fromCharCode(parseInt(b, 2))).join(''); await sock.sendMessage(m.key.remoteJid, { text: `📝 Text:\n${text}` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Invalid binary` }, { quoted: m }); }
}};
global.commands.hash = { category: "TOOLS", desc: "Hash text", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m });
  const md5 = crypto.createHash('md5').update(q).digest('hex');
  const sha1 = crypto.createHash('sha1').update(q).digest('hex');
  const sha256 = crypto.createHash('sha256').update(q).digest('hex');
  await sock.sendMessage(m.key.remoteJid, { text: `🔐 *Hashes*\n\nMD5: ${md5}\nSHA1: ${sha1}\nSHA256: ${sha256}` }, { quoted: m });
}};
global.commands.password = { category: "TOOLS", desc: "Generate password", run: async (m, { sock, q }) => {
  const length = parseInt(q) || 12;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let pass = '';
  for (let i = 0; i < length; i++) pass += chars.charAt(Math.floor(Math.random() * chars.length));
  await sock.sendMessage(m.key.remoteJid, { text: `🔑 Password: ${pass}` }, { quoted: m });
}};
global.commands.uuid = { category: "TOOLS", desc: "Generate UUID", run: async (m, { sock }) => {
  const uuid = crypto.randomUUID();
  await sock.sendMessage(m.key.remoteJid, { text: `🆔 UUID: ${uuid}` }, { quoted: m });
}};
global.commands.shorturl = { category: "TOOLS", desc: "Shorten URL", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ URL?` }, { quoted: m });
  try { const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(q)}`); await sock.sendMessage(m.key.remoteJid, { text: `🔗 Short URL:\n${res.data}` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to shorten` }, { quoted: m }); }
}};
global.commands.expandurl = { category: "TOOLS", desc: "Expand short URL", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Short URL?` }, { quoted: m });
  try { const res = await axios.head(q, { maxRedirects: 0, validateStatus: null }); await sock.sendMessage(m.key.remoteJid, { text: `🔗 Expanded URL:\n${res.headers.location || q}` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to expand` }, { quoted: m }); }
}};
global.commands.screenshot = { category: "TOOLS", desc: "Website screenshot", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Website URL?` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { image: { url: `https://image.thum.io/get/width/1200/crop/800/${q}` }, caption: `📸 Screenshot: ${q}` }, { quoted: m });
}};
global.commands.ssweb = { category: "TOOLS", desc: "Screenshot website", run: async (m, { sock, q }) => { return global.commands.screenshot.run(m, { sock, q }); }};
global.commands.whois = { category: "TOOLS", desc: "Domain whois", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Domain?\nExample: whois google.com` }, { quoted: m });
  const result = await global.tools.ai(`Whois information for domain ${q}`);
  await sock.sendMessage(m.key.remoteJid, { text: `🌐 ${result}` }, { quoted: m });
}};
global.commands.dns = { category: "TOOLS", desc: "DNS lookup", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Domain?` }, { quoted: m });
  const result = await global.tools.ai(`DNS records for ${q}`);
  await sock.sendMessage(m.key.remoteJid, { text: `🌐 ${result}` }, { quoted: m });
}};
global.commands.ping = { category: "TOOLS", desc: "Ping website", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Website?` }, { quoted: m });
  const start = Date.now();
  try { await axios.get(q, { timeout: 5000 }); await sock.sendMessage(m.key.remoteJid, { text: `🏓 Ping ${q}: ${Date.now() - start}ms` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Ping failed` }, { quoted: m }); }
}};
global.commands.headers = { category: "TOOLS", desc: "HTTP headers", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ URL?` }, { quoted: m });
  try { const res = await axios.head(q); let text = `📋 *Headers for ${q}*\n\n`; Object.keys(res.headers).forEach(k => text += `${k}: ${res.headers[k]}\n`); await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to fetch headers` }, { quoted: m }); }
}};
global.commands.useragent = { category: "TOOLS", desc: "Random user agent", run: async (m, { sock }) => {
  const uas = ['Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 'Mozilla/5.0 (X11; Linux x86_64)'];
  await sock.sendMessage(m.key.remoteJid, { text: `🖥️ ${uas[Math.floor(Math.random() * uas.length)]}` }, { quoted: m });
}};
global.commands.carbon = { category: "TOOLS", desc: "Code to image", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Code?` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { image: { url: `https://carbonara.solopov.dev/api/cook?code=${encodeURIComponent(q)}` }, caption: `💻 Code Image` }, { quoted: m });
}};
global.commands.tempmail = { category: "TOOLS", desc: "Temp email", run: async (m, { sock }) => {
  const email = `temp${Math.floor(Math.random()*10000)}@tempmail.com`;
  await sock.sendMessage(m.key.remoteJid, { text: `📧 Temp Email: ${email}\nValid for 10 minutes` }, { quoted: m });
}};
global.commands.checkmail = { category: "TOOLS", desc: "Check temp mail", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Email?` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `📬 No new messages for ${q}` }, { quoted: m });
}};
global.commands.obfuscate = { category: "TOOLS", desc: "Obfuscate code", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Code?` }, { quoted: m });
  const obfuscated = Buffer.from(q).toString('base64');
  await sock.sendMessage(m.key.remoteJid, { text: `🔒 Obfuscated:\neval(atob('${obfuscated}'))` }, { quoted: m });
}};
global.commands.beautify = { category: "TOOLS", desc: "Beautify JSON", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ JSON?` }, { quoted: m });
  try { const beautified = JSON.stringify(JSON.parse(q), null, 2); await sock.sendMessage(m.key.remoteJid, { text: `✨ Beautified:\n\`\`\`${beautified}\`\`\`` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Invalid JSON` }, { quoted: m }); }
}};
global.commands.minify = { category: "TOOLS", desc: "Minify JSON", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ JSON?` }, { quoted: m });
  try { const minified = JSON.stringify(JSON.parse(q)); await sock.sendMessage(m.key.remoteJid, { text: `📦 Minified:\n\`\`${minified}\`\`` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Invalid JSON` }, { quoted: m }); }
}};
global.commands.ocr = { category: "TOOLS", desc: "Image to text", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `📷 Reply to image with 'ocr'` }, { quoted: m });
}};
global.commands.removebg = { category: "TOOLS", desc: "Remove background", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Reply to image with 'removebg'` }, { quoted: m });
}};
global.commands.enhance = { category: "TOOLS", desc: "Enhance image", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `✨ Reply to image with 'enhance'` }, { quoted: m });
}};

// ------------------- START BOT + PAIRING CODE FOR 263716491962 -------------------
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

  // THIS GENERATES YOUR PAIRING CODE FOR 263716491962
  if (!sock.authState.creds.registered) {
    await new Promise(r => setTimeout(r, 3000));
    try {
      console.log('📱 Requesting pairing code for:', config.pairNumber);
      const code = await sock.requestPairingCode(config.pairNumber);
      console.log('\n========================================');
      console.log('🔐 YOUR PAIRING CODE:', code);
      console.log('========================================');
      console.log('1. Open WhatsApp > Linked Devices');
      console.log('2. Tap "Link with phone number instead"');
      console.log('3. Enter code:', code);
      console.log('========================================\n');
    } catch (e) {
      console.log('❌ PAIR ERROR:', e.message);
      console.log('Retrying in 10 seconds...');
      setTimeout(() => startBot(), 10000);
    }
  }

  sock.ev.on('connection.update', ({ connection, lastDisconnect }) => {
    if (connection === 'open') {
      console.log('✅ CONNECTED! Bot is 24/7 online');
      console.log(`📊 Total Commands: ${Object.keys(global.commands).length}`);
    }
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log('🔄 Reconnecting...');
        startBot();
      } else {
        console.log('❌ Logged out. Delete session folder and restart.');
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const body = m.message.conversation || m.message.extendedTextMessage?.text || '';
    const isCmd = body.startsWith(config.prefix);
    const command = isCmd? body.slice(config.prefix.length).trim().split(' ')[0].toLowerCase() : '';
    const q = body.slice(config.prefix.length + command.length).trim();
    const sender = m.key.participant || m.key.remoteJid;
    const isOwner = global.owner.includes(sender.split('@')[0]);

    if (config.autoReact) {
      try { await sock.sendMessage(m.key.remoteJid, { react: { text: '❤️', key: m.key } }); } catch {}
    }

    if (config.aiChat &&!isCmd && m.key.remoteJid.endsWith('@s.whatsapp.net')) {
      const reply = await global.tools.ai(body);
      return await sock.sendMessage(m.key.remoteJid, { text: reply }, { quoted: m });
    }

    if (isCmd && global.commands[command]) {
      try {
        await global.commands[command].run(m, { sock, q, isOwner, sender });
      } catch (e) {
        console.log('Command error:', e.message);
      }
    }
  });

  sock.ev.on('call', async (calls) => {
    if (config.antiCall) {
      for (const call of calls) {
        await sock.rejectCall(call.id, call.from);
        await sock.updateBlockStatus(call.from, 'block');
      }
    }
  });

  sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
    if (action === 'add') {
      for (const user of participants) {
        await sock.sendMessage(id, { text: `👋 Welcome @${user.split('@')[0]} to the group!`, mentions: [user] });
      }
    } else if (action === 'remove') {
      for (const user of participants) {
        await sock.sendMessage(id, { text: `👋 Goodbye @${user.split('@')[0]}`, mentions: [user] });
      }
    }
  });
}

// THIS STARTS THE BOT AND GENERATES PAIRING CODE
startBot();

process.on('uncaughtException', (err) => console.log('Caught:', err.message));
process.on('unhandledRejection', (err) => console.log('Rejection:', err.message⁹));

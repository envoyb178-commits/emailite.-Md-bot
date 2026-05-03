const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// 24/7 KEEP-ALIVE FOR RENDER
app.get('/', (req, res) => res.send('EMAILLITE MD BOT is running 24/7'));
app.get('/ping', (req, res) => res.send('pong'));
app.listen(PORT, () => console.log(`✅ Web server online on port ${PORT}`));

if (process.env.RENDER_EXTERNAL_URL) {
  setInterval(() => {
    require('https').get(process.env.RENDER_EXTERNAL_URL).on('error', () => {});
  }, 4 * 60 * 1000);
}

console.log('🚀 BOOTING EMAILLITE MD...');

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion, generateProfilePicture } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs-extra');
const axios = require('axios');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');
const crypto = require('crypto');
const path = require('path');
const PDFDocument = require("pdfkit");
const util = require("util");

// GLOBAL CONFIG
global.config = {
  owner: "Envoy Chiambiro",
  ownerNumber: "27856024885",
  botName: "EMAILLITE MD",
  version: "6.0.0",
  mode: "public",
  sessionDir: "./session",
  autoReact: true,
  antiCall: true,
  aiChat: true,
  pairNumber: "27856024885",
  API: "https://api.ryzendesu.vip"
};

global.owner = [global.config.ownerNumber];
global.commands = {};
let pdfStore = {};

fs.mkdirSync(global.config.sessionDir, { recursive: true });
fs.ensureDirSync('./temp');

const getRuntime = () => {
  const uptime = process.uptime();
  const d = Math.floor(uptime / 86400);
  const h = Math.floor((uptime % 86400) / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
};

const safeMath = (expression) => {
  try {
    if (!/^[\d\s+\-*/()%\.]+$/.test(expression)) return "Invalid expression";
    const result = Function('"use strict"; return (' + expression + ')')();
    return isNaN(result) ? "Invalid calculation" : result;
  } catch {
    return "Invalid calculation";
  }
};

const getTarget = (m) => {
  return m.message?.extendedTextMessage?.contextInfo?.participant ||
         m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
         null;
};

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
  getTarget: (m) => m.message?.extendedTextMessage?.contextInfo?.participant || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || null,
  // ADDED APLS FUNCTION
  apls: async (query) => {
    try {
      const res = await axios.get(`https://api.ryzendesu.vip/api/search/apk?query=${encodeURIComponent(query)}`);
      return res.data;
    } catch {
      return { error: "APLS search failed" };
    }
  }
};

// ------------------- COMMAND HANDLER -------------------
global.commands.menu = { category: "MAIN", desc: "Show bot menu", run: async (m, { sock }) => { 
  await sock.sendMessage(m.key.remoteJid, { text: `🤖 *${global.config.botName} v${global.config.version}*\n📊 Commands: ${Object.keys(global.commands).length}\n👑 Owner: ${global.config.owner}\n⚙️ Mode: ${global.config.mode.toUpperCase()}\n⏰ Uptime: ${global.tools.uptime()}\n🌐 Status: 24/7 ONLINE\n\nType: allmenu` }, { quoted: m }); 
}};

global.commands.allmenu = { category: "MAIN", desc: "Show all commands", run: async (m, { sock }) => { 
  const cats = {}; 
  Object.keys(global.commands).forEach(key => { 
    const cmd = global.commands[key];
    if (!cats[cmd.category]) cats[cmd.category] = []; 
    cats[cmd.category].push(key); 
  }); 
  let menu = `╔═══ *${global.config.botName.toUpperCase()}* 🔥\n║ 👑 Owner: ${global.config.owner}\n║ 📊 Commands: ${Object.keys(global.commands).length}\n║ ⏰ Uptime: ${global.tools.uptime()}\n║ 🌐 Status: 24/7 ONLINE\n╚══════════════════════\n\n`; 
  Object.keys(cats).sort().forEach(cat => { menu += `╔═══ *${cat}* ═══╗\n║ ${cats[cat].join('\n║ ')}\n╚═══════════════╝\n\n`; }); 
  await sock.sendMessage(m.key.remoteJid, { text: menu }, { quoted: m }); 
}};

global.commands.ping = { category: "MAIN", desc: "Check bot speed", run: async (m, { sock }) => { 
  const s = Date.now(); 
  await sock.sendMessage(m.key.remoteJid, { text: `🏓 Pong! ${Date.now() - s}ms\n✅ All systems operational\n🌐 24/7 Online` }, { quoted: m }); 
}};

global.commands.alive = { category: "MAIN", desc: "Check if bot is alive", run: async (m, { sock }) => { 
  await sock.sendMessage(m.key.remoteJid, { text: `✅ ${global.config.botName} Alive 24/7!\n📊 Commands: ${Object.keys(global.commands).length}\n⏰ Uptime: ${global.tools.uptime()}\n🌐 Never Sleeps` }, { quoted: m }); 
}};

global.commands.owner = { category: "MAIN", desc: "Show owner info", run: async (m, { sock }) => { 
  await sock.sendMessage(m.key.remoteJid, { text: `👑 Owner: ${global.config.owner}\n📞 Number: ${global.config.ownerNumber}` }, { quoted: m }); 
}};

global.commands.uptime = { category: "MAIN", desc: "Bot uptime", run: async (m, { sock }) => { 
  await sock.sendMessage(m.key.remoteJid, { text: `⏰ Uptime: ${global.tools.uptime()}\n🌐 Status: 24/7 Online` }, { quoted: m }); 
}};

// ADDED APLS COMMAND
global.commands.apls = { category: "TOOLS", desc: "Search APK files", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ What app to search?\nExample: apls whatsapp` }, { quoted: m });
  try {
    const result = await global.tools.apls(q);
    if (result.error) return sock.sendMessage(m.key.remoteJid, { text: `❌ Search failed` }, { quoted: m });
    let text = `📱 *APK SEARCH: ${q}*\n\n`;
    if (result.data && result.data.length) {
      result.data.slice(0, 5).forEach((app, i) => {
        text += `${i+1}. *${app.title || app.name}*\n📥 Size: ${app.size || 'N/A'}\n⭐ Rating: ${app.rating || 'N/A'}\n🔗 ${app.link || app.url}\n\n`;
      });
    } else {
      text += "No results found. Try different search term.";
    }
    await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
  } catch (err) {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Error: ${err.message}` }, { quoted: m });
  }
}};

global.commands.apksearch = { category: "TOOLS", desc: "Search APK files", run: async (m, { sock, q }) => { return global.commands.apls.run(m, { sock, q }); }};

// AI COMMANDS
global.commands.ai = { category: "AI", desc: "Chat with AI", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Ask something` }, { quoted: m });
  const reply = await global.tools.ai(q);
  await sock.sendMessage(m.key.remoteJid, { text: `🤖 ${reply}` }, { quoted: m });
}};

global.commands.imagine = { category: "AI", desc: "Generate AI image", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Give prompt` }, { quoted: m });
  const url = await global.tools.aiImage(q);
  await sock.sendMessage(m.key.remoteJid, { image: { url }, caption: `🎨 ${q}` }, { quoted: m });
}};

// STICKER COMMAND
global.commands.sticker = { category: "CONVERT", desc: "Image to sticker", run: async (m, { sock }) => {
  if (!m.quoted?.message?.imageMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to an image` }, { quoted: m });
  try {
    const buffer = await sock.downloadMediaMessage(m.quoted);
    await sock.sendMessage(m.key.remoteJid, { sticker: buffer }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed` }, { quoted: m }); }
}};

// CALCULATOR
global.commands.calc = { category: "TOOLS", desc: "Calculate math", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Expression?` }, { quoted: m });
  const result = await global.tools.math(q);
  await sock.sendMessage(m.key.remoteJid, { text: `🔢 ${q} = ${result}` }, { quoted: m });
}};

// WEATHER
global.commands.weather = { category: "TOOLS", desc: "Weather info", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ City?` }, { quoted: m });
  const weather = await global.tools.weather(q);
  await sock.sendMessage(m.key.remoteJid, { text: weather }, { quoted: m });
}};

// TRANSLATE
global.commands.translate = { category: "TOOLS", desc: "Translate text", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Usage: translate text | lang` }, { quoted: m });
  const [text, lang = 'en'] = q.split('|').map(s => s.trim());
  const translated = await global.tools.translate(text, lang);
  await sock.sendMessage(m.key.remoteJid, { text: `🌐 ${translated}` }, { quoted: m });
}};

// QR CODE
global.commands.qr = { category: "TOOLS", desc: "Generate QR code", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text or URL?` }, { quoted: m });
  const url = await global.tools.qr(q);
  await sock.sendMessage(m.key.remoteJid, { image: { url }, caption: `📱 QR: ${q}` }, { quoted: m });
}};

// IP INFO
global.commands.ip = { category: "TOOLS", desc: "IP lookup", run: async (m, { sock }) => {
  const data = await global.tools.ipinfo();
  await sock.sendMessage(m.key.remoteJid, { text: `🌐 IP: ${data.ip}\n📍 ${data.country}` }, { quoted: m });
}};

// NEWS
global.commands.news = { category: "TOOLS", desc: "Latest news", run: async (m, { sock, q }) => {
  const news = await global.tools.news(q || 'world');
  await sock.sendMessage(m.key.remoteJid, { text: news }, { quoted: m });
}};

// JOKE
global.commands.joke = { category: "FUN", desc: "Random joke", run: async (m, { sock }) => {
  const joke = await global.tools.fun('joke');
  await sock.sendMessage(m.key.remoteJid, { text: joke }, { quoted: m });
}};

// QUOTE
global.commands.quote = { category: "FUN", desc: "Random quote", run: async (m, { sock }) => {
  const quote = await global.tools.fun('quote');
  await sock.sendMessage(m.key.remoteJid, { text: quote }, { quoted: m });
}};

// DICE
global.commands.dice = { category: "FUN", desc: "Roll dice", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🎲 ${Math.floor(Math.random()*6)+1}` }, { quoted: m });
}};

// COIN FLIP
global.commands.coin = { category: "FUN", desc: "Flip coin", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🪙 ${Math.random() > 0.5 ? 'Heads' : 'Tails'}` }, { quoted: m });
}};

// GROUP TAGALL
global.commands.tagall = { category: "GROUP", desc: "Tag all members", run: async (m, { sock }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
  const jids = groupMetadata.participants.map(p => p.id);
  const msg = groupMetadata.participants.map((p, i) => `${i+1}. @${p.id.split('@')[0]}`).join('\n');
  await sock.sendMessage(m.key.remoteJid, { text: `📢 *${jids.length} MEMBERS*\n\n${msg}`, mentions: jids }, { quoted: m });
}};

// HUG
global.commands.hug = { category: "REACTION", desc: "Hug someone", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m);
  if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Mention or reply to user` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🤗 @${m.sender.split('@')[0]} hugs @${target.split('@')[0]}`, mentions: [m.sender, target] }, { quoted: m });
}};

// KISS
global.commands.kiss = { category: "REACTION", desc: "Kiss someone", run: async (m, { sock }) => {
  const target = global.tools.getTarget(m);
  if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Mention or reply to user` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `😘 @${m.sender.split('@')[0]} kisses @${target.split('@')[0]}`, mentions: [m.sender, target] }, { quoted: m });
}};

// SONG DOWNLOAD
global.commands.song = { category: "DOWNLOAD", desc: "Download song", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Song name?` }, { quoted: m });
  try {
    await sock.sendMessage(m.key.remoteJid, { text: `🔍 Searching: ${q}` }, { quoted: m });
    const search = await global.tools.ytsearch(q);
    if (!search.length) return sock.sendMessage(m.key.remoteJid, { text: `❌ Not found` }, { quoted: m });
    const data = await global.tools.ytdl(search[0].url, 'mp3');
    await sock.sendMessage(m.key.remoteJid, { audio: { url: data.url }, mimetype: 'audio/mpeg', fileName: `${data.title}.mp3` }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed` }, { quoted: m }); }
}};

// VIDEO DOWNLOAD
global.commands.video = { category: "DOWNLOAD", desc: "Download video", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ YouTube link?` }, { quoted: m });
  try {
    const data = await global.tools.ytdl(q, 'mp4');
    await sock.sendMessage(m.key.remoteJid, { video: { url: data.url }, caption: `📹 ${data.title}` }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed` }, { quoted: m }); }
}};

// TIKTOK
global.commands.tiktok = { category: "DOWNLOAD", desc: "Download TikTok", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ TikTok link?` }, { quoted: m });
  try {
    const data = await global.tools.tiktok(q);
    await sock.sendMessage(m.key.remoteJid, { video: { url: data.video }, caption: `📱 TikTok` }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed` }, { quoted: m }); }
}};

// INSTAGRAM
global.commands.ig = { category: "DOWNLOAD", desc: "Download Instagram", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Instagram link?` }, { quoted: m });
  try {
    const data = await global.tools.instagram(q);
    await sock.sendMessage(m.key.remoteJid, { video: { url: data.url }, caption: `📸 Instagram` }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed` }, { quoted: m }); }
}};

// WIKIPEDIA
global.commands.wiki = { category: "TOOLS", desc: "Wikipedia search", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Search term?` }, { quoted: m });
  const wiki = await global.tools.wiki(q);
  await sock.sendMessage(m.key.remoteJid, { text: wiki }, { quoted: m });
}};

// DICTIONARY
global.commands.dict = { category: "TOOLS", desc: "Dictionary", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Word?` }, { quoted: m });
  const def = await global.tools.dictionary(q);
  await sock.sendMessage(m.key.remoteJid, { text: def }, { quoted: m });
}};

// CRYPTO PRICE
global.commands.crypto = { category: "TOOLS", desc: "Crypto price", run: async (m, { sock, q }) => {
  const price = await global.tools.crypto(q || 'bitcoin');
  await sock.sendMessage(m.key.remoteJid, { text: price }, { quoted: m });
}};

// CURRENCY CONVERT
global.commands.currency = { category: "TOOLS", desc: "Currency convert", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Usage: currency 100 USD EUR` }, { quoted: m });
  const [amount, from, to] = q.split(' ');
  const result = await global.tools.currency(amount, from, to);
  await sock.sendMessage(m.key.remoteJid, { text: result }, { quoted: m });
}};

// PINTEREST
global.commands.pinterest = { category: "DOWNLOAD", desc: "Pinterest image", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Search term?` }, { quoted: m });
  const url = await global.tools.pinterest(q);
  await sock.sendMessage(m.key.remoteJid, { image: { url }, caption: `📌 ${q}` }, { quoted: m });
}};

// RINGTONE
global.commands.ringtone = { category: "DOWNLOAD", desc: "Ringtone search", run: async (m, { sock, q }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🔔 Ringtone: ${q || 'random'}\nUse: zedge.net` }, { quoted: m });
}};

// APK (redirect to apls)
global.commands.apk = { category: "DOWNLOAD", desc: "Search APK", run: async (m, { sock, q }) => {
  return global.commands.apls.run(m, { sock, q });
}};

console.log(`✅ Total Commands Loaded: ${Object.keys(global.commands).length}`);

// ------------------- SOCKET STARTUP -------------------
async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(global.config.sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    browser: Browsers.macOS("Safari")
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "open") {
      console.log("✅ Bot connected successfully!");
      console.log(`🤖 ${global.config.botName} is now online!`);
      console.log(`📊 Total commands: ${Object.keys(global.commands).length}`);
      console.log(`👑 Owner: ${global.config.owner} (${global.config.ownerNumber})`);
      
      // Send startup message to owner
      await sock.sendMessage(global.config.ownerNumber + '@s.whatsapp.net', { 
        text: `🤖 *${global.config.botName} Online*\n📊 Commands: ${Object.keys(global.commands).length}\n🌐 24/7 Active` 
      }).catch(() => {});
    }

    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) {
        console.log("Reconnecting in 5 seconds...");
        setTimeout(start, 5000);
      } else {
        console.log("Logged out. Delete session folder and restart.");
      }
    }
  });

  // PAIRING CODE
  if (!sock.authState.creds.registered) {
    const phoneNumber = global.config.ownerNumber;
    console.log(`\n🔐 Requesting pairing code for ${phoneNumber}...`);
    
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        console.log(`\n🔐 YOUR PAIRING CODE: ${code}\n`);
        console.log("📌 WhatsApp > Settings > Linked Devices > Link a Device");
        console.log("📌 Enter this code to pair\n");
      } catch (error) {
        console.log("❌ Failed to get pairing code:", error.message);
      }
    }, 3000);
  }

  // ANTI-CALL
  if (global.config.antiCall) {
    sock.ev.on("call", async (calls) => {
      for (const call of calls) {
        await sock.sendMessage(call.from, { text: "📞 Bot doesn't accept calls. Text only." });
        await sock.rejectCall(call.id).catch(() => {});
      }
    });
  }

  // MESSAGE HANDLER
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const jid = m.key.remoteJid;
    const pushName = m.pushName || "User";
    const body = m.message.conversation || m.message.extendedTextMessage?.text || "";

    if (!body) return;

    // AUTO-REACT
    if (global.config.autoReact) {
      await sock.sendMessage(jid, { react: { text: "⚡", key: m.key } }).catch(() => {});
    }

    // AI CHAT MODE
    if (global.config.aiChat && !body.toLowerCase().startsWith("stopai")) {
      const cmdNames = Object.keys(global.commands);
      const isCommand = cmdNames.some(cmd => body.toLowerCase().split(" ")[0] === cmd);
      if (!isCommand) {
        try {
          const reply = await global.tools.ai(body);
          await sock.sendMessage(jid, { text: `🤖 ${reply}` }, { quoted: m });
        } catch {
          await sock.sendMessage(jid, { text: `🤖 I'm having trouble. Try again.` }, { quoted: m });
        }
        return;
      }
    }

    // COMMAND DISPATCHER
    const [cmdName, ...args] = body.trim().split(" ");
    const q = args.join(" ");
    const cmd = global.commands[cmdName.toLowerCase()];

    if (cmd) {
      try {
        await sock.sendMessage(jid, { react: { text: "✅", key: m.key } }).catch(() => {});
        await cmd.run(m, { sock, q, args, pushName });
      } catch (err) {
        console.error(`Command error:`, err);
        await sock.sendMessage(jid, { text: `❌ Error: ${err.message}` }, { quoted: m });
      }
    }
  });
}

console.log(`🚀 Starting ${global.config.botName} v${global.config.version}...`);
console.log(`📊 Total commands: ${Object.keys(global.commands).length}`);
console.log(`👑 Owner: ${global.config.owner} (${global.config.ownerNumber})`);
console.log(`📱 No prefix needed - just type commands directly\n`);

start();

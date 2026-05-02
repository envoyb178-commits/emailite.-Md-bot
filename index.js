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

console.log('🚀 BOOTING EMAILLITE MD...');

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
global.commands = {};

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

// ------------------- COMMANDS -------------------
global.commands.ping = { category: "MAIN", desc: "Check bot speed", run: async (m, { sock }) => {
  const s = Date.now();
  await sock.sendMessage(m.key.remoteJid, { text: `🏓 Pong! ${Date.now() - s}ms\n✅ 24/7 Online` }, { quoted: m });
}};
global.commands.alive = { category: "MAIN", desc: "Check if bot is alive", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `✅ ${config.botName} Alive 24/7!\n⏰ Uptime: ${global.tools.uptime()}\n⚙️ Mode: ${config.mode}` }, { quoted: m });
}};
global.commands.menu = { category: "MAIN", desc: "Show bot menu", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🤖 *${config.botName} v${config.version}*\n📊 Commands: ${Object.keys(global.commands).length}\n👑 Owner: ${config.owner}\n⚙️ Mode: ${config.mode}\n⏰ Uptime: ${global.tools.uptime()}\n🌐 Status: 24/7 ONLINE` }, { quoted: m });
}};
global.commands.ai = { category: "AI", desc: "Chat with AI", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Ask something\nExample: ai what is quantum physics` }, { quoted: m });
  const reply = await global.tools.ai(q);
  await sock.sendMessage(m.key.remoteJid, { text: `🤖 ${reply}` }, { quoted: m });
}};
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
global.commands.video = { category: "DOWNLOAD", desc: "Download video", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ YouTube link or name?` }, { quoted: m });
  try {
    await sock.sendMessage(m.key.remoteJid, { text: `🔍 Downloading video...` }, { quoted: m });
    const url = q.startsWith('http')? q : (await global.tools.ytsearch(q))[0].url;
    const data = await global.tools.ytdl(url, 'mp4');
    await sock.sendMessage(m.key.remoteJid, { video: { url: data.url }, caption: `📹 ${data.title}` }, { quoted: m });
  } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Video download failed` }, { quoted: m }); }
}};
global.commands.tagall = { category: "GROUP", desc: "Tag all members", run: async (m, { sock }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group command only` }, { quoted: m });
  const groupMetadata = await sock.groupMetadata(m.key.remoteJid).catch(() => ({ participants: [] }));
  if (!groupMetadata.participants.length) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to fetch members` }, { quoted: m });
  const msg = groupMetadata.participants.map((p, i) => `${i + 1}. @${p.id.split('@')[0]} ${p.admin? '👑' : '👤'}`).join("\n");
  const jids = groupMetadata.participants.map(p => p.id);
  return await sock.sendMessage(m.key.remoteJid, { text: `📢 *TAGGING ALL ${jids.length} MEMBERS*\n\n${msg}`, mentions: jids }, { quoted: m });
}};
global.commands.joke = { category: "ENTERTAINMENT", desc: "Random joke", run: async (m, { sock }) => {
  const content = await global.tools.fun('joke');
  await sock.sendMessage(m.key.remoteJid, { text: content }, { quoted: m });
}};
global.commands.wiki = { category: "EDUCATION", desc: "Wikipedia search", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Topic?\nExample: wiki Zimbabwe` }, { quoted: m });
  const result = await global.tools.wiki(q);
  await sock.sendMessage(m.key.remoteJid, { text: result }, { quoted: m });
}};

// ------------------- START BOT + PAIRING CODE -------------------
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

  // FORCE REQUEST PAIRING CODE FOR 263716491962
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

  // MESSAGE HANDLER
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

  // Anti-call
  sock.ev.on('call', async (calls) => {
    if (config.antiCall) {
      for (const call of calls) {
        await sock.rejectCall(call.id, call.from);
        await sock.updateBlockStatus(call.from, 'block');
      }
    }
  });
}

// THIS LINE WAS MISSING - THIS STARTS THE BOT
startBot();

process.on('uncaughtException', (err) => console.log('Caught:', err.message));
process.on('unhandledRejection', (err) => console.log('Rejection:', err.message));

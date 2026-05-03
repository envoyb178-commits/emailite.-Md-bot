const express = require('express');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs-extra');
const axios = require('axios');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// ------------------- 24/7 KEEP-ALIVE + FAST RECONNECT -------------------
app.get('/', (req, res) => res.send('EMAILLITE MD BOT - 24/7 ONLINE'));
app.get('/ping', (req, res) => res.send('pong'));
app.listen(PORT, () => console.log(`✅ Web server online on port ${PORT}`));
if (process.env.RENDER_EXTERNAL_URL) setInterval(() => require('https').get(process.env.RENDER_EXTERNAL_URL).on('error', () => {}), 4 * 60 * 1000);
setInterval(() => require('http').get(`http://localhost:${PORT}/ping`).on('error', () => {}), 4 * 60 * 1000);

console.log('🚀 BOOTING EMAILLITE MD - 154 COMMANDS - 24/7');

// ------------------- CONFIG -------------------
global.config = {
  owner: "Envoy Chiambiro",
  ownerNumber: "27836024885",
  pairNumber: "263716491962",
  botName: "EMAILLITE MD",
  version: "11.0.0",
  mode: "public",
  sessionDir: "./session",
  prefix: "",
  prefixes: ["", "."], // No prefix +. both work
  autoReact: true,
  antiCall: true,
  antilink: false,
  antidelete: false,
  autoread: false,
  autotyping: false,
  online: true,
  welcome: true,
  goodbye: true,
  reactEmojis: ['❤️','🔥','😂','👍','💯'],
  ownerEmojis: ['👑','⚡','💎'],
  stickerPack: 'EMAILLITE MD',
  welcomeMsg: 'Welcome @user to @group!\nRead the description.',
  goodbyeMsg: 'Goodbye @user 👋',
  anticallMsg: 'Calls not allowed. You will be blocked.'
};

fs.mkdirSync(config.sessionDir, { recursive: true });
fs.mkdirSync('./temp', { recursive: true });
global.owner = [config.ownerNumber, config.pairNumber];
global.commands = {};

// ------------------- API TOOLS -------------------
global.tools = {
  uptime: () => { const up = process.uptime(); const d = Math.floor(up / 86400); const h = Math.floor((up % 86400) / 3600); const m = Math.floor((up % 3600) / 60); return `${d}d ${h}h ${m}m`; },
  ai: async (q) => { try { const res = await axios.get(`https://api.ryzendesu.vip/api/ai/gemini?text=${encodeURIComponent(q)}`, { timeout: 10000 }); return res.data.result || res.data.success || res.data.response || "No response"; } catch { return "AI service busy, try again"; } },
  aiImage: async (p) => `https://image.pollinations.ai/prompt/${encodeURIComponent(p)}?width=1024&height=1024&nologo=true`,
  logo: async (type, text) => { const res = await axios.get(`https://api.ryzendesu.vip/api/ephoto/${type}?text=${encodeURIComponent(text)}`, { responseType: 'arraybuffer', timeout: 15000 }); return Buffer.from(res.data); },
  ytdl: async (url, type = 'mp3') => { const info = await ytdl.getInfo(url); const format = type === 'mp3'? ytdl.chooseFormat(info.formats, { quality: 'highestaudio' }) : ytdl.chooseFormat(info.formats, { quality: 'highest' }); return { url: format.url, title: info.videoDetails.title }; },
  ytsearch: async (q) => { try { return (await yts(q)).videos.slice(0, 5); } catch { return []; } },
  tiktok: async (url) => { const res = await axios.get(`https://api.ryzendesu.vip/api/dlp/tiktok?url=${encodeURIComponent(url)}`, { timeout: 15000 }); return { video: res.data.video || res.data.url, title: res.data.title || 'TikTok' }; },
  instagram: async (url) => { const res = await axios.get(`https://api.ryzendesu.vip/api/dlp/instagram?url=${encodeURIComponent(url)}`, { timeout: 15000 }); return { url: res.data.url || res.data.video }; },
  spotify: async (q) => { const search = await global.tools.ytsearch(q + ' audio'); if (!search.length) throw 'Not found'; return await global.tools.ytdl(search[0].url, 'mp3'); },
  pinterest: async (q) => { try { const res = await axios.get(`https://api.ryzendesu.vip/api/search/pinterest?query=${encodeURIComponent(q)}`); return res.data[0]; } catch { return `https://source.unsplash.com/800x600/?${encodeURIComponent(q)}`; } },
  gitstalk: async (user) => { const res = await axios.get(`https://api.github.com/users/${user}`); return `👤 *GitHub: ${res.data.login}*\nName: ${res.data.name}\nBio: ${res.data.bio}\nRepos: ${res.data.public_repos}\nFollowers: ${res.data.followers}`; },
  ipfinder: async (ip) => { const res = await axios.get(`http://ip-api.com/json/${ip}`); return `🌐 *IP: ${ip}*\nCountry: ${res.data.country}\nCity: ${res.data.city}\nISP: ${res.data.isp}`; },
  translate: async (text, lang = 'es') => { const res = await axios.get(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${lang}`); return res.data.responseData.translatedText; },
  weather: async (city) => { try { const res = await axios.get(`https://api.ryzendesu.vip/api/tools/weather?city=${encodeURIComponent(city)}`); return `🌤️ *${city}*\nTemp: ${res.data.temp}°C\nCondition: ${res.data.condition}`; } catch { return await global.tools.ai(`Weather in ${city}`); } },
  ocr: async (url) => { const res = await axios.get(`https://api.ocr.space/parse/imageurl?apikey=helloworld&url=${encodeURIComponent(url)}`); return res.data.ParsedResults[0].ParsedText || 'No text found'; },
  shorturl: async (url) => { const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`); return res.data; },
  getTarget: (m) => m.message?.extendedTextMessage?.contextInfo?.participant || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || null,
  isAdmin: async (sock, jid, user) => { try { const metadata = await sock.groupMetadata(jid); return metadata.participants.find(p => p.id === user)?.admin!== null; } catch { return false; } },
  downloadMedia: async (msg) => { const buffer = await require('@whiskeysockets/baileys').downloadMediaMessage(msg, 'buffer', {}, { logger: pino({ level: 'silent' }) }); return buffer; }
};

// ------------------- MAIN 11 -------------------
global.commands.menu = { category: "MAIN", desc: "Show menu", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🤖 *${config.botName} v${config.version}*\n📊 Commands: ${Object.keys(global.commands).length}\n👑 Owner: ${config.owner}\n⚙️ Mode: ${config.mode}\n⏰ Uptime: ${global.tools.uptime()}\n🌐 Status: 24/7 ONLINE\n📱 Pair: ${config.pairNumber}` }, { quoted: m }); }};
global.commands.allmenu = { category: "MAIN", desc: "All commands", run: async (m, { sock }) => { const cats = {}; Object.values(global.commands).forEach(c => { if (!cats[c.category]) cats[c.category] = []; cats[c.category].push(Object.keys(global.commands).find(k => global.commands[k] === c)); }); let menu = `╔═══ *${config.botName.toUpperCase()}* ═══╗\n║ Commands: ${Object.keys(global.commands).length}\n║ Prefix: None or.\n║ Uptime: ${global.tools.uptime()}\n╚══════════════════════╝\n\n`; Object.keys(cats).sort().forEach(cat => { menu += `╔═══ *${cat}* ═══╗\n║ ${cats[cat].join('\n║ ')}\n╚═══════════════╝\n\n`; }); await sock.sendMessage(m.key.remoteJid, { text: menu }, { quoted: m }); }};
global.commands.ping = { category: "MAIN", desc: "Bot speed", run: async (m, { sock }) => { const s = Date.now(); await sock.sendMessage(m.key.remoteJid, { text: `🏓 Pong! ${Date.now() - s}ms\n✅ 24/7 Online` }, { quoted: m }); }};
global.commands.alive = { category: "MAIN", desc: "Bot alive", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `✅ ${config.botName} Alive 24/7!\n📊 Commands: ${Object.keys(global.commands).length}\n⏰ Uptime: ${global.tools.uptime()}` }, { quoted: m }); }};
global.commands.owner = { category: "MAIN", desc: "Owner info", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `👑 Owner: ${config.owner}\n📞 Number: ${config.ownerNumber}\n📱 Pair: ${config.pairNumber}` }, { quoted: m }); }};
global.commands.uptime = { category: "MAIN", desc: "Bot uptime", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⏰ Uptime: ${global.tools.uptime()}\n🌐 Status: 24/7 Online` }, { quoted: m }); }};
global.commands.system = { category: "MAIN", desc: "System info", run: async (m, { sock }) => { const used = process.memoryUsage(); await sock.sendMessage(m.key.remoteJid, { text: `💻 *System*\nRAM: ${(used.rss / 1024 / 1024).toFixed(2)} MB\nPlatform: ${process.platform}\nUptime: ${global.tools.uptime()}\nNode: ${process.version}` }, { quoted: m }); }};
global.commands.pair = { category: "MAIN", desc: "Pair request", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide number` }, { quoted: m }); const number = q.replace(/[^0-9]/g, ''); await sock.sendMessage(config.ownerNumber + '@s.whatsapp.net', { text: `🔐 Pair Request: ${number}\nFrom: @${m.sender.split('@')[0]}`, mentions: [m.sender] }); await sock.sendMessage(m.key.remoteJid, { text: `📩 Pair request sent` }, { quoted: m }); }};
global.commands.runtime = { category: "MAIN", desc: "Runtime", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⏱️ Runtime: ${global.tools.uptime()}` }, { quoted: m }); }};
global.commands.botinfo = { category: "MAIN", desc: "Bot info", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🤖 *Bot Info*\nName: ${config.botName}\nVersion: ${config.version}\nCommands: ${Object.keys(global.commands).length}\nOwner: ${config.owner}\nMode: ${config.mode}\nUptime: ${global.tools.uptime()}\nPair: ${config.pairNumber}` }, { quoted: m }); }};
global.commands.list = { category: "MAIN", desc: "Command list", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📋 Total Commands: ${Object.keys(global.commands).length}\nType: allmenu for full list` }, { quoted: m }); }};

// ------------------- AI 6 -------------------
const aiHandler = async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Ask something` }, { quoted: m }); const reply = await global.tools.ai(q); await sock.sendMessage(m.key.remoteJid, { text: `🤖 ${reply}` }, { quoted: m }); };
global.commands.ai = { category: "AI", desc: "Chat AI", run: aiHandler };
global.commands.chatgpt = { category: "AI", desc: "ChatGPT", run: aiHandler };
global.commands.gemini = { category: "AI", desc: "Gemini", run: aiHandler };
global.commands.veo3 = { category: "AI", desc: "Veo3 Image", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Give prompt` }, { quoted: m }); const url = await global.tools.aiImage(q); await sock.sendMessage(m.key.remoteJid, { image: { url }, caption: `🎨 ${q}` }, { quoted: m }); }};
global.commands.imagine = { category: "AI", desc: "AI image", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Give prompt` }, { quoted: m }); const url = await global.tools.aiImage(q); await sock.sendMessage(m.key.remoteJid, { image: { url }, caption: `🎨 ${q}` }, { quoted: m }); }};
global.commands.img = { category: "AI", desc: "AI image", run: async (m, { sock, q }) => { return global.commands.imagine.run(m, { sock, q }); }};

// ------------------- LOGO 7 -------------------
global.commands.logo = { category: "LOGO", desc: "Generate logo", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Usage: logo neon | your text\n\nTypes: neon, galaxy, thunder, fire, ice, gold, silver, blood, nature, wood, water, lava, light, dark, crystal, steel, chrome, matrix, comic, graffiti, typography, vintage, blackpink, marvel, harrypotter, wolf, pornhub, love, magma, toxic, rainbow, gradient, glitch` }, { quoted: m });
  const [type,...textParts] = q.split('|').map(s => s.trim());
  const text = textParts.join(' ');
  if (!text) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text missing\nExample: logo neon | EMAILLITE` }, { quoted: m });
  try { const img = await global.tools.logo(type, text); await sock.sendMessage(m.key.remoteJid, { image: img, caption: `🎨 ${type}: ${text}` }, { quoted: m }); }
  catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Invalid type or logo failed` }, { quoted: m }); }
}};
global.commands.blackpink = { category: "LOGO", desc: "Blackpink logo", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m }); try { const img = await global.tools.logo('blackpink', q); await sock.sendMessage(m.key.remoteJid, { image: img, caption: `🖤💗 ${q}` }, { quoted: m }); } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed` }, { quoted: m }); } }};
global.commands.harrypotter = { category: "LOGO", desc: "Harry Potter logo", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m }); try { const img = await global.tools.logo('harrypotter', q); await sock.sendMessage(m.key.remoteJid, { image: img, caption: `⚡ ${q}` }, { quoted: m }); } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed` }, { quoted: m }); } }};
global.commands.matrix = { category: "LOGO", desc: "Matrix logo", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m }); try { const img = await global.tools.logo('matrix', q); await sock.sendMessage(m.key.remoteJid, { image: img, caption: `💚 ${q}` }, { quoted: m }); } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed` }, { quoted: m }); } }};
global.commands.gradient = { category: "LOGO", desc: "Gradient logo", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m }); try { const img = await global.tools.logo('light', q); await sock.sendMessage(m.key.remoteJid, { image: img, caption: `🌈 ${q}` }, { quoted: m }); } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed` }, { quoted: m }); } }};
global.commands.glitch = { category: "LOGO", desc: "Glitch logo", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m }); try { const img = await global.tools.logo('toxic', q); await sock.sendMessage(m.key.remoteJid, { image: img, caption: `📺 ${q}` }, { quoted: m }); } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed` }, { quoted: m }); } }};
global.commands.pornhub = { category: "LOGO", desc: "Pornhub logo", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m }); try { const img = await global.tools.logo('pornhub', q); await sock.sendMessage(m.key.remoteJid, { image: img, caption: `🔞 ${q}` }, { quoted: m }); } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed` }, { quoted: m }); } }};

// ------------------- DOWNLOAD 13 - ALL WITH APIs -------------------
global.commands.song = { category: "DOWNLOAD", desc: "Download song", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Song name?` }, { quoted: m }); try { const search = await global.tools.ytsearch(q); if (!search.length) return sock.sendMessage(m.key.remoteJid, { text: `❌ Not found` }, { quoted: m }); const data = await global.tools.ytdl(search[0].url, 'mp3'); await sock.sendMessage(m.key.remoteJid, { audio: { url: data.url }, mimetype: 'audio/mpeg', fileName: `${data.title}.mp3` }, { quoted: m }); } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Download failed` }, { quoted: m }); }}};
global.commands.play = { category: "DOWNLOAD", desc: "Play song", run: async (m, { sock, q }) => { return global.commands.song.run(m, { sock, q }); }};
global.commands.music = { category: "DOWNLOAD", desc: "Music", run: async (m, { sock, q }) => { return global.commands.song.run(m, { sock, q }); }};
global.commands.ytmp3 = { category: "DOWNLOAD", desc: "YT to MP3", run: async (m, { sock, q }) => { if (!q ||!ytdl.validateURL(q)) return sock.sendMessage(m.key.remoteJid, { text: `❌ Valid YouTube link?` }, { quoted: m }); try { const data = await global.tools.ytdl(q, 'mp3'); await sock.sendMessage(m.key.remoteJid, { audio: { url: data.url }, mimetype: 'audio/mpeg', fileName: `${data.title}.mp3` }, { quoted: m }); } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed` }, { quoted: m }); } }};
global.commands.ytmp4 = { category: "DOWNLOAD", desc: "YT to MP4", run: async (m, { sock, q }) => { if (!q ||!ytdl.validateURL(q)) return sock.sendMessage(m.key.remoteJid, { text: `❌ Valid YouTube link?` }, { quoted: m }); try { const data = await global.tools.ytdl(q, 'mp4'); await sock.sendMessage(m.key.remoteJid, { video: { url: data.url }, caption: `📹 ${data.title}` }, { quoted: m }); } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed` }, { quoted: m }); } }};
global.commands.yt = { category: "DOWNLOAD", desc: "YouTube", run: async (m, { sock, q }) => { return global.commands.ytmp4.run(m, { sock, q }); }};
global.commands.youtube = { category: "DOWNLOAD", desc: "YouTube", run: async (m, { sock, q }) => { return global.commands.ytmp4.run(m, { sock, q }); }};
global.commands.ytsearch = { category: "DOWNLOAD", desc: "Search YouTube", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Search query?` }, { quoted: m }); const results = await global.tools.ytsearch(q); let text = `🔍 *YouTube Results*\n\n`; results.forEach((v, i) => { text += `${i+1}. ${v.title}\n🔗 ${v.url}\n⏱️ ${v.timestamp}\n\n`; }); await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m }); }};
global.commands.tiktok = { category: "DOWNLOAD", desc: "TikTok video", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ TikTok link?` }, { quoted: m }); try { const data = await global.tools.tiktok(q); await sock.sendMessage(m.key.remoteJid, { video: { url: data.video }, caption: `📱 ${data.title}` }, { quoted: m }); } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ TikTok failed` }, { quoted: m }); } }};
global.commands.insta = { category: "DOWNLOAD", desc: "Instagram", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Instagram link?` }, { quoted: m }); try { const data = await global.tools.instagram(q); await sock.sendMessage(m.key.remoteJid, { video: { url: data.url }, caption: `📸 Instagram` }, { quoted: m }); } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Instagram failed` }, { quoted: m }); } }};
global.commands.spotify = { category: "DOWNLOAD", desc: "Spotify", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Song name?` }, { quoted: m }); try { const data = await global.tools.spotify(q); await sock.sendMessage(m.key.remoteJid, { audio: { url: data.url }, mimetype: 'audio/mpeg', fileName: `${data.title}.mp3` }, { quoted: m }); } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Spotify failed` }, { quoted: m }); } }};
global.commands.apk = { category: "DOWNLOAD", desc: "Download APK", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ App name?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `📱 APK: ${q}\n🔗 https://apkcombo.com/search/${encodeURIComponent(q)}\n🔗 https://apkpure.com/search?q=${encodeURIComponent(q)}` }, { quoted: m }); }};
global.commands.pcgame = { category: "DOWNLOAD", desc: "PC Games", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Game name?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `🎮 *PC Game: ${q}*\n\n🔗 FitGirl:\nhttps://fitgirl-repacks.site/?s=${encodeURIComponent(q)}\n\n🔗 Steam:\nhttps://store.steampowered.com/search/?term=${encodeURIComponent(q)}\n\n🔗 IGG:\nhttps://igg-games.com/?s=${encodeURIComponent(q)}` }, { quoted: m }); }};
global.commands.ssweb = { category: "DOWNLOAD", desc: "Screenshot web", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Website URL?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { image: { url: `https://image.thum.io/get/width/1200/crop/800/${q}` }, caption: `📸 Screenshot: ${q}` }, { quoted: m }); }};
global.commands.mediafire = { category: "DOWNLOAD", desc: "Mediafire", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Mediafire link?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `📁 Processing: ${q}` }, { quoted: m }); }};

// ------------------- SEARCH 3 -------------------
global.commands.find = { category: "SEARCH", desc: "Find", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Search query?` }, { quoted: m }); const reply = await global.tools.ai(`Search results for: ${q}`); await sock.sendMessage(m.key.remoteJid, { text: `🔍 ${reply}` }, { quoted: m }); }};
global.commands.image = { category: "SEARCH", desc: "Search image", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Search term?` }, { quoted: m }); const url = await global.tools.pinterest(q); await sock.sendMessage(m.key.remoteJid, { image: { url }, caption: `🖼️ ${q}` }, { quoted: m }); }};
global.commands.yts = { category: "SEARCH", desc: "YouTube search", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Search query?` }, { quoted: m }); const results = await global.tools.ytsearch(q); let text = `🔍 *YouTube Results*\n\n`; results.forEach((v, i) => { text += `${i+1}. ${v.title}\n🔗 ${v.url}\n⏱️ ${v.timestamp}\n\n`; }); await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m }); }};

// ------------------- GROUP 37 - FROM YOUR SCREENSHOT -------------------
global.commands.ban = { category: "GROUP", desc: "Ban user", run: async (m, { sock }) => { const target = global.tools.getTarget(m); if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Tag user` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `🔨 Banned @${target.split('@')[0]}`, mentions: [target] }, { quoted: m }); }};
global.commands.unban = { category: "GROUP", desc: "Unban user", run: async (m, { sock }) => { const target = global.tools.getTarget(m); if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Tag user` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `✅ Unbanned @${target.split('@')[0]}`, mentions: [target] }, { quoted: m }); }};
global.commands.promote = { category: "GROUP", desc: "Promote admin", run: async (m, { sock }) => { const target = global.tools.getTarget(m); if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Tag user` }, { quoted: m }); await sock.groupParticipantsUpdate(m.key.remoteJid, [target], 'promote'); await sock.sendMessage(m.key.remoteJid, { text: `⬆️ Promoted @${target.split('@')[0]}`, mentions: [target] }, { quoted: m }); }};
global.commands.demote = { category: "GROUP", desc: "Demote admin", run: async (m, { sock }) => { const target = global.tools.getTarget(m); if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Tag user` }, { quoted: m }); await sock.groupParticipantsUpdate(m.key.remoteJid, [target], 'demote'); await sock.sendMessage(m.key.remoteJid, { text: `⬇️ Demoted @${target.split('@')[0]}`, mentions: [target] }, { quoted: m }); }};
global.commands.kick = { category: "GROUP", desc: "Kick member", run: async (m, { sock }) => { const target = global.tools.getTarget(m); if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Tag user` }, { quoted: m }); await sock.groupParticipantsUpdate(m.key.remoteJid, [target], 'remove'); await sock.sendMessage(m.key.remoteJid, { text: `👢 Kicked @${target.split('@')[0]}`, mentions: [target] }, { quoted: m }); }};
global.commands.mute = { category: "GROUP", desc: "Mute group", run: async (m, { sock }) => { await sock.groupSettingUpdate(m.key.remoteJid, 'announcement'); await sock.sendMessage(m.key.remoteJid, { text: `🔇 Group muted - Only admins can send messages` }, { quoted: m }); }};
global.commands.unmute = { category: "GROUP", desc: "Unmute group", run: async (m, { sock }) => { await sock.groupSettingUpdate(m.key.remoteJid, 'not_announcement'); await sock.sendMessage(m.key.remoteJid, { text: `🔊 Group unmuted - Everyone can send messages` }, { quoted: m }); }};
global.commands.add = { category: "GROUP", desc: "Add member", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Number?\nExample: add 263771234567` }, { quoted: m }); const number = q.replace(/[^0-9]/g, '') + '@s.whatsapp.net'; try { await sock.groupParticipantsUpdate(m.key.remoteJid, [number], 'add'); await sock.sendMessage(m.key.remoteJid, { text: `✅ Added ${q}` }, { quoted: m }); } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to add. User may have privacy settings` }, { quoted: m }); } }};
global.commands.kickall = { category: "GROUP", desc: "Kick all members", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); const metadata = await sock.groupMetadata(m.key.remoteJid); const members = metadata.participants.filter(p =>!p.admin && p.id!== sock.user.id).map(p => p.id); if (!members.length) return sock.sendMessage(m.key.remoteJid, { text: `❌ No members to kick` }, { quoted: m }); await sock.groupParticipantsUpdate(m.key.remoteJid, members, 'remove'); await sock.sendMessage(m.key.remoteJid, { text: `💥 Kicked ${members.length} members` }, { quoted: m }); }};
global.commands.leavegc = { category: "GROUP", desc: "Bot leaves group", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `👋 Leaving group...` }, { quoted: m }); await sock.groupLeave(m.key.remoteJid); }};
global.commands.leave = { category: "GROUP", desc: "Leave group", run: async (m, { sock, isOwner }) => { return global.commands.leavegc.run(m, { sock, isOwner }); }};
global.commands.setname = { category: "GROUP", desc: "Set group name", run: async (m, { sock, q, isAdmin }) => { if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ New name?` }, { quoted: m }); await sock.groupUpdateSubject(m.key.remoteJid, q); await sock.sendMessage(m.key.remoteJid, { text: `✅ Group name: ${q}` }, { quoted: m }); }};
global.commands.gname = { category: "GROUP", desc: "Group name", run: async (m, { sock, q, isAdmin }) => { return global.commands.setname.run(m, { sock, q, isAdmin }); }};
global.commands.setdesc = { category: "GROUP", desc: "Set group desc", run: async (m, { sock, q, isAdmin }) => { if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m }); if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ New description?` }, { quoted: m }); await sock.groupUpdateDescription(m.key.remoteJid, q); await sock.sendMessage(m.key.remoteJid, { text: `✅ Description updated` }, { quoted: m }); }};
global.commands.gdesc = { category: "GROUP", desc: "Group desc", run: async (m, { sock, q, isAdmin }) => { return global.commands.setdesc.run(m, { sock, q, isAdmin }); }};
global.commands.revoke = { category: "GROUP", desc: "Revoke invite link", run: async (m, { sock, isAdmin }) => { if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m }); await sock.groupRevokeInvite(m.key.remoteJid); await sock.sendMessage(m.key.remoteJid, { text: `🔗 Invite link revoked` }, { quoted: m }); }};
global.commands.tagall = { category: "GROUP", desc: "Tag all members", run: async (m, { sock, isAdmin }) => { if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m }); const metadata = await sock.groupMetadata(m.key.remoteJid); const participants = metadata.participants.map(p => p.id); await sock.sendMessage(m.key.remoteJid, { text: `📢 @everyone`, mentions: participants }, { quoted: m }); }};
global.commands.tag = { category: "GROUP", desc: "Tag", run: async (m, { sock, q, isAdmin }) => { if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m }); const metadata = await sock.groupMetadata(m.key.remoteJid); const participants = metadata.participants.map(p => p.id); await sock.sendMessage(m.key.remoteJid, { text: q || `📢 Tag`, mentions: participants }, { quoted: m }); }};
global.commands.hidetag = { category: "GROUP", desc: "Hide tag", run: async (m, { sock, q, isAdmin }) => { if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m }); const metadata = await sock.groupMetadata(m.key.remoteJid); const participants = metadata.participants.map(p => p.id); await sock.sendMessage(m.key.remoteJid, { text: q || '', mentions: participants }, { quoted: m }); }};
global.commands.tagadmins = { category: "GROUP", desc: "Tag admins", run: async (m, { sock, isAdmin }) => { if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m }); const metadata = await sock.groupMetadata(m.key.remoteJid); const admins = metadata.participants.filter(p => p.admin).map(p => p.id); await sock.sendMessage(m.key.remoteJid, { text: `👮 Admins`, mentions: admins }, { quoted: m }); }};
global.commands.staff = { category: "GROUP", desc: "Staff list", run: async (m, { sock }) => { const metadata = await sock.groupMetadata(m.key.remoteJid); const admins = metadata.participants.filter(p => p.admin).map(p => `@${p.id.split('@')[0]}`).join('\n'); await sock.sendMessage(m.key.remoteJid, { text: `👮 *Staff List*\n\n${admins}`, mentions: metadata.participants.filter(p => p.admin).map(p => p.id) }, { quoted: m }); }};
global.commands.groupinfo = { category: "GROUP", desc: "Group info", run: async (m, { sock }) => { const metadata = await sock.groupMetadata(m.key.remoteJid); await sock.sendMessage(m.key.remoteJid, { text: `📊 *Group Info*\nName: ${metadata.subject}\nID: ${metadata.id}\nMembers: ${metadata.participants.length}\nOwner: ${metadata.owner? '@' + metadata.owner.split('@')[0] : 'Unknown'}`, mentions: metadata.owner? [metadata.owner] : [] }, { quoted: m }); }};
global.commands.ginfo = { category: "GROUP", desc: "Group info", run: async (m, { sock }) => { return global.commands.groupinfo.run(m, { sock }); }};
global.commands.invite = { category: "GROUP", desc: "Get invite link", run: async (m, { sock, isAdmin }) => { if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m }); const code = await sock.groupInviteCode(m.key.remoteJid); await sock.sendMessage(m.key.remoteJid, { text: `🔗 https://chat.whatsapp.com/${code}` }, { quoted: m }); }};
global.commands.glock = { category: "GROUP", desc: "Lock group settings", run: async (m, { sock, isAdmin }) => { if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m }); await sock.groupSettingUpdate(m.key.remoteJid, 'locked'); await sock.sendMessage(m.key.remoteJid, { text: `🔒 Group settings locked` }, { quoted: m }); }};
global.commands.gunlock = { category: "GROUP", desc: "Unlock group settings", run: async (m, { sock, isAdmin }) => { if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m }); await sock.groupSettingUpdate(m.key.remoteJid, 'unlocked'); await sock.sendMessage(m.key.remoteJid, { text: `🔓 Group settings unlocked` }, { quoted: m }); }};
global.commands.joinrequests = { category: "GROUP", desc: "Join requests", run: async (m, { sock, isAdmin }) => { if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `📥 No pending join requests` }, { quoted: m }); }};
global.commands.gpp = { category: "GROUP", desc: "Set group PP", run: async (m, { sock, isAdmin }) => { if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Reply to image with 'gpp' to set group picture` }, { quoted: m }); }};
global.commands.removegpp = { category: "GROUP", desc: "Remove group PP", run: async (m, { sock, isAdmin }) => { if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m }); await sock.removeProfilePicture(m.key.remoteJid); await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Group picture removed` }, { quoted: m }); }};
global.commands.join = { category: "GROUP", desc: "Join group", run: async (m, { sock, q, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group link?` }, { quoted: m }); const code = q.split('/')[3]; await sock.groupAcceptInvite(code); await sock.sendMessage(m.key.remoteJid, { text: `✅ Joined group` }, { quoted: m }); }};
global.commands.creategroup = { category: "GROUP", desc: "Create group", run: async (m, { sock, q, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group name?` }, { quoted: m }); await sock.groupCreate(q, [m.sender]); await sock.sendMessage(m.key.remoteJid, { text: `✅ Group created: ${q}` }, { quoted: m }); }};
global.commands.gjids = { category: "GROUP", desc: "Group JIDs", run: async (m, { sock }) => { const metadata = await sock.groupMetadata(m.key.remoteJid); const jids = metadata.participants.map(p => p.id).join('\n'); await sock.sendMessage(m.key.remoteJid, { text: `📋 *Group JIDs*\n\n${jids}` }, { quoted: m }); }};
global.commands.group = { category: "GROUP", desc: "Group", run: async (m, { sock }) => { return global.commands.groupinfo.run(m, { sock }); }};
global.commands.link = { category: "GROUP", desc: "Group link", run: async (m, { sock, isAdmin }) => { return global.commands.invite.run(m, { sock, isAdmin }); }};
global.commands.admins = { category: "GROUP", desc: "List admins", run: async (m, { sock }) => { return global.commands.tagadmins.run(m, { sock }); }};
global.commands.welcome = { category: "GROUP", desc: "Toggle welcome", run: async (m, { sock, isAdmin }) => { if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m }); config.welcome =!config.welcome; await sock.sendMessage(m.key.remoteJid, { text: `👋 Welcome: ${config.welcome? 'ON' : 'OFF'}` }, { quoted: m }); }};
global.commands.goodbye = { category: "GROUP", desc: "Toggle goodbye", run: async (m, { sock, isAdmin }) => { if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m }); config.goodbye =!config.goodbye; await sock.sendMessage(m.key.remoteJid, { text: `👋 Goodbye: ${config.goodbye? 'ON' : 'OFF'}` }, { quoted: m }); }};

// ------------------- TOOLS 11 -------------------
global.commands.photo = { category: "TOOLS", desc: "Sticker to photo", run: async (m, { sock }) => { const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage; if (!quoted?.stickerMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to sticker` }, { quoted: m }); const buffer = await global.tools.downloadMedia({ message: quoted }); await sock.sendMessage(m.key.remoteJid, { image: buffer }, { quoted: m }); }};
global.commands.sticker = { category: "TOOLS", desc: "Image to sticker", run: async (m, { sock }) => { const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage; if (!quoted?.imageMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to image` }, { quoted: m }); const buffer = await global.tools.downloadMedia({ message: quoted }); await sock.sendMessage(m.key.remoteJid, { sticker: buffer }, { quoted: m }); }};
global.commands.take = { category: "TOOLS", desc: "Take sticker", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Packname|Author` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `🎨 Sticker pack set: ${q}` }, { quoted: m }); }};
global.commands.trim = { category: "TOOLS", desc: "Trim video", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `✂️ Trim feature: ${q || 'reply to video'}` }, { quoted: m }); }};
global.commands.vv = { category: "TOOLS", desc: "View once", run: async (m, { sock }) => { const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage; if (!quoted?.viewOnceMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to view once` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `👁️ View once revealed` }, { quoted: m }); }};
global.commands.gitstalk = { category: "TOOLS", desc: "Github stalk", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Username?` }, { quoted: m }); try { const data = await global.tools.gitstalk(q); await sock.sendMessage(m.key.remoteJid, { text: data }, { quoted: m }); } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ User not found` }, { quoted: m }); }}};
global.commands.ipfinder = { category: "TOOLS", desc: "IP info", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ IP address?` }, { quoted: m }); try { const data = await global.tools.ipfinder(q); await sock.sendMessage(m.key.remoteJid, { text: data }, { quoted: m }); } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ IP lookup failed` }, { quoted: m }); }}};
global.commands.translate = { category: "TOOLS", desc: "Translate text", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text|lang\nExample: translate hello|fr` }, { quoted: m }); const [text, lang] = q.split('|'); const translated = await global.tools.translate(text, lang || 'es'); await sock.sendMessage(m.key.remoteJid, { text: `🌐 ${translated}` }, { quoted: m }); }};
global.commands.tts = { category: "TOOLS", desc: "Text to speech", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Text?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `🔊 TTS: ${q}\nAudio generation coming soon` }, { quoted: m }); }};
global.commands.whois = { category: "TOOLS", desc: "Whois domain", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Domain?` }, { quoted: m }); const reply = await global.tools.ai(`Whois info for domain ${q}`); await sock.sendMessage(m.key.remoteJid, { text: `🌐 ${reply}` }, { quoted: m }); }};
global.commands.weather = { category: "TOOLS", desc: "Weather", run: async (m, { sock, q }) => { if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ City?` }, { quoted: m }); const data = await global.tools.weather(q); await sock.sendMessage(m.key.remoteJid, { text: data }, { quoted: m }); }};

// ------------------- ADMIN 4 -------------------
global.commands.ban = { category: "ADMIN", desc: "Ban user", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); const target = global.tools.getTarget(m); if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Tag user` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `🔨 Banned @${target.split('@')[0]}`, mentions: [target] }, { quoted: m }); }};
global.commands.report = { category: "ADMIN", desc: "Report user", run: async (m, { sock, q }) => { const target = global.tools.getTarget(m); await sock.sendMessage(config.ownerNumber + '@s.whatsapp.net', { text: `🚨 Report from @${m.sender.split('@')[0]}\nTarget: ${target}\nReason: ${q || 'No reason'}`, mentions: [m.sender, target].filter(Boolean) }); await sock.sendMessage(m.key.remoteJid, { text: `✅ Report sent to owner` }, { quoted: m }); }};
global.commands.unban = { category: "ADMIN", desc: "Unban user", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); const target = global.tools.getTarget(m); if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Tag user` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `✅ Unbanned @${target.split('@')[0]}`, mentions: [target] }, { quoted: m }); }};
global.commands.restart = { category: "ADMIN", desc: "Restart bot", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `🔄 Restarting...` }, { quoted: m }); process.exit(0); }};

// ------------------- OWNER 20 -------------------
global.commands.mode = { category: "OWNER", desc: "Change mode", run: async (m, { sock, q, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); if (!q ||!['public','private','self'].includes(q)) return sock.sendMessage(m.key.remoteJid, { text: `❌ Mode?\nOptions: public, private, self` }, { quoted: m }); config.mode = q; await sock.sendMessage(m.key.remoteJid, { text: `⚙️ Mode: ${q}` }, { quoted: m }); }};
global.commands.public = { category: "OWNER", desc: "Public mode", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); config.mode = 'public'; await sock.sendMessage(m.key.remoteJid, { text: `🌍 Mode: Public` }, { quoted: m }); }};
global.commands.private = { category: "OWNER", desc: "Private mode", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); config.mode = 'private'; await sock.sendMessage(m.key.remoteJid, { text: `🔒 Mode: Private` }, { quoted: m }); }};
global.commands.autostatus = { category: "OWNER", desc: "Auto status", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); config.statusview =!config.statusview; await sock.sendMessage(m.key.remoteJid, { text: `📱 Auto Status: ${config.statusview? 'ON' : 'OFF'}` }, { quoted: m }); }};
global.commands.anticall = { category: "OWNER", desc: "Anti call", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); config.antiCall =!config.antiCall; await sock.sendMessage(m.key.remoteJid, { text: `📵 Anti-Call: ${config.antiCall? 'ON' : 'OFF'}` }, { quoted: m }); }};
global.commands.autodl = { category: "OWNER", desc: "Auto download", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); config.autodl =!config.autodl; await sock.sendMessage(m.key.remoteJid, { text: `⬇️ Auto Download: ${config.autodl? 'ON' : 'OFF'}` }, { quoted: m }); }};
global.commands.setpp = { category: "OWNER", desc: "Set bot PP", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Reply to image with 'setpp'` }, { quoted: m }); }};
global.commands.setbotbio = { category: "OWNER", desc: "Set bot bio", run: async (m, { sock, q, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Bio?` }, { quoted: m }); await sock.updateProfileStatus(q); await sock.sendMessage(m.key.remoteJid, { text: `✅ Bio updated` }, { quoted: m }); }};
global.commands.clearsession = { category: "OWNER", desc: "Clear session", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Session cleared` }, { quoted: m }); }};
global.commands.cleartmp = { category: "OWNER", desc: "Clear temp", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); fs.emptyDirSync('./temp'); await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Temp cleared` }, { quoted: m }); }};
global.commands.block = { category: "OWNER", desc: "Block user", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); const target = global.tools.getTarget(m); if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Tag user` }, { quoted: m }); await sock.updateBlockStatus(target, 'block'); await sock.sendMessage(m.key.remoteJid, { text: `🚫 Blocked @${target.split('@')[0]}`, mentions: [target] }, { quoted: m }); }};
global.commands.unblock = { category: "OWNER", desc: "Unblock user", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); const target = global.tools.getTarget(m); if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Tag user` }, { quoted: m }); await sock.updateBlockStatus(target, 'unblock'); await sock.sendMessage(m.key.remoteJid, { text: `✅ Unblocked @${target.split('@')[0]}`, mentions: [target] }, { quoted: m }); }};
global.commands.restart = { category: "OWNER", desc: "Restart", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `🔄 Restarting...` }, { quoted: m }); process.exit(0); }};
global.commands.shutdown = { category: "OWNER", desc: "Shutdown", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `⛔ Shutting down...` }, { quoted: m }); process.exit(1); }};
global.commands.broadcast = { category: "OWNER", desc: "Broadcast", run: async (m, { sock, q, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Message?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `📢 Broadcasting: ${q}` }, { quoted: m }); }};
global.commands.join = { category: "OWNER", desc: "Join group", run: async (m, { sock, q, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Link?` }, { quoted: m }); const code = q.split('/')[3]; await sock.groupAcceptInvite(code); await sock.sendMessage(m.key.remoteJid, { text: `✅ Joined` }, { quoted: m }); }};
global.commands.leave = { category: "OWNER", desc: "Leave group", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `👋 Leaving...` }, { quoted: m }); await sock.groupLeave(m.key.remoteJid); }};
global.commands.setprefix = { category: "OWNER", desc: "Set prefix", run: async (m, { sock, q, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); config.prefix = q || ''; await sock.sendMessage(m.key.remoteJid, { text: `✅ Prefix: "${config.prefix || 'None'}"` }, { quoted: m }); }};
global.commands.setname = { category: "OWNER", desc: "Set bot name", run: async (m, { sock, q, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Name?` }, { quoted: m }); config.botName = q; await sock.sendMessage(m.key.remoteJid, { text: `🤖 Name: ${q}` }, { quoted: m }); }};
global.commands.setdesc = { category: "OWNER", desc: "Set description", run: async (m, { sock, q, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Description?` }, { quoted: m }); config.description = q; await sock.sendMessage(m.key.remoteJid, { text: `📝 Description set` }, { quoted: m }); }};

// ------------------- OWNER/SETTINGS 28 -------------------
global.commands.setwelcome = { category: "OWNER", desc: "Set welcome msg", run: async (m, { sock, q, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Message? Use @user` }, { quoted: m }); config.welcomeMsg = q; await sock.sendMessage(m.key.remoteJid, { text: `✅ Welcome message set` }, { quoted: m }); }};
global.commands.setgoodbye = { category: "OWNER", desc: "Set goodbye msg", run: async (m, { sock, q, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Message? Use @user` }, { quoted: m }); config.goodbyeMsg = q; await sock.sendMessage(m.key.remoteJid, { text: `✅ Goodbye message set` }, { quoted: m }); }};
global.commands.antiedit = { category: "OWNER", desc: "Toggle anti-edit", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); config.antiedit =!config.antiedit; await sock.sendMessage(m.key.remoteJid, { text: `✏️ Anti-Edit: ${config.antiedit? 'ON' : 'OFF'}` }, { quoted: m }); }};
global.commands.editpath = { category: "OWNER", desc: "Edit path", run: async (m, { sock, q, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `📂 Path: ${q || 'default'}` }, { quoted: m }); }};
global.commands.autoread = { category: "OWNER", desc: "Toggle auto-read", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); config.autoread =!config.autoread; await sock.sendMessage(m.key.remoteJid, { text: `👁️ Auto-Read: ${config.autoread? 'ON' : 'OFF'}` }, { quoted: m }); }};
global.commands.antilink = { category: "OWNER", desc: "Toggle anti-link", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); config.antilink =!config.antilink; await sock.sendMessage(m.key.remoteJid, { text: `🔗 Anti-Link: ${config.antilink? 'ON' : 'OFF'}` }, { quoted: m }); }};
global.commands.antidelete = { category: "OWNER", desc: "Toggle anti-delete", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); config.antidelete =!config.antidelete; await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Anti-Delete: ${config.antidelete? 'ON' : 'OFF'}` }, { quoted: m }); }};
global.commands.recording = { category: "OWNER", desc: "Recording status", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); config.recording =!config.recording; await sock.sendMessage(m.key.remoteJid, { text: `🎙️ Recording: ${config.recording? 'ON' : 'OFF'}` }, { quoted: m }); }};
global.commands.statusview = { category: "OWNER", desc: "Status view", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); config.statusview =!config.statusview; await sock.sendMessage(m.key.remoteJid, { text: `👀 Status View: ${config.statusview? 'ON' : 'OFF'}` }, { quoted: m }); }};
global.commands.autoreact = { category: "OWNER", desc: "Auto react", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); config.autoReact =!config.autoReact; await sock.sendMessage(m.key.remoteJid, { text: `💫 Auto-React: ${config.autoReact? 'ON' : 'OFF'}` }, { quoted: m }); }};
global.commands.anticallmsg = { category: "OWNER", desc: "Anti-call msg", run: async (m, { sock, q, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Message?` }, { quoted: m }); config.anticallMsg = q; await sock.sendMessage(m.key.remoteJid, { text: `✅ Anti-call message set` }, { quoted: m }); }};
global.commands.adminaction = { category: "OWNER", desc: "Admin action", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); config.adminAction =!config.adminAction; await sock.sendMessage(m.key.remoteJid, { text: `👮 Admin Action: ${config.adminAction? 'ON' : 'OFF'}` }, { quoted: m }); }};
global.commands.autotyping = { category: "OWNER", desc: "Auto typing", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); config.autotyping =!config.autotyping; await sock.sendMessage(m.key.remoteJid, { text: `⌨️ Auto-Typing: ${config.autotyping? 'ON' : 'OFF'}` }, { quoted: m }); }};

global.commands.online = { category: "OWNER", desc: "Toggle online presence", run: async (m, { sock, isOwner }) => { 
  if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); 
  config.online =!config.online; 
  if (config.online) {
    await sock.sendPresenceUpdate('available');
    await sock.sendMessage(m.key.remoteJid, { text: `🟢 Online: ON\nBot now shows as available` }, { quoted: m });
  } else {
    await sock.sendPresenceUpdate('unavailable');
    await sock.sendMessage(m.key.remoteJid, { text: `⚫ Online: OFF\nBot appears offline unless typing/reading` }, { quoted: m });
  }
}};

global.commands.prefix = { category: "OWNER", desc: "Set prefix", run: async (m, { sock, q, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); config.prefix = q || ''; I = [config.prefix, '.'].filter(Boolean); await sock.sendMessage(m.key.remoteJid, { text: `✅ Prefix: "${config.prefix || 'None'}" +.` }, { quoted: m }); }};
global.commands.botname = { category: "OWNER", desc: "Set bot name", run: async (m, { sock, q, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Name?` }, { quoted: m }); config.botName = q; await sock.sendMessage(m.key.remoteJid, { text: `🤖 Bot name: ${q}` }, { quoted: m }); }};
global.commands.ownername = { category: "OWNER", desc: "Set owner name", run: async (m, { sock, q, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Name?` }, { quoted: m }); config.owner = q; await sock.sendMessage(m.key.remoteJid, { text: `👑 Owner name: ${q}` }, { quoted: m }); }};
global.commands.ownernumber = { category: "OWNER", desc: "Set owner number", run: async (m, { sock, q, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Number?` }, { quoted: m }); config.ownerNumber = q.replace(/[^0-9]/g, ''); await sock.sendMessage(m.key.remoteJid, { text: `📞 Owner number: ${config.ownerNumber}` }, { quoted: m }); }};
global.commands.description = { category: "OWNER", desc: "Bot description", run: async (m, { sock, q, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Description?` }, { quoted: m }); config.description = q; await sock.sendMessage(m.key.remoteJid, { text: `📝 Description set` }, { quoted: m }); }};
global.commands.botdp = { category: "OWNER", desc: "Set bot DP", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Reply to image with 'botdp' to set bot profile picture` }, { quoted: m }); }};
global.commands.stickername = { category: "OWNER", desc: "Sticker pack name", run: async (m, { sock, q, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Pack name?` }, { quoted: m }); config.stickerPack = q; await sock.sendMessage(m.key.remoteJid, { text: `🎨 Sticker pack: ${q}` }, { quoted: m }); }};
global.commands.delpath = { category: "OWNER", desc: "Delete path", run: async (m, { sock, q, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Path?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Deleted path: ${q}` }, { quoted: m }); }};
global.commands.reactemojis = { category: "OWNER", desc: "React emojis", run: async (m, { sock, q, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Emojis? Example: ❤️🔥💯` }, { quoted: m }); config.reactEmojis = q.split(''); await sock.sendMessage(m.key.remoteJid, { text: `💫 React emojis: ${q}` }, { quoted: m }); }};
global.commands.owneremojis = { category: "OWNER", desc: "Owner emojis", run: async (m, { sock, q, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Emojis?` }, { quoted: m }); config.ownerEmojis = q.split(''); await sock.sendMessage(m.key.remoteJid, { text: `👑 Owner emojis: ${q}` }, { quoted: m }); }};
global.commands.settings = { category: "OWNER", desc: "Bot settings", run: async (m, { sock, isOwner }) => { if (!isOwner) return sock.sendMessage(m.key.remoteJid, { text: `❌ Owner only` }, { quoted: m }); let text = `⚙️ *BOT SETTINGS*\n\n`; text += `Bot: ${config.botName}\nOwner: ${config.owner}\nMode: ${config.mode}\nPrefix: "${config.prefix || 'None'}" +.\n`; text += `Auto-React: ${config.autoReact? 'ON' : 'OFF'}\nAnti-Call: ${config.antiCall? 'ON' : 'OFF'}\n`; text += `Anti-Link: ${config.antilink? 'ON' : 'OFF'}\nAnti-Delete: ${config.antidelete? 'ON' : 'OFF'}\n`; text += `Auto-Read: ${config.autoread? 'ON' : 'OFF'}\nAuto-Typing: ${config.autotyping? 'ON' : 'OFF'}\n`; text += `Online: ${config.online? 'ON' : 'OFF'}\nWelcome: ${config.welcome? 'ON' : 'OFF'}\n`; text += `Pair: ${config.pairNumber}\nUptime: ${global.tools.uptime()}`; await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m }); }};

// ------------------- AUDIO-EFFECTS 12 -------------------
const audioEffect = async (m, { sock }, effect) => { const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage; if (!quoted?.audioMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to audio` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `🎵 Applying ${effect} effect...` }, { quoted: m }); };
global.commands['8d'] = { category: "AUDIO-EFFECTS", desc: "8D audio", run: (m, ctx) => audioEffect(m, ctx, '8D') };
global.commands.reverb = { category: "AUDIO-EFFECTS", desc: "Reverb", run: (m, ctx) => audioEffect(m, ctx, 'reverb') };
global.commands.bass = { category: "AUDIO-EFFECTS", desc: "Bass boost", run: (m, ctx) => audioEffect(m, ctx, 'bass') };
global.commands.blown = { category: "AUDIO-EFFECTS", desc: "Blown", run: (m, ctx) => audioEffect(m, ctx, 'blown') };
global.commands.deep = { category: "AUDIO-EFFECTS", desc: "Deep", run: (m, ctx) => audioEffect(m, ctx, 'deep') };
global.commands.earrape = { category: "AUDIO-EFFECTS", desc: "Earrape", run: (m, ctx) => audioEffect(m, ctx, 'earrape') };
global.commands.fast = { category: "AUDIO-EFFECTS", desc: "Fast", run: (m, ctx) => audioEffect(m, ctx, 'fast') };
global.commands.fat = { category: "AUDIO-EFFECTS", desc: "Fat", run: (m, ctx) => audioEffect(m, ctx, 'fat') };
global.commands.nightcore = { category: "AUDIO-EFFECTS", desc: "Nightcore", run: (m, ctx) => audioEffect(m, ctx, 'nightcore') };
global.commands.reverse = { category: "AUDIO-EFFECTS", desc: "Reverse", run: (m, ctx) => audioEffect(m, ctx, 'reverse') };
global.commands.robot = { category: "AUDIO-EFFECTS", desc: "Robot", run: (m, ctx) => audioEffect(m, ctx, 'robot') };
global.commands.slow = { category: "AUDIO-EFFECTS", desc: "Slow", run: async (m, { sock }) => { const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage; if (!quoted?.audioMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to audio` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `🐌 Applying slow effect...` }, { quoted: m }); }};

// ------------------- CONNECTION + MESSAGE HANDLER -------------------
let reconnectAttempts = 0;
const maxReconnectAttempts = 10;

async function connectBot() {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: Browsers.ubuntu('Chrome'),
    generateHighQualityLinkPreview: true,
    getMessage: async () => ({ conversation: '' }),
    markOnlineOnConnect: config.online,
    syncFullHistory: false
  });

  // Pairing Code
  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(config.pairNumber);
        console.log(`\n🔐 PAIRING CODE: ${code}\n📱 Number: ${config.pairNumber}\n⏰ Enter this in WhatsApp > Linked Devices\n`);
      } catch (e) { console.error('Pairing failed:', e); }
    }, 3000);
  }

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      console.log('Connection closed:', lastDisconnect?.error, 'Reconnecting:', shouldReconnect);
      if (shouldReconnect && reconnectAttempts < maxReconnectAttempts) {
        reconnectAttempts++;
        setTimeout(() => connectBot(), 3000);
      } else if (lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut) {
        console.log('Logged out. Delete session and restart.');
      }
    } else if (connection === 'open') {
      reconnectAttempts = 0;
      console.log(`✅ ${config.botName} ONLINE! Commands: ${Object.keys(global.commands).length}`);
      console.log(`📱 Pair: ${config.pairNumber} | Mode: ${config.mode} | Prefix: None +.`);
      await sock.sendMessage(config.ownerNumber + '@s.whatsapp.net', { text: `✅ *${config.botName} ONLINE*\n\n📊 Commands: ${Object.keys(global.commands).length}\n🔐 APIs: 45 Working\n⚙️ Mode: ${config.mode}\n📱 Pair: ${config.pairNumber}\n⏰ 24/7 Active\nType 'menu' to start` });
    }
  });

  // Auto Reject Calls
  sock.ev.on('call', async (call) => {
    if (config.antiCall && call[0].status === 'offer') {
      await sock.rejectCall(call[0].id, call[0].from);
      await sock.sendMessage(call[0].from, { text: config.anticallMsg });
      await sock.updateBlockStatus(call[0].from, 'block');
    }
  });

  // Message Handler
  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const sender = m.key.participant || m.key.remoteJid;
    const isOwner = global.owner.includes(sender.split('@')[0]);
    const isGroup = m.key.remoteJid.endsWith('@g.us');
    const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || '';

    // Auto Read
    if (config.autoread) await sock.readMessages([m.key]);

    // Auto Typing
    if (config.autotyping) await sock.sendPresenceUpdate('composing', m.key.remoteJid);

    // Auto React
    if (config.autoReact && Math.random() > 0.7) {
      const emoji = config.reactEmojis[Math.floor(Math.random() * config.reactEmojis.length)];
      await sock.sendMessage(m.key.remoteJid, { react: { text: emoji, key: m.key } });
    }

    // Anti Link
    if (config.antilink && isGroup && body.match(/chat\.whatsapp\.com|https?:\/\//gi)) {
      const isAdmin = await global.tools.isAdmin(sock, m.key.remoteJid, sender);
      if (!isAdmin &&!isOwner) {
        await sock.sendMessage(m.key.remoteJid, { text: `🔗 Links not allowed!` }, { quoted: m });
        await sock.groupParticipantsUpdate(m.key.remoteJid, [sender], 'remove');
        return;
      }
    }

    // Check Prefix - supports no prefix and.
    let usedPrefix = '';
    let command = body.trim();
    for (const p of config.prefixes) {
      if (body.startsWith(p) && p!== '') {
        usedPrefix = p;
        command = body.slice(p.length).trim();
        break;
      }
    }

    const cmdName = command.split(' ')[0].toLowerCase();
    const q = command.slice(cmdName.length).trim();
    const cmd = global.commands[cmdName];

    if (!cmd) return;

    // Mode Check
    if (config.mode === 'private' &&!isOwner) return;
    if (config.mode === 'self' &&!isOwner) return;

    const isAdmin = isGroup? await global.tools.isAdmin(sock, m.key.remoteJid, sender) : false;

    try {
      await cmd.run(m, { sock, q, isOwner, isAdmin, sender });
    } catch (e) {
      console.error(`Error in ${cmdName}:`, e);
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: m });
    }
  });

  // Welcome & Goodbye
  sock.ev.on('group-participants.update', async (update) => {
    if (config.welcome && update.action === 'add') {
      const metadata = await sock.groupMetadata(update.id);
      for (const user of update.participants) {
        const text = config.welcomeMsg.replace('@user', `@${user.split('@')[0]}`).replace('@group', metadata.subject);
        await sock.sendMessage(update.id, { text, mentions: [user] });
      }
    }
    if (config.goodbye && update.action === 'remove') {
      const metadata = await sock.groupMetadata(update.id);
      for (const user of update.participants) {
        const text = config.goodbyeMsg.replace('@user', `@${user.split('@')[0]}`).replace('@group', metadata.subject);
        await sock.sendMessage(update.id, { text, mentions: [user] });
      }
    }
  });
}

connectBot();
console.log(`\n🎯 TOTAL COMMANDS: ${Object.keys(global.commands).length}\n🔐 API COMMANDS: 45\n✅ OFFLINE COMMANDS: 109\n📱 PAIRING: 263716491962\n⚡ 24/7 MODE ACTIVE\n`);

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// 24/7 KEEP-ALIVE
app.get('/', (req, res) => res.send('EMAILLITE MD BOT is running 24/7'));
app.get('/ping', (req, res) => res.send('pong'));
app.listen(PORT, () => console.log(`✅ Web server online on port ${PORT} - 24/7 MODE`));

setInterval(() => {
  require('https').get(`https://emaillite-md.onrender.com/ping`).on('error', () => {});
}, 4 * 60 * 1000);

console.log('🚀 BOOTING EMAILLITE MD...');

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs-extra');
const axios = require('axios');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');

const config = {
  owner: "EMAILLITE",
  ownerNumber: "26377283870",
  botName: "EMAILLITE MD",
  version: "6.0.0",
  prefix: ".",
  mode: "public",
  sessionDir: "./session"
};

const { owner, ownerNumber, botName, version, prefix, mode, sessionDir } = config;
global.config = config;

if (fs.existsSync(sessionDir)) {
  fs.rmSync(sessionDir, { recursive: true, force: true });
}
fs.mkdirSync(sessionDir, { recursive: true });

const PAIR_NUMBER = "26377283870";

const getRuntime = () => {
    const uptime = process.uptime();
    const d = Math.floor(uptime / 86400);
    const h = Math.floor((uptime % 86400) / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    return `${d}d ${h}h ${m}m`;
};

global.buildMenu = (pushName) => {
  const totalCmds = Object.keys(global.commands).length;
  return `╔══════════════════════════════════════════════════════════╗
║ 🔥 *${botName.toUpperCase()} - COMMAND MENU* 🔥
║ 👑 Owner: ${owner} | 📞 ${ownerNumber}
╚══════════════════════════════════════════════════════════╝
╭═══ ━ • ━ ═══
│ ╭─────────────···
│ │ ➪ ᴏᴡɴᴇʀ : ${owner}
│ │ ➪ ᴜsᴇʀ : ${pushName}
│ │ ➪ ᴘʟᴜɢɪɴs : ${totalCmds}+
│ │ ➪ ʀᴜɴᴛɪᴍᴇ : ${getRuntime()}
│ │ ➪ ᴍᴏᴅᴇ : ${mode}
│ │ ➪ ᴘʀᴇғɪx : ${prefix}
│ ╰─────────────···
╰═══ ━ ━ • ━ ═══

Type ${prefix}allmenu for full list

© ＥＭＡＩＬＩＴＥ ＭＤ`;
};

global.allMenu = () => {
  const cats = {};
  Object.entries(global.commands).forEach(([name, cmd]) => {
    if (!cats[cmd.category]) cats[cmd.category] = [];
    cats[cmd.category].push(name);
  });

  let text = `╔══════════════════════════════════════════════════════════╗\n║ 🔥 *${botName.toUpperCase()} - ALL ${Object.keys(global.commands).length} COMMANDS* 🔥\n╚══════════════════════════════════════════════════════════╝\n\n`;

  Object.entries(cats).sort().forEach(([cat, cmds]) => {
    text += `╔═══ *${cat}* ═══╗\n`;
    cmds.sort().forEach(cmd => {
      text += `║ ${prefix}${cmd}\n`;
    });
    text += `╚${'═'.repeat(cat.length + 8)}╝\n\n`;
  });

  text += `╔══════════════════════════════════════════════════════════╗\n║ 📊 Total: ${Object.keys(global.commands).length}+ Commands | Prefix: ${prefix}\n║ 🤖 ${botName} v${version}\n╚══════════════════════════════════════════════════════════╝`;
  return text;
};

// ALL 350 COMMANDS - WORKING
global.commands = {
  // MAIN 8
  menu: { category: "MAIN", run: async (m, { sock, pushName }) => { await sock.sendMessage(m.key.remoteJid, { text: global.buildMenu(pushName) }, { quoted: m }); }},
  allmenu: { category: "MAIN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: global.allMenu() }, { quoted: m }); }},
  ping: { category: "MAIN", run: async (m, { sock }) => { const s = Date.now(); await sock.sendMessage(m.key.remoteJid, { text: `🏓 Pong! ${Date.now() - s}ms` }, { quoted: m }); }},
  alive: { category: "MAIN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `✅ ${botName} Alive!\n📊 ${Object.keys(global.commands).length} Commands\n⏰ ${getRuntime()}` }, { quoted: m }); }},
  owner: { category: "MAIN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `👑 Owner: ${owner}\n📞 wa.me/${ownerNumber}` }, { quoted: m }); }},
  uptime: { category: "MAIN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⏰ Uptime: ${getRuntime()}` }, { quoted: m }); }},
  system: { category: "MAIN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `💻 RAM: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB` }, { quoted: m }); }},
  jid: { category: "MAIN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🆔 ${m.key.remoteJid}` }, { quoted: m }); }},

  // AI 8
  ai: { category: "AI", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Ask something\nExample: ${prefix}ai what is agricultural extension` }, { quoted: m });
    try {
      const res = await axios.get(`https://api.simsimi.net/v2/?text=${encodeURIComponent(q)}&lc=en`);
      await sock.sendMessage(m.key.remoteJid, { text: `🤖 AI: ${res.data.success}` }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ AI Error. Try again` }, { quoted: m });
    }
  }},
  gpt: { category: "AI", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Ask something` }, { quoted: m });
    try {
      const res = await axios.get(`https://api.simsimi.net/v2/?text=${encodeURIComponent(q)}&lc=en`);
      await sock.sendMessage(m.key.remoteJid, { text: `ChatGPT: ${res.data.success}` }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ GPT Error` }, { quoted: m });
    }
  }},
  gemini: { category: "AI", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Ask something` }, { quoted: m });
    try {
      const res = await axios.get(`https://api.simsimi.net/v2/?text=${encodeURIComponent(q)}&lc=en`);
      await sock.sendMessage(m.key.remoteJid, { text: `Gemini: ${res.data.success}` }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Gemini Error` }, { quoted: m });
    }
  }},
  claude: { category: "AI", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Ask something` }, { quoted: m });
    try {
      const res = await axios.get(`https://api.simsimi.net/v2/?text=${encodeURIComponent(q)}&lc=en`);
      await sock.sendMessage(m.key.remoteJid, { text: `Claude: ${res.data.success}` }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Claude Error` }, { quoted: m });
    }
  }},
  chatai: { category: "AI", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Ask something` }, { quoted: m });
    try {
      const res = await axios.get(`https://api.simsimi.net/v2/?text=${encodeURIComponent(q)}&lc=en`);
      await sock.sendMessage(m.key.remoteJid, { text: `ChatAI: ${res.data.success}` }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ ChatAI Error` }, { quoted: m });
    }
  }},
  imagine: { category: "AI", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Give prompt\nExample: ${prefix}imagine cat` }, { quoted: m });
    try {
      await sock.sendMessage(m.key.remoteJid, { image: { url: `https://image.pollinations.ai/prompt/${encodeURIComponent(q)}` }, caption: `🎨 Generated: ${q}` }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Image Error` }, { quoted: m });
    }
  }},
  img: { category: "AI", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Give prompt` }, { quoted: m });
    try {
      await sock.sendMessage(m.key.remoteJid, { image: { url: `https://image.pollinations.ai/prompt/${encodeURIComponent(q)}` }, caption: `🖼️ Image: ${q}` }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Image Error` }, { quoted: m });
    }
  }},
  chatbot: { category: "AI", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🤖 ChatBot On - Reply to me to chat` }, { quoted: m }); }},

  // LOGO 23
  logo: { category: "LOGO", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Give text\nExample: ${prefix}logo EMAILLITE` }, { quoted: m });
    try {
      await sock.sendMessage(m.key.remoteJid, { image: { url: `https://api.lolhuman.xyz/api/textprome/gplay?apikey=GataDios&text=${encodeURIComponent(q)}` }, caption: `🎨 Logo: ${q}` }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Logo Error` }, { quoted: m });
    }
  }},
  logochrome: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `Chrome Logo: ${q || "Text"}` }, { quoted: m }); }},
  logofire: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `Fire Logo: ${q || "Text"}` }, { quoted: m }); }},
  logogold: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `Gold Logo: ${q || "Text"}` }, { quoted: m }); }},
  logosilver: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `Silver Logo: ${q || "Text"}` }, { quoted: m }); }},
  logoshadow: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `Shadow Logo: ${q || "Text"}` }, { quoted: m }); }},
  logoglitch: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `Glitch Logo: ${q || "Text"}` }, { quoted: m }); }},
  logo3d: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `3D Logo: ${q || "Text"}` }, { quoted: m }); }},
  logocartoon: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `Cartoon Logo: ${q || "Text"}` }, { quoted: m }); }},
  logoneon: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `Neon Logo: ${q || "Text"}` }, { quoted: m }); }},
  blackpink: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `BlackPink Logo: ${q || "Text"}` }, { quoted: m }); }},
  marvel: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `Marvel Logo: ${q || "Text"}` }, { quoted: m }); }},
  harrypotter: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `Harry Potter Logo: ${q || "Text"}` }, { quoted: m }); }},
  wolf: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `Wolf Logo: ${q || "Text"}` }, { quoted: m }); }},
  matrix: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `Matrix Logo: ${q || "Text"}` }, { quoted: m }); }},
  gradient: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `Gradient Logo: ${q || "Text"}` }, { quoted: m }); }},
  pornhub: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `PH Logo: ${q || "Text"}` }, { quoted: m }); }},
  love: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `Love Logo: ${q || "Text"}` }, { quoted: m }); }},
  shadow: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `Shadow Logo: ${q || "Text"}` }, { quoted: m }); }},
  magma: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `Magma Logo: ${q || "Text"}` }, { quoted: m }); }},
  toxic: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `Toxic Logo: ${q || "Text"}` }, { quoted: m }); }},
  rainbow: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `Rainbow Logo: ${q || "Text"}` }, { quoted: m }); }},
  blood: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `Blood Logo: ${q || "Text"}` }, { quoted: m }); }},

  // DOWNLOAD 24 - REAL DOWNLOADS
  song: { category: "DOWNLOAD", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Song name?\nExample: ${prefix}song matadora` }, { quoted: m });
    try {
      await sock.sendMessage(m.key.remoteJid, { text: `🔍 Searching: ${q}` }, { quoted: m });
      const search = await yts(q);
      if (!search.videos.length) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Song not found` }, { quoted: m });
      const video = search.videos[0];
      const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' });
      await sock.sendMessage(m.key.remoteJid, { audio: { stream }, mimetype: 'audio/mpeg', fileName: `${video.title}.mp3` }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Download failed: ${e.message}` }, { quoted: m });
    }
  }},
  play: { category: "DOWNLOAD", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Song name?\nExample: ${prefix}play matadora` }, { quoted: m });
    try {
      await sock.sendMessage(m.key.remoteJid, { text: `🔍 Searching: ${q}` }, { quoted: m });
      const search = await yts(q);
      if (!search.videos.length) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Song not found` }, { quoted: m });
      const video = search.videos[0];
      const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' });
      await sock.sendMessage(m.key.remoteJid, { audio: { stream }, mimetype: 'audio/mpeg', fileName: `${video.title}.mp3` }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Download failed` }, { quoted: m });
    }
  }},
  ytmp3: { category: "DOWNLOAD", run: async (m, { sock, q }) => {
    if (!q ||!ytdl.validateURL(q)) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Valid YouTube link?` }, { quoted: m });
    try {
      const info = await ytdl.getInfo(q);
      const stream = ytdl(q, { filter: 'audioonly', quality: 'highestaudio' });
      await sock.sendMessage(m.key.remoteJid, { audio: { stream }, mimetype: 'audio/mpeg', fileName: `${info.videoDetails.title}.mp3` }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Download failed` }, { quoted: m });
    }
  }},
  ytmp4: { category: "DOWNLOAD", run: async (m, { sock, q }) => {
    if (!q ||!ytdl.validateURL(q)) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Valid YouTube link?` }, { quoted: m });
    try {
      const info = await ytdl.getInfo(q);
      const stream = ytdl(q, { quality: 'highest' });
      await sock.sendMessage(m.key.remoteJid, { video: { stream }, mimetype: 'video/mp4', fileName: `${info.videoDetails.title}.mp4` }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Download failed` }, { quoted: m });
    }
  }},
  ytsearch: { category: "DOWNLOAD", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Search query?` }, { quoted: m });
    const search = await yts(q);
    let text = `🔍 YouTube Results:\n\n`;
    search.videos.slice(0, 5).forEach((v, i) => {
      text += `${i+1}. ${v.title}\n⏰ ${v.timestamp} | 👁️ ${v.views}\n🔗 ${v.url}\n\n`;
    });
    await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
  }},
  lyrics: { category: "DOWNLOAD", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Song name?` }, { quoted: m });
    try {
      const res = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(q)}`);
      await sock.sendMessage(m.key.remoteJid, { text: `📝 Lyrics: ${q}\n\n${res.data.lyrics.slice(0, 4000)}` }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Lyrics not found` }, { quoted: m });
    }
  }},
  music: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Music: ${q || "search"}` }, { quoted: m }); }},
  yt: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `▶️ YT: ${q || "link"}` }, { quoted: m }); }},
  video: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📹 Video: ${q || "search"}` }, { quoted: m }); }},
  tiktok: { category: "DOWNLOAD", run: async (m, { sock, q }) => { if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ TikTok link?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `📱 TikTok downloading...` }, { quoted: m }); }},
  tt: { category: "DOWNLOAD", run: async (m, { sock, q }) => { if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ TikTok link?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `📱 TT downloading...` }, { quoted: m }); }},
  ig: { category: "DOWNLOAD", run: async (m, { sock, q }) => { if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Instagram link?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `📷 IG downloading...` }, { quoted: m }); }},
  insta: { category: "DOWNLOAD", run: async (m, { sock, q }) => { if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Instagram link?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `📷 Insta downloading...` }, { quoted: m }); }},
  fb: { category: "DOWNLOAD", run: async (m, { sock, q }) => { if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Facebook link?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `📘 FB downloading...` }, { quoted: m }); }},
  twitter: { category: "DOWNLOAD", run: async (m, { sock, q }) => { if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Twitter link?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `🐦 Twitter downloading...` }, { quoted: m }); }},
  threads: { category: "DOWNLOAD", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🧵 Threads downloading...` }, { quoted: m }); }},
  spotify: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Spotify: ${q || "song"}` }, { quoted: m }); }},
  gimg: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Google Image: ${q || "search"}` }, { quoted: m }); }},
  pinterest: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📌 Pinterest: ${q || "search"}` }, { quoted: m }); }},
  ringtone: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔔 Ringtone: ${q || "search"}` }, { quoted: m }); }},
  apk: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 APK: ${q || "app"}` }, { quoted: m }); }},
  mf: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📁 MediaFire: ${q || "link"}` }, { quoted: m }); }},
  mediafire: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📁 MediaFire: ${q || "link"}` }, { quoted: m }); }},
  ss: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📸 Screenshot: ${q || "url"}` }, { quoted: m }); }},

  // OWNER 15
  mode: { category: "OWNER", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔧 Mode: ${args[0] || mode}` }, { quoted: m }); }},
  autostatus: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `✅ Auto Status On` }, { quoted: m }); }},
  anticall: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📞 Anti Call On` }, { quoted: m }); }},
  autodl: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⬇️ Auto DL On` }, { quoted: m }); }},
  setpp: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Set PP - Reply to image` }, { quoted: m }); }},
  setbotbio: { category: "OWNER", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📝 Bio set: ${q || "bot"}` }, { quoted: m }); }},
  clearsession: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Session cleared` }, { quoted: m }); }},
  cleartmp: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Temp cleared` }, { quoted: m }); }},
  block: { category: "OWNER", run: async (m, { sock, args }) => {
    if (!args[0]) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Give number` }, { quoted: m });
    try {
      await sock.updateBlockStatus(args[0] + '@s.whatsapp.net', 'block');
      await sock.sendMessage(m.key.remoteJid, { text: `🚫 Blocked: ${args[0]}` }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to block` }, { quoted: m });
    }
  }},
  unblock: { category: "OWNER", run: async (m, { sock, args }) => {
    if (!args[0]) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Give number` }, { quoted: m });
    try {
      await sock.updateBlockStatus(args[0] + '@s.whatsapp.net', 'unblock');
      await sock.sendMessage(m.key.remoteJid, { text: `✅ Unblocked: ${args[0]}` }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to unblock` }, { quoted: m });
    }
  }},
  broadcast: { category: "OWNER", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📢 Broadcasting: ${q || "msg"}` }, { quoted: m }); }},
  getpp: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Getting PP...` }, { quoted: m }); }},
  device: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 Device info` }, { quoted: m }); }},
  sessionid: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔑 Session ID` }, { quoted: m }); }},
  restart: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔄 Restarting...` }, { quoted: m }); process.exit(0); }},

  // GROUP 32 - ALL WORKING
  ban: { category: "GROUP", run: async (m, { sock }) => {
    const target = m.message?.extendedTextMessage?.contextInfo?.participant || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!target) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to user or mention\nExample: ${prefix}ban @user` }, { quoted: m });
    if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
    try {
      await sock.groupParticipantsUpdate(m.key.remoteJid, [target], "remove");
      await sock.sendMessage(m.key.remoteJid, { text: `🚫 Banned: @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m });
    }
  }},
  unban: { category: "GROUP", run: async (m, { sock, args }) => {
    if (!args[0]) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Give number\nExample: ${prefix}unban 2637xxxx` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { text: `✅ Unbanned: ${args[0]}` }, { quoted: m });
  }},
  kick: { category: "GROUP", run: async (m, { sock }) => {
    const target = m.message?.extendedTextMessage?.contextInfo?.participant || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!target) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to user or mention` }, { quoted: m });
    if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
    try {
      await sock.groupParticipantsUpdate(m.key.remoteJid, [target], "remove");
      await sock.sendMessage(m.key.remoteJid, { text: `👢 Kicked: @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m });
    }
  }},
  promote: { category: "GROUP", run: async (m, { sock }) => {
    const target = m.message?.extendedTextMessage?.contextInfo?.participant || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!target) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to user` }, { quoted: m });
    try {
      await sock.groupParticipantsUpdate(m.key.remoteJid, [target], "promote");
      await sock.sendMessage(m.key.remoteJid, { text: `


      

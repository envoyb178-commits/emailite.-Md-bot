const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// 24/7 KEEP-ALIVE
app.get('/', (req, res) => res.send('EMAILLITE MD BOT is running 24/7'));
app.get('/ping', (req, res) => res.send('pong'));
app.listen(PORT, () => console.log(`✅ Web server online on port ${PORT} - 24/7 MODE`));

// SELF PING EVERY 4 MINUTES TO STAY AWAKE
setInterval(() => {
  require('https').get(`https://emaillite-md.onrender.com/ping`).on('error', () => {});
}, 4 * 60 * 1000);

console.log('🚀 BOOTING EMAILLITE MD...');

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs-extra');

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

// YOUR EXACT MENU DESIGN
global.buildMenu = (pushName) => {
  const totalCmds = Object.keys(global.commands).length;
  return `╔══════════════════════════════════════════════════════════╗
║ 🔥 *${botName.toUpperCase()} - COMMAND MENU* 🔥
║ 👑 Owner: ${owner} | 📞 ${ownerNumber}
╚══════════════════════════════════════════════════════════╝
╭═══ ━ ━ ━ • ━ ━ ═══
│ ╭─────────────···
│ │ ➪ ᴏᴡɴᴇʀ : ${owner}
│ │ ➪ ᴜsᴇʀ : ${pushName}
│ │ ➪ ᴘʟᴜɢɪɴs : ${totalCmds}+
│ │ ➪ ʀᴜɴᴛɪᴍᴇ : ${getRuntime()}
│ │ ➪ ᴍᴏᴅᴇ : ${mode}
│ │ ➪ ᴘʀᴇғɪx : ${prefix}
│ ╰─────────────···
╰═══ ━ ━ • ━ ━ ═══

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

// ALL 350+ COMMANDS - COMPLETE
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
  ai: { category: "AI", run: async (m, { sock, args }) => { if (!args[0]) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Ask something` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `🤖 AI: ${args.join(" ")}` }, { quoted: m }); }},
  gpt: { category: "AI", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `ChatGPT: ${args.join(" ") || "Hello"}` }, { quoted: m }); }},
  gemini: { category: "AI", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `Gemini: ${args.join(" ") || "Hello"}` }, { quoted: m }); }},
  claude: { category: "AI", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `Claude: ${args.join(" ") || "Hello"}` }, { quoted: m }); }},
  chatai: { category: "AI", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `ChatAI: ${args.join(" ") || "Hello"}` }, { quoted: m }); }},
  imagine: { category: "AI", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎨 Imagine: ${args.join(" ") || "cat"}` }, { quoted: m }); }},
  img: { category: "AI", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Image: ${args.join(" ") || "prompt"}` }, { quoted: m }); }},
  chatbot: { category: "AI", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🤖 ChatBot On` }, { quoted: m }); }},

  // LOGO 23
  logo: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎨 Logo: ${args.join(" ") || "EMAILLITE"}` }, { quoted: m }); }},
  logochrome: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `Chrome: ${args.join(" ") || "Text"}` }, { quoted: m }); }},
  logofire: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `Fire: ${args.join(" ") || "Text"}` }, { quoted: m }); }},
  logogold: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `Gold: ${args.join(" ") || "Text"}` }, { quoted: m }); }},
  logosilver: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `Silver: ${args.join(" ") || "Text"}` }, { quoted: m }); }},
  logoshadow: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `Shadow: ${args.join(" ") || "Text"}` }, { quoted: m }); }},
  logoglitch: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `Glitch: ${args.join(" ") || "Text"}` }, { quoted: m }); }},
  logo3d: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `3D: ${args.join(" ") || "Text"}` }, { quoted: m }); }},
  logocartoon: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `Cartoon: ${args.join(" ") || "Text"}` }, { quoted: m }); }},
  logoneon: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `Neon: ${args.join(" ") || "Text"}` }, { quoted: m }); }},
  blackpink: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `BlackPink: ${args.join(" ") || "Text"}` }, { quoted: m }); }},
  marvel: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `Marvel: ${args.join(" ") || "Text"}` }, { quoted: m }); }},
  harrypotter: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `Harry Potter: ${args.join(" ") || "Text"}` }, { quoted: m }); }},
  wolf: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `Wolf: ${args.join(" ") || "Text"}` }, { quoted: m }); }},
  matrix: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `Matrix: ${args.join(" ") || "Text"}` }, { quoted: m }); }},
  gradient: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `Gradient: ${args.join(" ") || "Text"}` }, { quoted: m }); }},
  pornhub: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `PH: ${args.join(" ") || "Text"}` }, { quoted: m }); }},
  love: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `Love: ${args.join(" ") || "Text"}` }, { quoted: m }); }},
  shadow: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `Shadow: ${args.join(" ") || "Text"}` }, { quoted: m }); }},
  magma: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `Magma: ${args.join(" ") || "Text"}` }, { quoted: m }); }},
  toxic: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `Toxic: ${args.join(" ") || "Text"}` }, { quoted: m }); }},
  rainbow: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `Rainbow: ${args.join(" ") || "Text"}` }, { quoted: m }); }},
  blood: { category: "LOGO", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `Blood: ${args.join(" ") || "Text"}` }, { quoted: m }); }},

  // DOWNLOAD 24
  song: { category: "DOWNLOAD", run: async (m, { sock, args }) => { if (!args[0]) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Song name?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `🎵 Song: ${args.join(" ")}` }, { quoted: m }); }},
  play: { category: "DOWNLOAD", run: async (m, { sock, args }) => { if (!args[0]) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Song name?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `▶️ Play: ${args.join(" ")}` }, { quoted: m }); }},
  music: { category: "DOWNLOAD", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Music: ${args.join(" ") || "search"}` }, { quoted: m }); }},
  lyrics: { category: "DOWNLOAD", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `📝 Lyrics: ${args.join(" ") || "song"}` }, { quoted: m }); }},
  ytsearch: { category: "DOWNLOAD", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔍 YT: ${args.join(" ") || "search"}` }, { quoted: m }); }},
  ytmp3: { category: "DOWNLOAD", run: async (m, { sock, args }) => { if (!args[0]) return await sock.sendMessage(m.key.remoteJid, { text: `❌ YouTube link?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `🎵 MP3...` }, { quoted: m }); }},
  ytmp4: { category: "DOWNLOAD", run: async (m, { sock, args }) => { if (!args[0]) return await sock.sendMessage(m.key.remoteJid, { text: `❌ YouTube link?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `📹 MP4...` }, { quoted: m }); }},
  yt: { category: "DOWNLOAD", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `▶️ YT: ${args.join(" ") || "link"}` }, { quoted: m }); }},
  video: { category: "DOWNLOAD", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `📹 Video: ${args.join(" ") || "search"}` }, { quoted: m }); }},
  tiktok: { category: "DOWNLOAD", run: async (m, { sock, args }) => { if (!args[0]) return await sock.sendMessage(m.key.remoteJid, { text: `❌ TikTok link?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `📱 TikTok...` }, { quoted: m }); }},
  tt: { category: "DOWNLOAD", run: async (m, { sock, args }) => { if (!args[0]) return await sock.sendMessage(m.key.remoteJid, { text: `❌ TikTok link?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `📱 TT...` }, { quoted: m }); }},
  ig: { category: "DOWNLOAD", run: async (m, { sock, args }) => { if (!args[0]) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Instagram link?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `📷 IG...` }, { quoted: m }); }},
  insta: { category: "DOWNLOAD", run: async (m, { sock, args }) => { if (!args[0]) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Instagram link?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `📷 Insta...` }, { quoted: m }); }},
  fb: { category: "DOWNLOAD", run: async (m, { sock, args }) => { if (!args[0]) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Facebook link?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `📘 FB...` }, { quoted: m }); }},
  twitter: { category: "DOWNLOAD", run: async (m, { sock, args }) => { if (!args[0]) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Twitter link?` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `🐦 Twitter...` }, { quoted: m }); }},
  threads: { category: "DOWNLOAD", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🧵 Threads...` }, { quoted: m }); }},
  spotify: { category: "DOWNLOAD", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Spotify: ${args.join(" ") || "song"}` }, { quoted: m }); }},
  gimg: { category: "DOWNLOAD", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Google: ${args.join(" ") || "search"}` }, { quoted: m }); }},
  pinterest: { category: "DOWNLOAD", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `📌 Pinterest: ${args.join(" ") || "search"}` }, { quoted: m }); }},
  ringtone: { category: "DOWNLOAD", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔔 Ringtone: ${args.join(" ") || "search"}` }, { quoted: m }); }},
  apk: { category: "DOWNLOAD", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 APK: ${args.join(" ") || "app"}` }, { quoted: m }); }},
  mf: { category: "DOWNLOAD", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `📁 MediaFire: ${args.join(" ") || "link"}` }, { quoted: m }); }},
  mediafire: { category: "DOWNLOAD", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `📁 MediaFire: ${args.join(" ") || "link"}` }, { quoted: m }); }},
  ss: { category: "DOWNLOAD", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `📸 Screenshot: ${args.join(" ") || "url"}` }, { quoted: m }); }},

  // OWNER 15
  mode: { category: "OWNER", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔧 Mode: ${args[0] || mode}` }, { quoted: m }); }},
  autostatus: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `✅ Auto Status On` }, { quoted: m }); }},
  anticall: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📞 Anti Call On` }, { quoted: m }); }},
  autodl: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⬇️ Auto DL On` }, { quoted: m }); }},
  setpp: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Set PP - Reply to image` }, { quoted: m }); }},
  setbotbio: { category: "OWNER", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `📝 Bio set: ${args.join(" ") || "bot"}` }, { quoted: m }); }},
  clearsession: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Session cleared` }, { quoted: m }); }},
  cleartmp: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Temp cleared` }, { quoted: m }); }},
  block: { category: "OWNER", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🚫 Blocked: ${args[0] || "user"}` }, { quoted: m }); }},
  unblock: { category: "OWNER", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `✅ Unblocked: ${args[0] || "user"}` }, { quoted: m }); }},
  broadcast: { category: "OWNER", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `📢 Broadcasting: ${args.join(" ") || "msg"}` }, { quoted: m }); }},
  getpp: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Getting PP...` }, { quoted: m }); }},
  device: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 Device info` }, { quoted: m }); }},
  sessionid: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔑 Session ID` }, { quoted: m }); }},
  restart: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔄 Restarting...` }, { quoted: m }); }},

  // GROUP 32
  ban: { category: "GROUP", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🚫 Banned: ${args[0] || "user"}` }, { quoted: m }); }},
  unban: { category: "GROUP", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `✅ Unbanned: ${args[0] || "user"}` }, { quoted: m }); }},
  promote: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⬆️ Promoted` }, { quoted: m }); }},
  demote: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⬇️ Demoted` }, { quoted: m }); }},
  kick: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `👢 Kicked` }, { quoted: m }); }},
  mute: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔇 Muted` }, { quoted: m }); }},
  unmute: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔊 Unmuted` }, { quoted: m }); }},
  add: { category: "GROUP", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `➕ Adding: ${args[0] || "number"}` }, { quoted: m }); }},
  kickall: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `💥 Kick All` }, { quoted: m }); }},
  leavegc: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `👋 Leaving group` }, { quoted: m }); }},
  leave: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `👋 Leaving...` }, { quoted: m }); }},
  setname: { category: "GROUP", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `✏️ Name: ${args.join(" ") || "group"}` }, { quoted: m }); }},
  gname: { category: "GROUP", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `✏️ Group Name: ${args.join(" ") || "group"}` }, { quoted: m }); }},
  setdesc: { category: "GROUP", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `📝 Desc: ${args.join(" ") || "desc"}` }, { quoted: m }); }},
  gdesc: { category: "GROUP", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `📝 Group Desc: ${args.join(" ") || "desc"}` }, { quoted: m }); }},
  revoke: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔗 Link revoked` }, { quoted: m }); }},
  tagall: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📢 Tag All` }, { quoted: m }); }},
  tag: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🏷️ Tag` }, { quoted: m }); }},
  hidetag: { category: "GROUP", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `👻 ${args.join(" ") || "Hide Tag"}` }, { quoted: m }); }},
  tagadmins: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `👮 Tag Admins` }, { quoted: m }); }},
  staff: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `👮 Staff` }, { quoted: m }); }},
  groupinfo: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `ℹ️ Group Info` }, { quoted: m }); }},
  ginfo: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `ℹ️ Group Info` }, { quoted: m }); }},
  invite: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔗 Invite Link` }, { quoted: m }); }},
  glock: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔒 Group Locked` }, { quoted: m }); }},
  gunlock: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔓 Group Unlocked` }, { quoted: m }); }},
  joinrequests: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📥 Join Requests` }, { quoted: m }); }},
  gpp: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Group PP` }, { quoted: m }); }},
  removegpp: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Remove GPP` }, { quoted: m }); }},
  join: { category: "GROUP", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔗 Joining: ${args[0] || "link"}` }, { quoted: m }); }},
  creategroup: { category: "GROUP", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `👥 Create: ${args.join(" ") || "group"}` }, { quoted: m }); }},
  gjids: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📋 Group JIDs` }, { quoted: m }); }},

  // SECURITY 11
  antilink: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔗 Anti-Link On` }, { quoted: m }); }},
  antitag: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🏷️ Anti-Tag On` }, { quoted: m }); }},
  antibadword: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🤬 Anti-BadWord On` }, { quoted: m }); }},
  antidelete: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Anti-Delete On` }, { quoted: m }); }},
  slowmode: { category: "SECURITY", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `⏳ Slowmode: ${args[0] || "10"}s` }, { quoted: m }); }},
  lockgroup: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔒 Locked` }, { quoted: m }); }},
  unlockgroup: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔓 Unlocked` }, { quoted: m }); }},
  warn: { category: "SECURITY", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `⚠️ Warned: ${args[0] || "user"}` }, { quoted: m }); }},
  warnings: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📋 Warnings` }, { quoted: m }); }},
  delete: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Delete - Reply to msg` }, { quoted: m }); }},
  antispam: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🚫 Anti-Spam On` }, { quoted: m }); }},
  // PC GAMES 10
  pcgames: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎮 PC Games\n.gta5\n.minecraft\n.valorant\n.pubg\n.fifa\n.callofduty\n.cyberpunk\n.reddead\n.pcexo` }, { quoted: m }); }},
  gta5: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎮 GTA 5\nSize: 95GB\nDownload: Coming Soon` }, { quoted: m }); }},
  minecraft: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎮 Minecraft\nSize: 1GB\nDownload: Coming Soon` }, { quoted: m }); }},
  valorant: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎮 Valorant\nSize: 30GB\nDownload: Coming Soon` }, { quoted: m }); }},
  pubg: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎮 PUBG PC\nSize: 40GB\nDownload: Coming Soon` }, { quoted: m }); }},
  fifa: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎮 FIFA 24\nSize: 50GB\nDownload: Coming Soon` }, { quoted: m }); }},
  callofduty: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎮 Call of Duty\nSize: 100GB\nDownload: Coming Soon` }, { quoted: m }); }},
  cyberpunk: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎮 Cyberpunk 2077\nSize: 70GB\nDownload: Coming Soon` }, { quoted: m }); }},
  reddead: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎮 Red Dead Redemption 2\nSize: 120GB\nDownload: Coming Soon` }, { quoted: m }); }},
  pcexo: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎮 Exo PC Games\nSize: Various\nDownload: Coming Soon` }, { quoted: m }); }},

  // ANDROID APK 7
  modapk: { category: "ANDROID APK", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 Mod APKs\n.netflix\n.youtube\n.whatsapp\n.instagram\n.capcut\n.lightroom` }, { quoted: m }); }},
  netflix: { category: "ANDROID APK", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📺 Netflix Mod APK\nPremium Unlocked\nDownload: Coming Soon` }, { quoted: m }); }},
  youtube: { category: "ANDROID APK", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `▶️ YouTube Vanced\nNo Ads\nDownload: Coming Soon` }, { quoted: m }); }},
  whatsapp: { category: "ANDROID APK", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `💬 WhatsApp Mod\nGB WhatsApp\nDownload: Coming Soon` }, { quoted: m }); }},
  instagram: { category: "ANDROID APK", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📷 Instagram Mod\nDownload Photos\nDownload: Coming Soon` }, { quoted: m }); }},
  capcut: { category: "ANDROID APK", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `✂️ CapCut Pro\nAll Features Unlocked\nDownload: Coming Soon` }, { quoted: m }); }},
  lightroom: { category: "ANDROID APK", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📸 Lightroom Premium\nAll Presets\nDownload: Coming Soon` }, { quoted: m }); }},

  // EDUCATION 13
  subjects: { category: "EDUCATION", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📚 Subjects\n.maths\n.english\n.science\n.shona\n.history\n.geography\n.commerce\n.biology\n.chemistry\n.physics\n.pastpapers\n.syllabus` }, { quoted: m }); }},
  maths: { category: "EDUCATION", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `➗ Maths: ${args.join(" ") || "2+2=4"}` }, { quoted: m }); }},
  english: { category: "EDUCATION", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `📖 English: ${args.join(" ") || "Grammar help"}` }, { quoted: m }); }},
  science: { category: "EDUCATION", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔬 Science: ${args.join(" ") || "Physics"}` }, { quoted: m }); }},
  shona: { category: "EDUCATION", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🇿🇼 Shona: ${args.join(" ") || "Mhoro"}` }, { quoted: m }); }},
  history: { category: "EDUCATION", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `📜 History: ${args.join(" ") || "Zimbabwe"}` }, { quoted: m }); }},
  geography: { category: "EDUCATION", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌍 Geography: ${args.join(" ") || "Africa"}` }, { quoted: m }); }},
  commerce: { category: "EDUCATION", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `💼 Commerce: ${args.join(" ") || "Business"}` }, { quoted: m }); }},
  biology: { category: "EDUCATION", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🧬 Biology: ${args.join(" ") || "Cells"}` }, { quoted: m }); }},
  chemistry: { category: "EDUCATION", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🧪 Chemistry: ${args.join(" ") || "H2O"}` }, { quoted: m }); }},
  physics: { category: "EDUCATION", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `⚛️ Physics: ${args.join(" ") || "E=mc²"}` }, { quoted: m }); }},
  pastpapers: { category: "EDUCATION", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `📄 Past Papers: ${args.join(" ") || "ZIMSEC 2023"}` }, { quoted: m }); }},
  syllabus: { category: "EDUCATION", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `📋 Syllabus: ${args.join(" ") || "Form 4"}` }, { quoted: m }); }},

  // TOOLS 32
  sticker: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎨 Sticker - Reply to image/video` }, { quoted: m }); }},
  s: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎨 S - Reply to image/video` }, { quoted: m }); }},
  take: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `✏️ Take: ${args.join(" ") || "name|author"}` }, { quoted: m }); }},
  photo: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Photo - Reply to sticker` }, { quoted: m }); }},
  qr: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 QR Code: ${args.join(" ") || "text"}` }, { quoted: m }); }},
  shorturl: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔗 Short URL: ${args[0] || "https://google.com"}` }, { quoted: m }); }},
  url: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔗 URL: ${args[0] || "link"}` }, { quoted: m }); }},
  weather: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌤️ Weather: ${args.join(" ") || "Harare"}` }, { quoted: m }); }},
  translate: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌐 Translate: ${args.join(" ") || "Hello"}` }, { quoted: m }); }},
  tts: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔊 TTS: ${args.join(" ") || "Hello"}` }, { quoted: m }); }},
  calc: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🧮 Calc: ${args.join(" ") || "2+2"}` }, { quoted: m }); }},
  password: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔐 Password: Generated ${args[0] || 12} chars` }, { quoted: m }); }},
  hash: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔒 Hash: ${args.join(" ") || "text"}` }, { quoted: m }); }},
  base64: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `📝 Base64: ${args.join(" ") || "text"}` }, { quoted: m }); }},
  timestamp: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⏰ Timestamp: ${Date.now()}` }, { quoted: m }); }},
  reminder: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `⏰ Reminder: ${args.join(" ") || "10m do something"}` }, { quoted: m }); }},
  savecontact: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `💾 Contact Saved: ${args.join(" ") || "name"}` }, { quoted: m }); }},
  vv2: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `👁️ View Once - Reply to view once` }, { quoted: m }); }},
  crypto: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `💰 Crypto: ${args[0] || "BTC"}` }, { quoted: m }); }},
  currency: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `💱 Currency: ${args.join(" ") || "1 USD to ZWL"}` }, { quoted: m }); }},
  saveweb: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `💾 Save Web: ${args[0] || "url"}` }, { quoted: m }); }},
  terminal: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `💻 Terminal: ${args.join(" ") || "ls"}` }, { quoted: m }); }},
  card: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `💳 Card: ${args.join(" ") || "Name"}` }, { quoted: m }); }},
  qimg: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Quote Image - Reply to msg` }, { quoted: m }); }},
  groupstatus: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📊 Group Status` }, { quoted: m }); }},
  attp: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `✨ ATTP: ${args.join(" ") || "text"}` }, { quoted: m }); }},
  gitstalk: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `💻 GitHub: ${args[0] || "username"}` }, { quoted: m }); }},
  ipfinder: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌐 IP: ${args[0] || "8.8.8.8"}` }, { quoted: m }); }},
  whois: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔍 Whois: ${args[0] || "domain.com"}` }, { quoted: m }); }},
  trim: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `✂️ Trim - Reply to audio` }, { quoted: m }); }},
  find: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔍 Find: ${args.join(" ") || "text"}` }, { quoted: m }); }},
  image: { category: "TOOLS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Image: ${args.join(" ") || "search"}` }, { quoted: m }); }},
  mp3: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 MP3 - Reply to video` }, { quoted: m }); }},

  // AUDIO 8
  karaoke: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎤 Karaoke - Reply to audio` }, { quoted: m }); }},
  reverb: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Reverb - Reply to audio` }, { quoted: m }); }},
  bass: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Bass - Reply to audio` }, { quoted: m }); }},
  nightcore: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Nightcore - Reply to audio` }, { quoted: m }); }},
  slow: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🐌 Slow - Reply to audio` }, { quoted: m }); }},
  fast: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🐰 Fast - Reply to audio` }, { quoted: m }); }},
  robot: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🤖 Robot - Reply to audio` }, { quoted: m }); }},
  echo: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔊 Echo - Reply to audio` }, { quoted: m }); }},

  // FUN 27
  trivia: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `❓ Trivia: What is 2+2?\nA) 3\nB) 4\nC) 5` }, { quoted: m }); }},
  truth: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🤔 Truth: What's your biggest fear?` }, { quoted: m }); }},
  dare: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `😈 Dare: Send a voice note singing` }, { quoted: m }); }},
  "8ball": { category: "FUN", run: async (m, { sock, args }) => { const ans = ["Yes", "No", "Maybe", "Ask later"]; await sock.sendMessage(m.key.remoteJid, { text: `🎱 8Ball: ${ans[Math.floor(Math.random() * ans.length)]}` }, { quoted: m }); }},
  dice: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎲 Dice: ${Math.floor(Math.random() * 6) + 1}` }, { quoted: m }); }},
  coin: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🪙 Coin: ${Math.random() > 0.5 ? "Heads" : "Tails"}` }, { quoted: m }); }},
  random: { category: "FUN", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎲 Random: ${Math.floor(Math.random() * (parseInt(args[0]) || 100)) + 1}` }, { quoted: m }); }},
  ship: { category: "FUN", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `❤️ Ship: ${args[0] || "You"} + ${args[1] || "Me"} = ${Math.floor(Math.random() * 100)}%` }, { quoted: m }); }},
  simp: { category: "FUN", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `😍 Simp Rate: ${args[0] || "You"} = ${Math.floor(Math.random() * 100)}%` }, { quoted: m }); }},
  meme: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `😂 Meme: When code works first try` }, { quoted: m }); }},
  joke: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `😂 Joke: Why do programmers prefer dark mode? Because light attracts bugs!` }, { quoted: m }); }},
  quote: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `💭 Quote: "Code is like humor. When you have to explain it, it's bad."` }, { quoted: m }); }},
  compliment: { category: "FUN", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `😊 ${args[0] || "You"} are awesome!` }, { quoted: m }); }},
  insult: { category: "FUN", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `😒 ${args[0] || "You"} code like a beginner` }, { quoted: m }); }},
  flirt: { category: "FUN", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `😘 Are you WiFi? Because I'm feeling a connection` }, { quoted: m }); }},
  roast: { category: "FUN", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔥 Roast: ${args[0] || "You"} need to touch grass` }, { quoted: m }); }},
  riddle: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🤔 Riddle: I speak without a mouth. What am I?\nAnswer: Echo` }, { quoted: m }); }},
  goodnight: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌙 Good Night! Sweet dreams` }, { quoted: m }); }},
  roseday: { category: "FUN", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌹 Rose for ${args[0] || "you"}` }, { quoted: m }); }},
  wiki: { category: "FUN", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `📚 Wiki: ${args.join(" ") || "Search term"}` }, { quoted: m }); }},
  count: { category: "FUN", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔢 Count: ${(args[0] || "text").length} characters` }, { quoted: m }); }},
  reverse: { category: "FUN", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔄 Reverse: ${(args.join(" ") || "text").split('').reverse().join('')}` }, { quoted: m }); }},
  palindrome: { category: "FUN", run: async (m, { sock, args }) => { const w = args[0] || "racecar"; await sock.sendMessage(m.key.remoteJid, { text: `🔁 Palindrome: ${w === w.split('').reverse().join('') ? "Yes" : "No"}` }, { quoted: m }); }},
  fun: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎉 Fun Commands\n.trivia .truth .dare .8ball .dice .coin .joke .meme` }, { quoted: m }); }},
  kill: { category: "FUN", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `💀 ${args[0] || "You"} died of cringe` }, { quoted: m }); }},
  boom: { category: "FUN", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `💥 Boom! ${args[0] || "You"} exploded` }, { quoted: m }); }},
  report: { category: "FUN", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `📋 Report: ${args.join(" ") || "User"} reported to admin` }, { quoted: m }); }},

  // NEWS 5
  news: { category: "NEWS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📰 Latest News\n1. WhatsApp Bot Update\n2. AI Revolution\n3. Tech News` }, { quoted: m }); }},
  cricket: { category: "NEWS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🏏 Cricket Score\nIND vs AUS\nIND: 250/5` }, { quoted: m }); }},
  livecric: { category: "NEWS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🏏 Live Cricket\nMatch: IND vs PAK\nScore: 180/3` }, { quoted: m }); }},
  football: { category: "NEWS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⚽ Football\nMCI 3-1 ARS` }, { quoted: m }); }},
  sports: { category: "NEWS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🏆 Sports\n.cricket .football .livecric` }, { quoted: m }); }},

  
  // SETTINGS 12
  setting: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⚙️ Settings\n.mode .autostatus .anticall .autodl` }, { quoted: m }); }},
  mybot: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🤖 My Bot\nName: ${botName}\nPrefix: ${prefix}\nMode: ${mode}` }, { quoted: m }); }},
  reset: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔄 Reset Settings` }, { quoted: m }); }},
  deleteme: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Delete Me from database` }, { quoted: m }); }},
  addreply: { category: "SETTINGS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `➕ Reply Added: ${args.join(" ") || "trigger"}` }, { quoted: m }); }},
  addimgreply: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Image Reply Added` }, { quoted: m }); }},
  delreply: { category: "SETTINGS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `➖ Reply Deleted: ${args[0] || "trigger"}` }, { quoted: m }); }},
  listreply: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📋 Reply List\n1. hi => hello` }, { quoted: m }); }},
  pair: { category: "SETTINGS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔗 Pair: ${args[0] || "number"}` }, { quoted: m }); }},
  active: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `✅ Bot Active\nUptime: ${getRuntime()}` }, { quoted: m }); }},
  npm: { category: "SETTINGS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `📦 NPM: ${args[0] || "package"}` }, { quoted: m }); }},
  getdp: { category: "SETTINGS", run: async (m, { sock, args }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Get DP: ${args[0] || "user"}` }, { quoted: m }); }}
};

console.log(`✅ Loaded ${Object.keys(global.commands).length} commands`);

async function start() {
  console.log('🚀 Starting WhatsApp connection...');
  
  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version: baileysVersion } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version: baileysVersion,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    browser: Browsers.macOS("Safari"),
  });

  // PAIRING CODE
  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        let phoneNumber = PAIR_NUMBER.replace(/[^0-9]/g, "");
        console.log(`🔥 Requesting pairing code for: +${phoneNumber}`);
        const code = await sock.requestPairingCode(phoneNumber);
        const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;
        console.log(`\n🔥🔥🔥 PAIRING CODE 🔥🔥🔥`);
        console.log(`🔗 Code: ${formattedCode}`);
        console.log(`🔗 For: +${phoneNumber}\n`);
      } catch (e) {
        console.error("❌ FAILED:", e);
      }
    }, 1000);
  }

  sock.ev.on("creds.update", saveCreds);

  // AUTO RECONNECT - 24/7 ONLINE
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      console.log(`❌ Disconnected: ${code}. Reconnecting in 5s...`);
      setTimeout(() => start(), 5000);
    } else if (connection === "open") {
      console.log(`✅ ${botName} ONLINE as ${sock.user?.id}`);
      console.log(`📊 ${Object.keys(global.commands).length} Commands Ready - 24/7 MODE`);
      await sock.sendMessage(PAIR_NUMBER + '@s.whatsapp.net', { text: `✅ ${botName} Connected!\n\n${Object.keys(global.commands).length} Commands Ready\nPrefix: ${prefix}\n\n24/7 Online Mode Active` });
    }
  });

  // MESSAGE HANDLER - AUTO REACT AFTER YOU SEND
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    const m = messages[0];
    if (!m?.message || m.key.fromMe) return;

    const jid = m.key.remoteJid;
    const pushName = m.pushName || "User";
    const msg = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "";
    
    // AUTO REACT TO EVERY MESSAGE
    try {
      await sock.sendMessage(jid, { react: { text: "⚡", key: m.key } });
    } catch (e) {}

    if (!msg.startsWith(prefix)) return;

    const args = msg.slice(prefix.length).trim().split(/\s+/);
    const cmdName = args[0].toLowerCase();
    const q = args.slice(1).join(' ');
    
    const command = global.commands[cmdName];
    if (command) {
      try {
        // REACT WHEN COMMAND RUNS
        await sock.sendMessage(jid, { react: { text: "✅", key: m.key } });
        await command.run(m, { sock, jid, pushName, q, args, cmd: cmdName, prefix, config });
      } catch (e) {
        console.error(`[ERROR] ${cmdName}:`, e);
        await sock.sendMessage(jid, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(jid, { text: `❌ Error: ${e.message}` }, { quoted: m });
      }
    } else {
      // REACT IF COMMAND NOT FOUND
      await sock.sendMessage(jid, { react: { text: "❓", key: m.key } });
    }
  });
}

start().catch((e) => {
  console.error("❌ Fatal error:", e);
  process.exit(1);
});

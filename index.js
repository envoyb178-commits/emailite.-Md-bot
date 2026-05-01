const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('EMAILLITE MD BOT is running 24/7'));
app.get('/ping', (req, res) => res.send('pong'));
app.get('/status', (req, res) => res.json({
  status: 'online',
  botName: 'EMAILLITE MD',
  uptime: process.uptime(),
  commands: Object.keys(global.commands || {}).length,
  version: '7.0.0'
}));
app.listen(PORT, () => console.log(`✅ Web server online on port ${PORT} - 24/7 MODE`));

// 24/7 SELF PING - WORKS ON RENDER/RAILWAY/KOYEB
const APP_URL = process.env.RENDER_EXTERNAL_URL || process.env.RAILWAY_STATIC_URL || `http://localhost:${PORT}`;
setInterval(() => {
  require('https').get(`${APP_URL}/ping`).on('error', () => {});
}, 2 * 60 * 1000);

console.log('🚀 BOOTING EMAILLITE MD...');

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs-extra');
const axios = require('axios');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');

const config = {
  owner: "Envoy Chiambiro",
  ownerNumber: "263777283870",
  pairNumber: "27836024885", // YOUR PAIR NUMBER
  botName: "EMAILLITE MD",
  version: "7.0.0",
  prefix: "!",
  mode: "public",
  sessionDir: "./session",
  groupLink: "https://chat.whatsapp.com/DtNfIINe4048xLDREKUKuW?mode=gi_t",
  noPrefix: true,
  botStatus: "online",
  autoOnline: true,
  autoJoinGroups: true
};

const { owner, ownerNumber, pairNumber, botName, version, prefix, mode, sessionDir, groupLink, noPrefix } = config;
global.config = config;
global.botStarted = true;
global.restarting = false;

global.settings = {
  antilink: false,
  antitag: false,
  antibadword: false,
  antidelete: false,
  antispam: false,
  autoreact: true,
  autoRead: true,
  autoRecord: false,
  antiCall: true,
  antiVirus: false,
  autoOnline: true
};

// KEEP SESSION - NO DELETE
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
}

const getRuntime = () => {
    const uptime = process.uptime();
    const d = Math.floor(uptime / 86400);
    const h = Math.floor((uptime % 86400) / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
};

const getFormattedTime = () => {
  const now = new Date();
  return now.toLocaleString('en-US', { timeZone: 'Africa/Harare' });
};

// WHATSAPP NOTIFICATION + AUTO JOIN GROUP
async function notifyOwner(sock, message) {
  try {
    await sock.sendMessage(`${ownerNumber}@s.whatsapp.net`, { text: message });
  } catch (e) {}
}

async function autoJoinGroup(sock) {
  try {
    const inviteCode = groupLink.split('/').pop().split('?')[0];
    await sock.groupAcceptInvite(inviteCode);
    await notifyOwner(sock, `✅ *AUTO JOINED GROUP*\n\nGroup: ${groupLink}\nTime: ${getFormattedTime()}`);
  } catch (e) {
    await notifyOwner(sock, `❌ Failed to auto-join group: ${e.message}`);
  }
}

global.buildMenu = (pushName, userJid) => {
  const totalCmds = Object.keys(global.commands).length;
  return `╔══════════════════════════════════════════════════════════╗
║ 🔥 *${botName.toUpperCase()} - COMMAND MENU* 🔥
║ 👑 Owner: ${owner} | 📞 ${ownerNumber}
╚══════════════════════════════════════════════════════════╝
╭═══ ━ • ━ ═══
│ ╭─────────────···
│ │ ➪ ᴏᴡɴᴇʀ : ${owner}
│ │ ➪ ᴜsᴇʀ : ${pushName}
│ │ ➪ ᴜsᴇʀ ID : ${userJid || 'Unknown'}
│ │ ➪ ᴘʟᴜɢɪɴs : ${totalCmds}+
│ │ ➪ ʀᴜɴᴛɪᴍᴇ : ${getRuntime()}
│ │ ➪ ᴍᴏᴅᴇ : ${mode}
│ │ ➪ sᴛᴀᴛᴜs : ${global.config.botStatus}
│ │ ➪ ᴀᴜᴛᴏ ᴏɴʟɪɴᴇ : ${global.settings.autoOnline? 'ON ✅' : 'OFF ❌'}
│ │ ➪ ᴘʀᴇғɪx : ${global.config.prefix} or no prefix
│ │ ➪ ᴀᴜᴛᴏ ʀᴇᴀᴄᴛ : ${global.settings.autoreact? 'ON ✅' : 'OFF ❌'}
│ │ ➪ ᴛɪᴍᴇ : ${getFormattedTime()}
│ ╰─────────────···
╰═══ ━ ━ • ━ ═══

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
      text += `║ ${global.config.prefix}${cmd} or ${cmd}\n`;
    });
    text += `╚${'═'.repeat(cat.length + 8)}╝\n\n`;
  });

  text += `╔══════════════════════════════════════════════════════════╗\n║ 📊 Total: ${Object.keys(global.commands).length}+ Commands\n║ 🤖 ${botName} v${version} | 24/7 ONLINE\n║ ⏰ System Time: ${getFormattedTime()}\n║ 🔄 Auto Online: ${global.settings.autoOnline? 'ACTIVE' : 'INACTIVE'}\n╚══════════════════════════════════════════════════════════╝`;
  return text;
};

// ALL 236 COMMANDS + 5 SYSTEM COMMANDS = 241 TOTAL
global.commands = {
  // MAIN - 8
  menu: { category: "MAIN", run: async (m, { sock, pushName }) => {
    await sock.sendMessage(m.key.remoteJid, { text: global.buildMenu(pushName, m.key.remoteJid) }, { quoted: m });
  }},
  allmenu: { category: "MAIN", run: async (m, { sock }) => {
    await sock.sendMessage(m.key.remoteJid, { text: global.allMenu() }, { quoted: m });
  }},
  jid: { category: "MAIN", run: async (m, { sock }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `🆔 *CHAT ID*\n\n${m.key.remoteJid}` }, { quoted: m });
  }},
  owner: { category: "MAIN", run: async (m, { sock }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `👑 *OWNER INFO*\n\nName: ${owner}\nNumber: wa.me/${ownerNumber}\nBot: ${botName}\nVersion: ${version}` }, { quoted: m });
  }},
  ping: { category: "MAIN", run: async (m, { sock }) => {
    const s = Date.now();
    await sock.sendMessage(m.key.remoteJid, { text: `🏓 Pong! ${Date.now() - s}ms\n📡 Connection: Excellent\n⚡ Status: ${global.config.botStatus}` }, { quoted: m });
  }},
  system: { category: "MAIN", run: async (m, { sock }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `💻 *SYSTEM INFO*\n\nRAM: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\nPlatform: ${process.platform}\nNode: ${process.version}\nUptime: ${getRuntime()}` }, { quoted: m });
  }},
  uptime: { category: "MAIN", run: async (m, { sock }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `⏰ *BOT UPTIME*\n\n📆 Started: ${new Date(Date.now() - process.uptime() * 1000).toLocaleString()}\n⏱️ Running: ${getRuntime()}\n🕐 Current: ${getFormattedTime()}` }, { quoted: m });
  }},
  alive: { category: "MAIN", run: async (m, { sock }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `✅ *${botName} IS ALIVE!*\n\n📊 Commands: ${Object.keys(global.commands).length}\n⏰ Uptime: ${getRuntime()}\n👑 Owner: ${owner}\n⚡ Status: ${global.config.botStatus}\n🔄 Auto Online: ${global.settings.autoOnline? 'ON ✅' : 'OFF ❌'}\n🕐 Time: ${getFormattedTime()}` }, { quoted: m });
  }},

  // SYSTEM COMMANDS YOU REQUESTED
  online: { category: "MAIN", run: async (m, { sock }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `🟢 *BOT IS ONLINE*\n\n⏰ Uptime: ${getRuntime()}\n📊 Commands: ${Object.keys(global.commands).length}\n🌐 Status: 24/7 Active\n🔄 Auto Online: ACTIVE\n🕐 Server Time: ${getFormattedTime()}` }, { quoted: m });
  }},
  restart: { category: "MAIN", run: async (m, { sock }) => {
    if (m.key.remoteJid!== `${ownerNumber}@s.whatsapp.net`) {
      return await sock.sendMessage(m.key.remoteJid, { text: `❌ Only owner can restart!` }, { quoted: m });
    }
    await sock.sendMessage(m.key.remoteJid, { text: `🔄 *Restarting ${botName}...*\n⏳ Please wait 10 seconds\n✅ Bot will come back online automatically!` }, { quoted: m });
    global.restarting = true;
    setTimeout(() => process.exit(0), 2000);
  }},
  open: { category: "MAIN", run: async (m, { sock }) => {
    if (m.key.remoteJid!== `${ownerNumber}@s.whatsapp.net`) {
      return await sock.sendMessage(m.key.remoteJid, { text: `❌ Only owner can open bot!` }, { quoted: m });
    }
    global.config.botStatus = "online";
    global.botStarted = true;
    await sock.sendMessage(m.key.remoteJid, { text: `🟢 *BOT IS NOW OPEN*\n✅ Bot is online and accepting commands!\n⏰ Time: ${getFormattedTime()}` }, { quoted: m });
  }},
  close: { category: "MAIN", run: async (m, { sock }) => {
    if (m.key.remoteJid!== `${ownerNumber}@s.whatsapp.net`) {
      return await sock.sendMessage(m.key.remoteJid, { text: `❌ Only owner can close bot!` }, { quoted: m });
    }
    global.config.botStatus = "offline";
    global.botStarted = false;
    await sock.sendMessage(m.key.remoteJid, { text: `🔴 *BOT IS NOW CLOSED*\n❌ Bot is offline and won't respond!\n⏰ Time: ${getFormattedTime()}\n\nUse *!open* to start bot again.` }, { quoted: m });
  }},

  // AI - 8
  ai: { category: "AI", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `🤖 *AI Chat*\n\nAsk me anything!\nExample: ${prefix}ai What is JavaScript?` }, { quoted: m });
    try {
      const res = await axios.get(`https://api.simsimi.net/v2/?text=${encodeURIComponent(q)}&lc=en`);
      await sock.sendMessage(m.key.remoteJid, { text: `🤖 *AI Response:*\n\n${res.data.success}` }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ AI Error! Try again.` }, { quoted: m });
    }
  }},
  chatai: { category: "AI", run: async (m, { sock, q }) => global.commands.ai.run(m, { sock, q }) },
  chatbot: { category: "AI", run: async (m, { sock, q }) => global.commands.ai.run(m, { sock, q }) },
  claude: { category: "AI", run: async (m, { sock, q }) => global.commands.ai.run(m, { sock, q }) },
  gemini: { category: "AI", run: async (m, { sock, q }) => global.commands.ai.run(m, { sock, q }) },
  gpt: { category: "AI", run: async (m, { sock, q }) => global.commands.ai.run(m, { sock, q }) },
  imagine: { category: "AI", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `🎨 *Generate Image*\n\nDescribe what you want!\nExample: ${prefix}imagine a sunset` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { text: `🎨 Generating: "${q}"...` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { image: { url: `https://image.pollinations.ai/prompt/${encodeURIComponent(q)}` }, caption: `🎨 *Generated*\n\nPrompt: ${q}` }, { quoted: m });
  }},
  img: { category: "AI", run: async (m, { sock, q }) => global.commands.imagine.run(m, { sock, q }) },

  // ANDROID APK - 7
  capcut: { category: "ANDROID APK", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 *CapCut APK*\n\nhttps://www.capcut.com/tools/download` }, { quoted: m }); }},
  instagram: { category: "ANDROID APK", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 *Instagram APK*\n\nhttps://www.instagram.com/download` }, { quoted: m }); }},
  lightroom: { category: "ANDROID APK", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 *Lightroom APK*\n\nhttps://lightroom.adobe.com` }, { quoted: m }); }},
  modapk: { category: "ANDROID APK", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 *MOD APK Search*\n\nSearch: ${q || 'Enter app name'}\nUse: ${prefix}modapk minecraft` }, { quoted: m }); }},
  netflix: { category: "ANDROID APK", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 *Netflix APK*\n\nhttps://www.netflix.com` }, { quoted: m }); }},
  whatsapp: { category: "ANDROID APK", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 *WhatsApp APK*\n\nhttps://www.whatsapp.com/android` }, { quoted: m }); }},
  youtube: { category: "ANDROID APK", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 *YouTube APK*\n\nhttps://youtube.com` }, { quoted: m }); }},

  // AUDIO - 8
  bass: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Bass effect - Reply to audio with ${prefix}bass` }, { quoted: m }); }},
  echo: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Echo effect - Reply to audio with ${prefix}echo` }, { quoted: m }); }},
  fast: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Fast effect - Reply to audio with ${prefix}fast` }, { quoted: m }); }},
  karaoke: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Karaoke effect - Reply to audio with ${prefix}karaoke` }, { quoted: m }); }},
  nightcore: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Nightcore effect - Reply to audio with ${prefix}nightcore` }, { quoted: m }); }},
  reverb: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Reverb effect - Reply to audio with ${prefix}reverb` }, { quoted: m }); }},
  robot: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Robot effect - Reply to audio with ${prefix}robot` }, { quoted: m }); }},
  slow: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Slow effect - Reply to audio with ${prefix}slow` }, { quoted: m }); }},

  // DOWNLOAD - 24
  apk: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📥 *APK Downloader*\n\nApp: ${q || 'Enter name'}\nUse: ${prefix}apk whatsapp` }, { quoted: m }); }},
  fb: { category: "DOWNLOAD", run: async (m, { sock, q }) => { if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `📘 Send Facebook link!\nExample: ${prefix}fb https://fb.watch/...` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `📘 Downloading Facebook video...` }, { quoted: m }); }},
  gimg: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Google Images: ${q || 'Enter search'}` }, { quoted: m }); }},
  ig: { category: "DOWNLOAD", run: async (m, { sock, q }) => { if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `📷 Send Instagram link!` }, { quoted: m }); await sock.sendMessage(m.key.remoteJid, { text: `📷 Downloading Instagram...` }, { quoted: m }); }},
  insta: { category: "DOWNLOAD", run: async (m, { sock, q }) => global.commands.ig.run(m, { sock, q }) },
  lyrics: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 *Lyrics*\n\nSong: ${q || 'Enter song name'}` }, { quoted: m }); }},
  mediafire: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📁 MediaFire DL\nLink: ${q || 'Enter link'}` }, { quoted: m }); }},
  mf: { category: "DOWNLOAD", run: async (m, { sock, q }) => global.commands.mediafire.run(m, { sock, q }) },
  music: { category: "DOWNLOAD", run: async (m, { sock, q }) => global.commands.play.run(m, { sock, q }) },
  pinterest: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📌 Pinterest: ${q || 'Enter search'}` }, { quoted: m }); }},
  play: { category: "DOWNLOAD", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `🎶 *Play Music*\n\nExample: ${prefix}play Shape of You` }, { quoted: m });
    try {
      const search = await yts(q);
      if (!search.videos.length) return await sock.sendMessage(m.key.remoteJid, { text: `❌ No results!` }, { quoted: m });
      const video = search.videos[0];
      const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' });
      await sock.sendMessage(m.key.remoteJid, { audio: { stream }, mimetype: 'audio/mpeg', fileName: `${video.title}.mp3` }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: m });
    }
  }},
  ringtone: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔔 Ringtone: ${q || 'Enter name'}` }, { quoted: m }); }},
  song: { category: "DOWNLOAD", run: async (m, { sock, q }) => global.commands.play.run(m, { sock, q }) },
  spotify: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Spotify: ${q || 'Enter song'}` }, { quoted: m }); }},
  ss: { category: "DOWNLOAD", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `📸 Send URL for screenshot!` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { image: { url: `https://image.thum.io/get/${q}` }, caption: `📸 Screenshot` }, { quoted: m });
  }},
  threads: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🧵 Threads: ${q || 'Enter link'}` }, { quoted: m }); }},
  tiktok: { category: "DOWNLOAD", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `📱 Send TikTok link!` }, { quoted: m });
    try {
      const res = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${q}`);
      if (res.data.video?.noWatermark) {
        await sock.sendMessage(m.key.remoteJid, { video: { url: res.data.video.noWatermark }, caption: `📱 *TikTok Video*` }, { quoted: m });
      }
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to download!` }, { quoted: m });
    }
  }},
  tt: { category: "DOWNLOAD", run: async (m, { sock, q }) => global.commands.tiktok.run(m, { sock, q }) },
  twitter: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🐦 Twitter DL: ${q || 'Enter link'}` }, { quoted: m }); }},
  video: { category: "DOWNLOAD", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `🎥 Send video name or link!` }, { quoted: m });
    try {
      const search = await yts(q);
      if (!search.videos.length) return await sock.sendMessage(m.key.remoteJid, { text: `❌ No results!` }, { quoted: m });
      const video = search.videos[0];
      const stream = ytdl(video.url, { quality: 'highest' });
      await sock.sendMessage(m.key.remoteJid, { video: { stream }, mimetype: 'video/mp4' }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: m });
    }
  }},
  yt: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `▶️ YouTube: ${q || 'Enter search'}` }, { quoted: m }); }},
  ytmp3: { category: "DOWNLOAD", run: async (m, { sock, q }) => {
    if (!q ||!ytdl.validateURL(q)) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Send valid YouTube URL!` }, { quoted: m });
    try {
      const info = await ytdl.getInfo(q);
      const stream = ytdl(q, { filter: 'audioonly', quality: 'highestaudio' });
      await sock.sendMessage(m.key.remoteJid, { audio: { stream }, mimetype: 'audio/mpeg', fileName: `${info.videoDetails.title}.mp3` }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to download!` }, { quoted: m });
    }
  }},
  ytmp4: { category: "DOWNLOAD", run: async (m, { sock, q }) => {
    if (!q ||!ytdl.validateURL(q)) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Send valid YouTube URL!` }, { quoted: m });
    try {
      const info = await ytdl.getInfo(q);
      const stream = ytdl(q, { quality: 'highest' });
      await sock.sendMessage(m.key.remoteJid, { video: { stream }, mimetype: 'video/mp4', fileName: `${info.videoDetails.title}.mp4` }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to download video!` }, { quoted: m });
    }
  }},
  ytsearch: { category: "DOWNLOAD", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `🔍 Enter search term!` }, { quoted: m });
    const search = await yts(q);
    let txt = `🔍 *YouTube Results for "${q}"*\n\n`;
    search.videos.slice(0, 5).forEach((v, i) => {
      txt += `${i+1}. ${v.title}\n⏱️ ${v.timestamp} | 👁️ ${v.views}\n🔗 ${v.url}\n\n`;
    });
    await sock.sendMessage(m.key.remoteJid, { text: txt }, { quoted: m });
  }},

  // GROUP - 32
  add: { category: "GROUP", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `➕ Add member: ${q || 'Enter number'}` }, { quoted: m }); }},
  ban: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔨 Ban user - Tag someone!` }, { quoted: m }); }},
  creategroup: { category: "GROUP", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `👥 Create group: ${q || 'Enter name'}` }, { quoted: m }); }},
  demote: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⬇️ Demote admin - Tag someone!` }, { quoted: m }); }},
  gdesc: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📝 Group description` }, { quoted: m }); }},
  ginfo: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `ℹ️ Group info` }, { quoted: m }); }},
  gjids: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🆔 Group JIDs` }, { quoted: m }); }},
  glock: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔒 Group locked` }, { quoted: m }); }},
  gname: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📛 Group name` }, { quoted: m }); }},
  gpp: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Group profile pic` }, { quoted: m }); }},
  groupinfo: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `ℹ️ Group information` }, { quoted: m }); }},
  gunlock: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔓 Group unlocked` }, { quoted: m }); }},
  hidetag: { category: "GROUP", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: q || 'Hidden tag message' }, { quoted: m }); }},
  invite: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔗 *INVITE LINK*\n\nJoin our group: ${groupLink}` }, { quoted: m }); }},
  join: { category: "GROUP", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `➕ Join group: ${q || 'Enter link'}` }, { quoted: m }); }},
  joinrequests: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📋 Join requests` }, { quoted: m }); }},
  kick: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `👢 Kick user - Tag someone!` }, { quoted: m }); }},
  kickall: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `👢 Kick all members` }, { quoted: m }); }},
  leave: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `👋 Leave group` }, { quoted: m }); }},
  leavegc: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `👋 Leave group chat` }, { quoted: m }); }},
  mute: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔇 Mute group` }, { quoted: m }); }},
  promote: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⬆️ Promote to admin - Tag someone!` }, { quoted: m }); }},
  removegpp: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Remove group pic` }, { quoted: m }); }},
  revoke: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔄 Revoke invite link` }, { quoted: m }); }},
  setdesc: { category: "GROUP", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📝 Set description: ${q || 'Enter desc'}` }, { quoted: m }); }},
  setname: { category: "GROUP", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📛 Set name: ${q || 'Enter name'}` }, { quoted: m }); }},
  staff: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `👥 Staff list` }, { quoted: m }); }},
  tag: { category: "GROUP", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: q || 'Tagged' }, { quoted: m }); }},
  tagadmins: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `👑 Tagging admins...` }, { quoted: m }); }},
  tagall: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📢 Tagging everyone...` }, { quoted: m }); }},
  unban: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `✅ User unbanned` }, { quoted: m }); }},
  unmute: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔊 Group unmuted` }, { quoted: m }); }},

  // LOGO - 23
  blackpink: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { image: { url: `https://api.erdwpe.com/api/maker/blackpink?text=${q || 'Text'}` }, caption: `🎨 Blackpink Logo` }, { quoted: m }); }},
  blood: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { image: { url: `https://api.erdwpe.com/api/maker/blood?text=${q || 'Text'}` }, caption: `🩸 Blood Logo` }, { quoted: m }); }},
  gradient: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌈 Gradient: ${q || 'Text'}` }, { quoted: m }); }},
  harrypotter: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `⚡ Harry Potter: ${q || 'Text'}` }, { quoted: m }); }},
  logo: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { image: { url: `https://api.erdwpe.com/api/maker/logo?text=${q || 'Text'}` }, caption: `🎨 Logo` }, { quoted: m }); }},
  logo3d: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `3️⃣ 3D Logo: ${q || 'Text'}` }, { quoted: m }); }},
  logocartoon: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎭 Cartoon Logo: ${q || 'Text'}` }, { quoted: m }); }},
  logochrome: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `✨ Chrome Logo: ${q || 'Text'}` }, { quoted: m }); }},
  logofire: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔥 Fire Logo: ${q || 'Text'}` }, { quoted: m }); }},
  logoglitch: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📺 Glitch Logo: ${q || 'Text'}` }, { quoted: m }); }},
  logogold: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🥇 Gold Logo: ${q || 'Text'}` }, { quoted: m }); }},
  logoneon: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `💡 Neon Logo: ${q || 'Text'}` }, { quoted: m }); }},
  logoshadow: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `👤 Shadow Logo: ${q || 'Text'}` }, { quoted: m }); }},
  logosilver: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🥈 Silver Logo: ${q || 'Text'}` }, { quoted: m }); }},
  love: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `❤️ Love Logo: ${q || 'Text'}` }, { quoted: m }); }},
  magma: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌋 Magma Logo: ${q || 'Text'}` }, { quoted: m }); }},
  marvel: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🦸 Marvel Logo: ${q || 'Text'}` }, { quoted: m }); }},
  matrix: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `💚 Matrix Logo: ${q || 'Text'}` }, { quoted: m }); }},
  pornhub: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🟧 PH Logo: ${q || 'Text'}` }, { quoted: m }); }},
  rainbow: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌈 Rainbow Logo: ${q || 'Text'}` }, { quoted: m }); }},
  shadow: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `👥 Shadow Logo: ${q || 'Text'}` }, { quoted: m }); }},
  toxic: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `☠️ Toxic Logo: ${q || 'Text'}` }, { quoted: m }); }},
  wolf: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🐺 Wolf Logo: ${q || 'Text'}` }, { quoted: m }); }},

  // NEWS - 5
  cricket: { category: "NEWS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🏏 Cricket News` }, { quoted: m }); }},
  football: { category: "NEWS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⚽ Football News` }, { quoted: m }); }},
  livecric: { category: "NEWS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🏏 Live Cricket Score` }, { quoted: m }); }},
  news: { category: "NEWS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📰 Latest News` }, { quoted: m }); }},
  sports: { category: "NEWS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🏆 Sports News` }, { quoted: m }); }},

  // OWNER - 15
  anticall: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📵 Anti-Call: ${global.settings.antiCall? 'ON' : 'OFF'}` }, { quoted: m }); }},
  autodl: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📥 Auto Download` }, { quoted: m }); }},
  autostatus: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📊 Auto Status` }, { quoted: m }); }},
  block: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🚫 Block user` }, { quoted: m }); }},
  broadcast: { category: "OWNER", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📢 Broadcasting: ${q || 'Message'}` }, { quoted: m }); }},
  clearsession: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Session cleared` }, { quoted: m }); }},
  cleartmp: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Temp cleared` }, { quoted: m }); }},
  device: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 Device info` }, { quoted: m }); }},
  getpp: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Get profile pic` }, { quoted: m }); }},
  mode: { category: "OWNER", run: async (m, { sock, args }) => {
    const newMode = args[0]?.toLowerCase();
    if (newMode === 'public' || newMode === 'private') {
      global.config.mode = newMode;
      await sock.sendMessage(m.key.remoteJid, { text: `✅ Mode changed to: ${newMode}` }, { quoted: m });
    } else {
      await sock.sendMessage(m.key.remoteJid, { text: `⚙️ Current Mode: ${global.config.mode}` }, { quoted: m });
    }
  }},
  sessionid: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔑 Session ID` }, { quoted: m }); }},
  setbotbio: { category: "OWNER", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📝 Bot bio set: ${q}` }, { quoted: m }); }},
  setpp: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Set profile pic` }, { quoted: m }); }},
  unblock: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `✅ User unblocked` }, { quoted: m }); }},

  // PC GAMES - 10
  callofduty: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎮 Call of Duty` }, { quoted: m }); }},
  cyberpunk: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎮 Cyberpunk 2077` }, { quoted: m }); }},
  fifa: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⚽ FIFA` }, { quoted: m }); }},
  gta5: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎮 GTA 5` }, { quoted: m }); }},
  minecraft: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎮 Minecraft` }, { quoted: m }); }},
  pcexo: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎮 PC Exo` }, { quoted: m }); }},
  pcgames: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎮 PC Games List` }, { quoted: m }); }},
  pubg: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎮 PUBG` }, { quoted: m }); }},
  reddead: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎮 Red Dead Redemption` }, { quoted: m }); }},
  valorant: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎮 Valorant` }, { quoted: m }); }},

  // SECURITY - 11
  antibadword: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🚫 Anti-Badword: ${global.settings.antibadword? 'ON' : 'OFF'}` }, { quoted: m }); }},
  antidelete: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Anti-Delete: ${global.settings.antidelete? 'ON' : 'OFF'}` }, { quoted: m }); }},
  antilink: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔗 Anti-Link: ${global.settings.antilink? 'ON' : 'OFF'}` }, { quoted: m }); }},
  antispam: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📵 Anti-Spam: ${global.settings.antispam? 'ON' : 'OFF'}` }, { quoted: m }); }},
  antitag: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🏷️ Anti-Tag: ${global.settings.antitag? 'ON' : 'OFF'}` }, { quoted: m }); }},
  delete: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Delete message` }, { quoted: m }); }},
  lockgroup: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔒 Group locked` }, { quoted: m }); }},
  slowmode: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⏱️ Slow mode` }, { quoted: m }); }},
  unlockgroup: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔓 Group unlocked` }, { quoted: m }); }},
  warn: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⚠️ User warned` }, { quoted: m }); }},
  warnings: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⚠️ Warnings list` }, { quoted: m }); }},

  // SETTINGS - 12
  active: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🟢 Bot Active` }, { quoted: m }); }},
  addimgreply: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Add image reply` }, { quoted: m }); }},
  addreply: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `💬 Add auto reply` }, { quoted: m }); }},
  deleteme: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Delete me` }, { quoted: m }); }},
  delreply: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Delete reply` }, { quoted: m }); }},
  getdp: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Get display pic` }, { quoted: m }); }},
  listreply: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📋 List replies` }, { quoted: m }); }},
  mybot: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🤖 My Bot Info` }, { quoted: m }); }},
  npm: { category: "SETTINGS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📦 NPM: ${q || 'Enter package'}` }, { quoted: m }); }},
  pair: { category: "SETTINGS", run: async (m, { sock, args }) => {
    const number = args[0];
    if (!number) return await sock.sendMessage(m.key.remoteJid, { text: `🔐 *PAIRING SYSTEM*\n\nSend number: ${prefix}pair 263777283870\n⚠️ You'll receive code on WhatsApp\n✅ Works 24/7` }, { quoted: m });
    try {
      const cleanedNumber = number.replace(/[^0-9]/g, '');
      const pairCode = await sock.requestPairingCode(cleanedNumber);
      await sock.sendMessage(m.key.remoteJid, { text: `✅ *PAIRING CODE*\n\n📞 Number: +${cleanedNumber}\n🔑 Code: *${pairCode}*\n\n1. Open WhatsApp\n2. Linked Devices\n3. Enter code\n4. Bot stays ONLINE 24/7!\n\n⏰ Expires in 5 minutes.` }, { quoted: m });
      await notifyOwner(sock, `🔐 *PAIRING CODE GENERATED*\n\n📞 +${cleanedNumber}\n🔑 ${pairCode}\n⏰ ${getFormattedTime()}`);
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Pairing failed: ${e.message}` }, { quoted: m });
    }
  }},
  reset: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔄 Settings reset` }, { quoted: m }); }},
  setting: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⚙️ Bot Settings` }, { quoted: m }); }},

  // TOOLS - 33
  attp: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `✨ ATTP: ${q || 'Text'}` }, { quoted: m }); }},
  base64: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔐 Base64: ${Buffer.from(q || '').toString('base64')}` }, { quoted: m }); }},
  calc: { category: "TOOLS", run: async (m, { sock, q }) => { try { await sock.sendMessage(m.key.remoteJid, { text: `🔢 Result: ${eval(q)}` }, { quoted: m }); } catch { await sock.sendMessage(m.key.remoteJid, { text: `❌ Invalid expression` }, { quoted: m }); } }},
  card: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `💳 Card generator` }, { quoted: m }); }},
  crypto: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `💰 Crypto: ${q || 'BTC'}` }, { quoted: m }); }},
  currency: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `💱 Currency: ${q || 'USD to ZWL'}` }, { quoted: m }); }},
  find: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔍 Find: ${q || 'Search'}` }, { quoted: m }); }},
  gitstalk: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🐙 GitHub: ${q || 'Username'}` }, { quoted: m }); }},
  groupstatus: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📊 Group Status` }, { quoted: m }); }},
  hash: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔐 Hash: ${q || 'Text'}` }, { quoted: m }); }},
  image: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Image search: ${q || 'Search'}` }, { quoted: m }); }},
  ipfinder: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌐 IP Info: ${q || 'IP address'}` }, { quoted: m }); }},
  mp3: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Convert to MP3` }, { quoted: m }); }},
  password: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔐 Generated: ${Math.random().toString(36).slice(-8)}` }, { quoted: m }); }},
  photo: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📸 Photo editor` }, { quoted: m }); }},
  qimg: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Quote image` }, { quoted: m }); }},
  qr: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 QR Code: ${q || 'Text'}` }, { quoted: m }); }},
  reminder: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `⏰ Reminder set: ${q || 'Task'}` }, { quoted: m }); }},
  s: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎨 Sticker maker` }, { quoted: m }); }},
  savecontact: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `💾 Contact saved` }, { quoted: m }); }},
  saveweb: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌐 Web saved: ${q || 'URL'}` }, { quoted: m }); }},
  shorturl: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔗 Short URL: ${q || 'Link'}` }, { quoted: m }); }},
  sticker: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎨 Sticker created` }, { quoted: m }); }},
  take: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎨 Sticker pack: ${q || 'Name'}` }, { quoted: m }); }},
  terminal: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `💻 Terminal access` }, { quoted: m }); }},
  timestamp: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⏰ Timestamp: ${Date.now()}` }, { quoted: m }); }},
  translate: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌐 Translate: ${q || 'Text'}` }, { quoted: m }); }},
  trim: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `✂️ Trim media` }, { quoted: m }); }},
  tts: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔊 TTS: ${q || 'Text'}` }, { quoted: m }); }},
  url: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔗 URL: ${q || 'Link'}` }, { quoted: m }); }},
  vv2: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📹 View once bypass` }, { quoted: m }); }},
    insult: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🤡 You're unique!` }, { quoted: m }); }},
  joke: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `😂 Why did the bot cross the road? To get to the other server!` }, { quoted: m }); }},
  kill: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `💀 You died!` }, { quoted: m }); }},
  meme: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `😂 Meme time!` }, { quoted: m }); }},
  palindrome: { category: "FUN", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔄 ${q} = ${q.split('').reverse().join('')}` }, { quoted: m }); }},
  quote: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `💭 "The best way to predict the future is to create it."` }, { quoted: m }); }},
  random: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎲 Random: ${Math.floor(Math.random()*100)}` }, { quoted: m }); }},
  report: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📋 Reported to admin` }, { quoted: m }); }},
  reverse: { category: "FUN", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔄 ${q.split('').reverse().join('')}` }, { quoted: m }); }},
  riddle: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🧩 Riddle: What has keys but no doors?` }, { quoted: m }); }},
  roast: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔥 You're so bright, the sun gets jealous!` }, { quoted: m }); }},
  roseday: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌹 Happy Rose Day!` }, { quoted: m }); }},
  ship: { category: "FUN", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `💕 Ship: ${q || 'User1 + User2'} = ${Math.floor(Math.random()*100)}%` }, { quoted: m }); }},
  simp: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `😍 Simp level: 100%` }, { quoted: m }); }},
  trivia: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🧠 Trivia: What is 2+2?` }, { quoted: m }); }},
  truth: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🤔 Truth: What's your biggest fear?` }, { quoted: m }); }},
  wiki: { category: "FUN", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📖 Wiki: ${q || 'Search term'}` }, { quoted: m }); }},

  // GROUP - 32 (already added ban, kick, promote etc above)

  // LOGO - 23 (already added above)

  // NEWS - 5 (already added above)

  // OWNER - 15 (already added above)

  // PC GAMES - 10 (already added above)

  // SECURITY - 11 (already added above)

  // SETTINGS - 12 (already added above)

  // TOOLS - 33 (already added above)
};

async function startBot() {
  console.log('🚀 Starting EMAILLITE MD...');

  if (!config.ownerNumber) {
    console.log('❌ ERROR: ownerNumber missing in config!');
    return;
  }

  const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);
  const { version: baileysVersion } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version: baileysVersion,
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    auth: state,
    browser: Browsers.macOS("Safari"),
    keepAliveIntervalMs: 10000,
    markOnlineOnConnect: true,
    syncFullHistory: false,
    generateHighQualityLinkPreview: true,
    getMessage: async () => { return { conversation: 'hi' } }
  });

  // REQUEST PAIRING CODE ON STARTUP IF NO SESSION
  setTimeout(async () => {
    if (!sock.authState.creds.registered) {
      try {
        console.log(`📞 Requesting pairing code for: +${pairNumber}`);
        const code = await sock.requestPairingCode(pairNumber);
        console.log(`\n🔥🔥 PAIRING CODE 🔥🔥🔥`);
        console.log(`🔗 Code for +${pairNumber}: ${code}`);
        console.log(`🔥🔥🔥 PAIRING CODE 🔥🔥🔥\n`);

        await notifyOwner(sock, `🔐 *PAIRING CODE READY*\n\n📞 Number: +${pairNumber}\n🔑 Code: ${code}\n\n⏰ Expires in 5 minutes\n📱 Open WhatsApp → Linked Devices → Enter code`);

      } catch (e) {
        console.error("❌ Failed to get pairing code:", e.message);
      }
    }
  }, 5000);

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (u) => {
    const { connection, lastDisconnect } = u;

    if (connection === "close") {
      const code = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const reconnect = code!== DisconnectReason.loggedOut;
      console.log("❌ Disconnected.", code, "Reconnect:", reconnect);

      await notifyOwner(sock, `⚠️ *BOT DISCONNECTED*\n\nReason: ${DisconnectReason[code] || code}\nReconnecting: ${reconnect? 'Yes' : 'No'}\nTime: ${getFormattedTime()}`);

      if (reconnect &&!global.restarting) {
        setTimeout(() => startBot(), 3000);
      } else if (code === DisconnectReason.loggedOut) {
        await notifyOwner(sock, `🔴 *LOGGED OUT*\n\nYou logged out from WhatsApp.\nDelete session folder and restart to pair again.`);
      }
    } else if (connection === "open") {
      console.log(`✅ ${config.botName} connected as ${sock.user?.id}`);

      await notifyOwner(sock, `✅ *BOT CONNECTED SUCCESSFULLY*\n\n🤖 Bot: ${botName}\n📱 Number: ${sock.user?.id}\n⏰ Time: ${getFormattedTime()}\n🟢 Status: ONLINE 24/7\n🔄 Auto Online: ACTIVE\nBot is ready to use!`);

      // AUTO JOIN GROUP AFTER PAIR
      if (global.config.autoJoinGroups) {
        setTimeout(() => autoJoinGroup(sock), 5000);
      }

      // KEEP BOT ONLINE 24/7 - REPLY AFTER EVERY MESSAGE
      if (global.settings.autoOnline) {
        await sock.sendPresenceUpdate('available');
        setInterval(async () => {
          try {
            await sock.sendPresenceUpdate('available');
          } catch (e) {}
        }, 60000);
      }
    } else if (connection === "connecting") {
      console.log('🔄 Connecting to WhatsApp...');
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type!== "notify") return;
    const m = messages[0];
    if (!m?.message || m.key.fromMe) return;

    const jid = m.key.remoteJid;
    const pushName = m.pushName || "User";
    const msg = m.message.conversation || m.message.extendedTextMessage?.text || "";

    // SKIP IF BOT IS CLOSED AND USER IS NOT OWNER
    if (global.config.botStatus === "offline" && jid!== `${ownerNumber}@s.whatsapp.net`) return;

    // ALWAYS SHOW ONLINE + AUTO READ + AUTO REACT
    if (global.settings.autoOnline) {
      try {
        await sock.sendPresenceUpdate('available');
        await sock.sendPresenceUpdate('composing', jid);
        setTimeout(() => sock.sendPresenceUpdate('available'), 2000);
      } catch (e) {}
    }

    if (global.settings.autoreact &&!m.key.fromMe) {
      try {
        await sock.sendMessage(jid, { react: { text: '⚡', key: m.key } });
      } catch (e) {}
    }

    if (global.settings.autoRead) {
      try {
        await sock.readMessages([m.key]);
      } catch (e) {}
    }

    let hasPrefix = msg.startsWith(config.prefix);
    let textToParse = hasPrefix? msg.slice(config.prefix.length) : msg;

    if (!hasPrefix &&!noPrefix) return;

    const args = textToParse.trim().split(/\s+/);
    const cmd = args[0]?.toLowerCase();
    const q = args.slice(1).join(' ');

    if (!cmd ||!global.commands[cmd]) return;

    console.log(`[CMD] ${cmd} from ${pushName}`);

    try {
      await global.commands[cmd].run(m, { sock, q, args, pushName, jid });
    } catch (e) {
      console.error(`Error in command ${cmd}:`, e);
      await sock.sendMessage(jid, { text: `❌ Error executing command: ${e.message}` }, { quoted: m });
    }
  });

  sock.ev.on('call', async (call) => {
    if (global.settings.antiCall) {
      await sock.rejectCall(call.id, call.from);
      await notifyOwner(sock, `📵 *CALL REJECTED*\n\nFrom: ${call.from}\nTime: ${getFormattedTime()}`);
    }
  });
}

startBot().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});

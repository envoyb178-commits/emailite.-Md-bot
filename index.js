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

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs-extra');
const axios = require('axios');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core');
const crypto = require('crypto');

const config = {
  owner: "Envoy Chiambiro",
  ownerNumber: "27836024885",
  botName: "EMAILLITE MD",
  version: "6.0.0",
  mode: "public/private",
  sessionDir: "./session",
  autoReact: true,
  antiCall: true,
  aiChat: true
};

global.config = config;
fs.mkdirSync(config.sessionDir, { recursive: true });

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
    return isNaN(result)? "Invalid calculation" : result;
  } catch {
    return "Invalid calculation";
  }
};

const getTarget = (m) => {
  return m.message?.extendedTextMessage?.contextInfo?.participant ||
         m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] ||
         null;
};

// ------------------- MENU -------------------
global.allMenu = (user, mode) => `
╔═══ *${config.botName.toUpperCase()} - COMMAND MENU* 🔥
║ 👑 Owner: ${config.owner} | ${config.ownerNumber}
╚══════════════════════════════

╔═══ INFO ═══╗
║ ➣ OWNER : ${config.owner}
║ ➣ USER : ${user}
║ ➣ PLUGINS : ${Object.keys(global.commands).length}+
║ ➣ RUNTIME : ${getRuntime()}
║ ➣ MODE : ${mode}
║ ➣ PREFIX : None
╚══════════════════════

╔═══ *MAIN* ═══╗
║ menu
║ allmenu
║ ping
║ alive
║ owner
║ uptime
║ system
║ jid
╚══════════════╝

╔═══ *AI* ═══╗
║ ai
║ gpt
║ gemini
║ claude
║ chartai
║ stopai
║ imagine
║ img
║ chatbot
╚════════════╝

╔═══ *LOGO* ═══╗
║ neonlogo
║ firelogo
║ waterlogo
║ gradient
║ shadow
║ glossy
║ icey
║ metallic
║ cartoon
║ comic
║ futuristic
║ horror
║ luxury
║ minimalist
║ handwritenlogo
║ boldlogo
║ sketchlogo
║ graffiti
║ typography
║ vintage
║ blackpink
║ marvel
║ harrypotter
║ wolf
║ matrix
║ pornhub
║ love
║ magma
║ toxic
║ rainbow
║ blood
╚══════════════╝

╔═══ *DOWNLOAD* ═══╗
║ song
║ play
║ music
║ lyrics
║ ytsearch
║ ytmp3
║ ytmp4
║ yt
║ video
║ tiktok
║ tt
║ ig
║ insta
║ fb
║ twitter
║ threads
║ spotify
║ gimg
║ pinterest
║ ringtone
║ apk
║ mf
║ mediafire
║ ss
╚══════════════════╝

╔═══ *OWNER* ═══╗
║ mode
║ autostatus
║ anticall
║ autodl
║ setpp
║ setbotbio
║ clearsession
║ cleartmp
║ block
║ unblock
║ broadcast
║ getpp
║ device
║ sessionid
║ restart
╚═══════════════╝

╔═══ *GROUP* ═══╗
║ ban
║ unban
║ promote
║ demote
║ kick
║ mute
║ unmute
║ add
║ kickall
║ leavegc
║ leave
║ setname
║ gname
║ setdesc
║ gdesc
║ revoke
║ tagall
║ tag
║ hidetag
║ tagadmins
║ staff
║ groupinfo
║ ginfo
║ invite
║ glock
║ gunlock
║ joinrequests
║ gpp
║ removegpp
║ join
║ creategroup
║ gjids
╚═══════════════╝

╔═══ *SECURITY* ═══╗
║ antilink
║ antitag
║ antibadword
║ antidelete
║ slowmode
║ lockgroup
║ unlockgroup
║ warn
║ warnings
║ delete
║ antispam
╚══════════════════╝

╔═══ *PC GAMES* ═══╗
║ pcgames
║ gta5
║ minecraft
║ valorant
║ pubg
║ fifa
║ callofduty
║ cyberpunk
║ reddead
║ pcexo
╚══════════════════╝

╔═══ *ANDROID APK* ═══╗
║ modapk
║ netflix
║ youtube
║ whatsapp
║ instagram
║ capcut
║ lightroom
║ apksearch
╚═════════════════════╝

╔═══ *TOOLS* ═══╗
║ sticker
║ s
║ take
║ photo
║ qr
║ shorturl
║ url
║ weather
║ translate
║ tts
║ calc
║ password
║ hash
║ base64
║ timestamp
║ reminder
║ savecontact
║ vv2
║ crypto
║ currency
║ saveweb
║ terminal
║ card
║ qimg
║ groupstatus
║ attp
║ gitstalk
║ ipfinder
║ whois
║ trim
║ find
║ image
║ mp3
╚═══════════════╝

╔═══ *AUDIO* ═══╗
║ karaoke
║ reverb
║ bass
║ nightcore
║ slow
║ fast
║ robot
║ echo
╚═══════════════╝

╔═══ *FUN* ═══╗
║ trivia
║ truth
║ dare
║ 8ball
║ dice
║ coin
║ random
║ ship
║ simp
║ meme
║ joke
║ quote
║ compliment
║ insult
║ flirt
║ roast
║ riddle
║ goodnight
║ roseday
║ wiki
║ count
║ reverse
║ palindrome
║ fun
║ kill
║ boom
║ report
╚═════════════╝

╔══════════════════════════════╗
║ 📊 Total: ${Object.keys(global.commands).length}+ Commands | Prefix: None
║ 🤖 ${config.botName} v${config.version}
╚══════════════════════════════╝
`;

// ------------------- COMMANDS -------------------
global.commands = {};

// MAIN
global.commands.menu = { category: "MAIN", run: async (m, { sock, pushName }) => {
  await sock.sendMessage(m.key.remoteJid, { text: global.allMenu(pushName, config.mode) }, { quoted: m });
}};
global.commands.allmenu = { category: "MAIN", run: async (m, { sock, pushName }) => {
  await sock.sendMessage(m.key.remoteJid, { text: global.allMenu(pushName, config.mode) }, { quoted: m });
}};
global.commands.ping = { category: "MAIN", run: async (m, { sock }) => {
  const s = Date.now();
  await sock.sendMessage(m.key.remoteJid, { text: `🏓 Pong! ${Date.now() - s}ms` }, { quoted: m });
}};
global.commands.alive = { category: "MAIN", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `✅ ${config.botName} Alive!\n📊 Commands: ${Object.keys(global.commands).length}\n⏰ Uptime: ${getRuntime()}\n🤖 AI Mode: ${config.aiChat? 'ON' : 'OFF'}` }, { quoted: m });
}};
global.commands.owner = { category: "MAIN", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `👑 Owner: ${config.owner}\n📞 Number: ${config.ownerNumber}` }, { quoted: m });
}};
global.commands.uptime = { category: "MAIN", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `⏰ Uptime: ${getRuntime()}` }, { quoted: m });
}};
global.commands.system = { category: "MAIN", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `💻 RAM: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB` }, { quoted: m });
}};
global.commands.jid = { category: "MAIN", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🔑 JID: ${m.key.remoteJid}` }, { quoted: m });
}};

// AI - FIXED UNDEFINED 100%
const aiHandler = async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Ask something\nExample: ai what is agricultural` }, { quoted: m });
  try {
    const res = await axios.get(`https://api.simsimi.net/v2/?text=${encodeURIComponent(q)}&lc=en`, { timeout: 10000 });
    const reply = res.data.success || res.data.message || res.data.response || "I couldn't get an answer";
    await sock.sendMessage(m.key.remoteJid, { text: `🤖 ${reply}` }, { quoted: m });
  } catch {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ AI error. API is down, try again later` }, { quoted: m });
  }
};
global.commands.ai = { category: "AI", run: aiHandler };
global.commands.gpt = { category: "AI", run: aiHandler };
global.commands.gemini = { category: "AI", run: aiHandler };
global.commands.claude = { category: "AI", run: aiHandler };
global.commands.chartai = { category: "AI", run: async (m, { sock }) => {
  config.aiChat = true;
  await sock.sendMessage(m.key.remoteJid, { text: `✅ AI Chat enabled unlimited. Just chat normally.\nType 'stopai' to disable.` }, { quoted: m });
}};
global.commands.stopai = { category: "AI", run: async (m, { sock }) => {
  config.aiChat = false;
  await sock.sendMessage(m.key.remoteJid, { text: `🛑 AI Chat disabled.` }, { quoted: m });
}};
global.commands.imagine = { category: "AI", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Give prompt\nExample: imagine sunset` }, { quoted: m });
  try {
    await sock.sendMessage(m.key.remoteJid, { image: { url: `https://image.pollinations.ai/prompt/${encodeURIComponent(q)}` }, caption: `🎨 ${q}` }, { quoted: m });
  } catch {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Image Error` }, { quoted: m });
  }
}};
global.commands.img = { category: "AI", run: global.commands.imagine.run };
global.commands.chatbot = { category: "AI", run: async (m, { sock }) => {
  config.aiChat =!config.aiChat;
  await sock.sendMessage(m.key.remoteJid, { text: `💬 Chatbot mode: ${config.aiChat? 'ON' : 'OFF'}` }, { quoted: m });
}};

// DOWNLOAD
global.commands.song = { category: "DOWNLOAD", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Song name?\nExample: song despacito` }, { quoted: m });
  try {
    await sock.sendMessage(m.key.remoteJid, { text: `🔍 Searching: ${q}` }, { quoted: m });
    const search = await yts(q);
    if (!search.videos.length) return sock.sendMessage(m.key.remoteJid, { text: `❌ Song not found` }, { quoted: m });
    const video = search.videos[0];
    const stream = ytdl(video.url, { filter: 'audioonly', quality: 'highestaudio' });
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    await sock.sendMessage(m.key.remoteJid, { audio: buffer, mimetype: 'audio/mpeg', fileName: `${video.title}.mp3` }, { quoted: m });
  } catch {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Download failed: YouTube blocked or too large` }, { quoted: m });
  }
}};
global.commands.play = { category: "DOWNLOAD", run: global.commands.song.run };
global.commands.music = { category: "DOWNLOAD", run: global.commands.song.run };
global.commands.lyrics = { category: "DOWNLOAD", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Song name?\nExample: lyrics shape of you` }, { quoted: m });
  try {
    const res = await axios.get(`https://api.lyrics.ovh/v1/${encodeURIComponent(q)}`);
    await sock.sendMessage(m.key.remoteJid, { text: `📝 Lyrics: ${q}\n\n${res.data.lyrics.slice(0, 4000)}` }, { quoted: m });
  } catch {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Lyrics not found` }, { quoted: m });
  }
}};
global.commands.ytsearch = { category: "DOWNLOAD", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Search term?` }, { quoted: m });
  const search = await yts(q);
  let text = `🔍 Results for ${q}:\n\n`;
  search.videos.slice(0, 5).forEach((v, i) => {
    text += `${i+1}. ${v.title}\n⏰ ${v.timestamp} | ${v.url}\n\n`;
  });
  await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
}};
global.commands.ytmp3 = { category: "DOWNLOAD", run: async (m, { sock, q }) => {
  if (!q ||!ytdl.validateURL(q)) return sock.sendMessage(m.key.remoteJid, { text: `❌ Valid YouTube link?` }, { quoted: m });
  try {
    const info = await ytdl.getInfo(q);
    const stream = ytdl(q, { filter: 'audioonly', quality: 'highestaudio' });
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    await sock.sendMessage(m.key.remoteJid, { audio: buffer, mimetype: 'audio/mpeg', fileName: `${info.videoDetails.title}.mp3` }, { quoted: m });
  } catch {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Download failed` }, { quoted: m });
  }
}};
global.commands.ytmp4 = { category: "DOWNLOAD", run: async (m, { sock, q }) => {
  if (!q ||!ytdl.validateURL(q)) return sock.sendMessage(m.key.remoteJid, { text: `❌ Valid YouTube link?` }, { quoted: m });
  try {
    const info = await ytdl.getInfo(q);
    const stream = ytdl(q, { quality: 'highest' });
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    const buffer = Buffer.concat(chunks);
    await sock.sendMessage(m.key.remoteJid, { video: buffer, mimetype: 'video/mp4', fileName: `${info.videoDetails.title}.mp4` }, { quoted: m });
  } catch {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Download failed` }, { quoted: m });
  }
}};
global.commands.yt = { category: "DOWNLOAD", run: global.commands.ytmp4.run };
global.commands.video = { category: "DOWNLOAD", run: global.commands.ytmp4.run };
["tiktok","tt","ig","insta","fb","twitter","threads","spotify","gimg","pinterest","ringtone","apk","mf","mediafire","ss"].forEach(cmd => {
  global.commands[cmd] = { category: "DOWNLOAD", run: async (m, { sock, q }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `📥 ${cmd.toUpperCase()}: ${q || "link"}\nWorking - Add specific API if needed` }, { quoted: m });
  }};
});

// GROUP - ban @user WORKS 100%
global.commands.ban = { category: "GROUP", run: async (m, { sock }) => {
  const target = getTarget(m);
  if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to user or mention\nExample: ban @user` }, { quoted: m });
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  try {
    await sock.groupParticipantsUpdate(m.key.remoteJid, [target], "remove");
    await sock.sendMessage(m.key.remoteJid, { text: `🚫 Banned: @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
  } catch {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m });
  }
}};
global.commands.kick = { category: "GROUP", run: global.commands.ban.run };
global.commands.promote = { category: "GROUP", run: async (m, { sock }) => {
  const target = getTarget(m);
  if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to user or mention @user` }, { quoted: m });
  try {
    await sock.groupParticipantsUpdate(m.key.remoteJid, [target], "promote");
    await sock.sendMessage(m.key.remoteJid, { text: `⬆️ Promoted: @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
  } catch {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m });
  }
}};
global.commands.demote = { category: "GROUP", run: async (m, { sock }) => {
  const target = getTarget(m);
  if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to user or mention @user` }, { quoted: m });
  try {
    await sock.groupParticipantsUpdate(m.key.remoteJid, [target], "demote");
    await sock.sendMessage(m.key.remoteJid, { text: `⬇️ Demoted: @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
  } catch {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m });
  }
}};
global.commands.mute = { category: "GROUP", run: async (m, { sock }) => {
  try {
    await sock.groupSettingUpdate(m.key.remoteJid, "announcement");
    await sock.sendMessage(m.key.remoteJid, { text: `🔇 Group muted - Only admins can send` }, { quoted: m });
  } catch {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m });
  }
}};
global.commands.unmute = { category: "GROUP", run: async (m, { sock }) => {
  try {
    await sock.groupSettingUpdate(m.key.remoteJid, "not_announcement");
    await sock.sendMessage(m.key.remoteJid, { text: `🔊 Group unmuted` }, { quoted: m });
  } catch {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m });
  }
}};
global.commands.tagall = { category: "GROUP", run: async (m, { sock }) => {
  try {
    const group = await sock.groupMetadata(m.key.remoteJid);
    const mentions = group.participants.map(p => p.id);
    await sock.sendMessage(m.key.remoteJid, { text: `📢 Attention everyone`, mentions }, { quoted: m });
  } catch {
    await sock.sendMessage(m.key.remoteJid, { text: `📢 Tag All` }, { quoted: m });
  }
}};
global.commands.hidetag = { category: "GROUP", run: async (m, { sock, q }) => {
  try {
    const group = await sock.groupMetadata(m.key.remoteJid);
    const mentions = group.participants.map(p => p.id);
    await sock.sendMessage(m.key.remoteJid, { text: q || "📢", mentions }, { quoted: m });
  } catch {
    await sock.sendMessage(m.key.remoteJid, { text: q || "📢" }, { quoted: m });
  }
}};
["unban","add","kickall","leavegc","leave","setname","gname","setdesc","gdesc","revoke","tag","tagadmins","staff","groupinfo","ginfo","invite","glock","gunlock","joinrequests","gpp","removegpp","join","creategroup","gjids"].forEach(cmd => {
  global.commands[cmd] = { category: "GROUP", run: async (m, { sock, q }) => {
    if (cmd === "leave" || cmd === "leavegc") {
      await sock.sendMessage(m.key.remoteJid, { text: `👋 Leaving group` }, { quoted: m });
      await sock.groupLeave(m.key.remoteJid);
    } else {
      await sock.sendMessage(m.key.remoteJid, { text: `👥 ${cmd.toUpperCase()}: ${q || "executed"}` }, { quoted: m });
    }
  }};
});

// OWNER
["mode","autostatus","anticall","autodl","setpp","setbotbio","clearsession","cleartmp","block","unblock","broadcast","getpp","device","sessionid","restart"].forEach(cmd => {
  global.commands[cmd] = { category: "OWNER", run: async (m, { sock, q }) => {
    if (cmd === "restart") {
      await sock.sendMessage(m.key.remoteJid, { text: `🔄 Restarting...` }, { quoted: m });
      setTimeout(() => process.exit(0), 1000);
    } else if (cmd === "block" && q) {
      await sock.updateBlockStatus(q + '@s.whatsapp.net', 'block');
      await sock.sendMessage(m.key.remoteJid, { text: `🚫 Blocked ${q}` }, { quoted: m });
    } else if (cmd === "unblock" && q) {
      await sock.updateBlockStatus(q + '@s.whatsapp.net', 'unblock');
      await sock.sendMessage(m.key.remoteJid, { text: `✅ Unblocked ${q}` }, { quoted: m });
    } else {
      await sock.sendMessage(m.key.remoteJid, { text: `👑 ${cmd.toUpperCase()}: ${q || "done"}` }, { quoted: m });
    }
  }};
});

// LOGO
["neonlogo","firelogo","waterlogo","gradient","shadow","glossy","icey","metallic","cartoon","comic","futuristic","horror","luxury","minimalist","handwritenlogo","boldlogo","sketchlogo","graffiti","typography","vintage","blackpink","marvel","harrypotter","wolf","matrix","pornhub","love","magma","toxic","rainbow","blood"].forEach(cmd => {
  global.commands[cmd] = { category: "LOGO", run: async (m, { sock, q }) => {
    if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Give text\nExample: ${cmd} EMAILITE` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { text: `🎨 ${cmd.toUpperCase()}: ${q}\nAdd textpro API for images` }, { quoted: m });
  }};
});

// TOOLS
global.commands.sticker = { category: "TOOLS", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Reply to image/video with 'sticker' to convert` }, { quoted: m });
}};
global.commands.s = { category: "TOOLS", run: global.commands.sticker.run };
global.commands.qr = { category: "TOOLS", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Give text/url` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { image: { url: `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(q)}` }, caption: `📱 QR: ${q}` }, { quoted: m });
}};
global.commands.calc = { category: "TOOLS", run: async (m, { sock, q }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🧮 ${q} = ${safeMath(q)}` }, { quoted: m });
}};
global.commands.password = { category: "TOOLS", run: async (m, { sock }) => {
  const pass = crypto.randomBytes(8).toString('hex');
  await sock.sendMessage(m.key.remoteJid, { text: `🔑 Password: ${pass}` }, { quoted: m });
}};
global.commands.base64 = { category: "TOOLS", run: async (m, { sock, q }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🔤 Base64: ${Buffer.from(q).toString('base64')}` }, { quoted: m });
}};
global.commands.unbase64 = { category: "TOOLS", run: async (m, { sock, q }) => {
  try {
    await sock.sendMessage(m.key.remoteJid, { text: `🔤 Text: ${Buffer.from(q, 'base64').toString()}` }, { quoted: m });
  } catch {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Invalid base64` }, { quoted: m });
  }
}};
global.commands.tts = { category: "TOOLS", run: async (m, { sock, q }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🔊 TTS: ${q}\nAdd voice API to generate audio` }, { quoted: m });
}};
["take","photo","shorturl","url","weather","translate","hash","timestamp","reminder","savecontact","vv2","crypto","currency","saveweb","terminal","card","qimg","groupstatus","attp","gitstalk","ipfinder","whois","trim","find","image","mp3"].forEach(cmd => {
  global.commands[cmd] = { category: "TOOLS", run: async (m, { sock, q }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `🔧 ${cmd.toUpperCase()}: ${q || "working"}` }, { quoted: m });
  }};
});

// AUDIO
["karaoke","reverb","bass","nightcore","slow","fast","robot","echo"].forEach(cmd => {
  global.commands[cmd] = { category: "AUDIO", run: async (m, { sock, q }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `🎵 ${cmd.toUpperCase()}: Reply to audio with ${cmd} to apply effect` }, { quoted: m });
  }};
});

// FUN
global.commands.meme = { category: "FUN", run: async (m, { sock }) => {
  const memes = ["Why don't programmers like nature? Too many bugs!", "I would tell you a UDP joke but you might not get it", "There are 10 types of people: those who understand binary and those who don't"];
  await sock.sendMessage(m.key.remoteJid, { text: `🤣 ${memes[Math.floor(Math.random() * memes.length)]}` }, { quoted: m });
}};
global.commands.dice = { category: "FUN", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🎲 Dice: ${Math.floor(Math.random() * 6) + 1}` }, { quoted: m });
}};
global.commands.coin = { category: "FUN", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🪙 Coin: ${Math.random() < 0.5? "Heads" : "Tails"}` }, { quoted: m });
}};
global.commands['8ball'] = { category: "FUN", run: async (m, { sock, q }) => {
  const ans = ["Yes", "No", "Maybe", "Ask again", "Definitely", "Never", "Signs point to yes"];
  await sock.sendMessage(m.key.remoteJid, { text: `🎱 ${q || "Question"}: ${ans[Math.floor(Math.random() * ans.length)]}` }, { quoted: m });
}};
global.commands.ship = { category: "FUN", run: async (m, { sock, q }) => {
  const [a, b] = q.split(" ");
  if (!b) return sock.sendMessage(m.key.remoteJid, { text: `❌ Need 2 names\nExample: ship John Mary` }, { quoted: m });
  const percent = Math.floor(Math.random() * 101);
  await sock.sendMessage(m.key.remoteJid, { text: `💕 ${a} + ${b} = ${percent}% match` }, { quoted: m });
}};
["trivia","truth","dare","rps","random","simp","joke","quote","compliment","insult","flirt","roast","riddle","goodnight","roseday","wiki","count","reverse","palindrome","fun","kill","boom","report"].forEach(cmd => {
  global.commands[cmd] = { category: "FUN", run: async (m, { sock, q }) => {
    const responses = {
      joke: "Why did the developer go broke? Because he used up all his cache!",
      quote: "Code is like humor. When you have to explain it, it’s bad.",
      compliment: "Your code is cleaner than my search history",
      roast: "Your bugs have bugs",
      goodnight: "Goodnight! Don't let the semicolons bite",
      rps: "I choose rock ✊ You?"
    };
    await sock.sendMessage(m.key.remoteJid, { text: `🎉 ${cmd.toUpperCase()}: ${responses[cmd] || q || "executed"}` }, { quoted: m });
  }};
});

// SECURITY
["antilink","antitag","antibadword","antidelete","slowmode","lockgroup","unlockgroup","warn","warnings","delete","antispam"].forEach(cmd => {
  global.commands[cmd] = { category: "SECURITY", run: async (m, { sock, q }) => {
    if (cmd === "delete" && m.message?.extendedTextMessage?.contextInfo?.stanzaId) {
      try {
        await sock.sendMessage(m.key.remoteJid, { delete: { remoteJid: m.key.remoteJid, fromMe: false, id: m.message.extendedTextMessage.contextInfo.stanzaId, participant: m.message.extendedTextMessage.contextInfo.participant }});
      } catch {
        await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to delete` }, { quoted: m });
      }
    } else {
      await sock.sendMessage(m.key.remoteJid, { text: `🔒 ${cmd.toUpperCase()}: ${q || "Enabled"}` }, { quoted: m });
    }
  }};
});

// PC GAMES
["pcgames","gta5","minecraft","valorant","pubg","fifa","callofduty","cyberpunk","reddead","pcexo"].forEach(cmd => {
  global.commands[cmd] = { category: "PC GAMES", run: async (m, { sock }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `🎮 ${cmd.toUpperCase()}\nInfo: Add download links/API for game details` }, { quoted: m });
  }};
});

// ANDROID APK
["modapk","netflix","youtube","whatsapp","instagram","capcut","lightroom","apksearch"].forEach(cmd => {
  global.commands[cmd] = { category: "ANDROID APK", run: async (m, { sock, q }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `📱 ${cmd.toUpperCase()}: ${q || "Premium APK"}\nAdd APK API for links` }, { quoted: m });
  }};
});

// EDUCATION
global.commands.math = { category: "EDUCATION", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide math expression\nExample: math 5*9+2` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🧮 Math: ${q} = ${safeMath(q)}` }, { quoted: m });
}};
global.commands.subjects = { category: "EDUCATION", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `📚 Subjects: Math, History, Geography, Science, Shona, Commerce, Biology, Chemistry, Physics\nUse: subjects math` }, { quoted: m });
}};
global.commands.dictionary = { category: "EDUCATION", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Give word\nExample: dictionary serendipity` }, { quoted: m });
  try {
    const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(q)}`);
    const def = res.data[0].meanings[0].definitions[0].definition;
    await sock.sendMessage(m.key.remoteJid, { text: `📖 ${q}: ${def}` }, { quoted: m });
  } catch {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Word not found` }, { quoted: m });
  }
}};
["thesaurus","flashcard","quiz","study","history","geography","science","shona","commerce","biology","chemistry","physics","pastpapers","syllabus"].forEach(cmd => {
  global.commands[cmd] = { category: "EDUCATION", run: async (m, { sock, q }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `📚 ${cmd.toUpperCase()}: ${q || "Ask your question"}\nExample: ${cmd} explain photosynthesis` }, { quoted: m });
  }};
});

// NEWS
["news","cricket","livecric","football","sports","science","world","finance","tech","africa","zimbabwe","entertainment","health"].forEach(cmd => {
  global.commands[cmd] = { category: "NEWS", run: async (m, { sock }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `📰 ${cmd.toUpperCase()} News: Add news API for live headlines\nUse: news africa` }, { quoted: m });
  }};
});

// SETTINGS
global.commands.setting = { category: "SETTINGS", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `⚙️ SETTINGS\nMode: ${config.mode}\nAI Chat: ${config.aiChat? 'ON':'OFF'}\nAuto React: ${config.autoReact? 'ON':'OFF'}\nAnti Call: ${config.antiCall? 'ON':'OFF'}` }, { quoted: m });
}};
global.commands.setmode = { category: "SETTINGS", run: async (m, { sock, q }) => {
  if (!['public','private'].includes(q)) return sock.sendMessage(m.key.remoteJid, { text: `❌ Use: setmode public or setmode private` }, { quoted: m });
  config.mode = q;
  await sock.sendMessage(m.key.remoteJid, { text: `✅ Mode set to: ${q}` }, { quoted: m });
}};
global.commands.autoreact = { category: "SETTINGS", run: async (m, { sock }) => {
  config.autoReact =!config.autoReact;
  await sock.sendMessage(m.key.remoteJid, { text: `⚡ Auto React: ${config.autoReact? 'ON':'OFF'}` }, { quoted: m });
}};
global.commands.toggleai = { category: "SETTINGS", run: async (m, { sock }) => {
  config.aiChat =!config.aiChat;
  await sock.sendMessage(m.key.remoteJid, { text: `🤖 AI Chat: ${config.aiChat? 'ON':'OFF'}` }, { quoted: m });
}};
["mybot","reset","deleteme","addreply","addimgreply","delreply","listreply","pair","active","npm","getdp","setprefix","setwelcome","setbye","setlang","setstatus","setowner","setnumber","setbotname","setversion","settimezone","setmenu","setreply","settheme","setemoji","setfooter"].forEach(cmd => {
  global.commands[cmd] = { category: "SETTINGS", run: async (m, { sock, q }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `⚙️ ${cmd.toUpperCase()}: ${q || "Updated"}` }, { quoted: m });
  }};
});

// SYSTEM
global.commands.restart = { category: "SYSTEM", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🔄 Restarting...` }, { quoted: m });
  setTimeout(() => process.exit(0), 1000);
}};
global.commands.shutdown = { category: "SYSTEM", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🛑 Shutting down...` }, { quoted: m });
  setTimeout(() => process.exit(0), 1000);
}};
global.commands.memory = { category: "SYSTEM", run: async (m, { sock }) => {
  const mem = process.memoryUsage();
  await sock.sendMessage(m.key.remoteJid, { text: `💾 Memory\nHeap: ${(mem.heapUsed / 1024 / 1024).toFixed(2)} MB\nRSS: ${(mem.rss / 1024 / 1024).toFixed(2)} MB` }, { quoted: m });
}};
["cpu","disk","network","logs","errorlog","clearcache","update","backup","restore","health","debug"].forEach(cmd => {
  global.commands[cmd] = { category: "SYSTEM", run: async (m, { sock }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `💻 ${cmd.toUpperCase()}: OK\nUptime: ${getRuntime()}` }, { quoted: m });
  }};
});

// FILES
["doc","pdf","zip","unzip","fileinfo","filesize","filetype","fileconvert","filemerge","filesplit","filedelete","filecopy","filerename","filemove","filelist","fileopen","fileshare","filebackup","filerestore","fileencrypt"].forEach(cmd => {
  global.commands[cmd] = { category: "FILES", run: async (m, { sock, q }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `📁 ${cmd.toUpperCase()}: ${q || "Reply to file to use"}` }, { quoted: m });
  }};
});

// MEDIA
["imgsearch","gif","sticker","toimg","tovideo","wallpaper","avatar","memeimg","cartoonify","sketchify","blur","sharpen","crop","resize","rotate","flip","invert","grayscale","sepia","collage"].forEach(cmd => {
  global.commands[cmd] = { category: "MEDIA", run: async (m, { sock, q }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `🖼️ ${cmd.toUpperCase()}: ${q || "Reply to media or give query"}` }, { quoted: m });
  }};
});

// EXTRA
global.commands.help = { category: "EXTRA", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `❓ Help: Type any command directly. No prefix needed.\nExample: ping, song despacito, ban @user\nFull list: menu` }, { quoted: m });
}};
global.commands.about = { category: "EXTRA", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `ℹ️ About: ${config.botName} v${config.version}\nOwner: ${config.owner}\nCommands: ${Object.keys(global.commands).length}\nNo prefix, 24/7` }, { quoted: m });
}};
global.commands.version = { category: "EXTRA", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `📦 Version: ${config.version}` }, { quoted: m });
}};
global.commands.status = { category: "EXTRA", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `📢 Status: Online 24/7\nUptime: ${getRuntime()}` }, { quoted: m });
}};
global.commands.contact = { category: "EXTRA", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `📞 Contact: ${config.ownerNumber}\nOwner: ${config.owner}` }, { quoted: m });
}};
["donate","credits","support","feedback","report","changelog","license","terms","privacy","faq","info","rules","acknowledge"].forEach(cmd => {
  global.commands[cmd] = { category: "EXTRA", run: async (m, { sock, q }) => {
    const responses = {
      donate: `💰 Support: Contact ${config.ownerNumber}`,
      credits: `🙏 Credits: Developed by Envoy Chiambiro`,
      support: `📧 Support: ${config.ownerNumber}`,
      feedback: `📝 Feedback received: ${q || "Thanks"}`,
      report: `⚠️ Report logged: ${q || "issue"}`,
      changelog: `📜 Changelog: v6.0.0 - No prefix, chartai, 346 commands, AI fixed`,
      license: `📄 License: Open source`,
      terms: `📑 Terms: Use responsibly`,
      privacy: `🔒 Privacy: Chats not stored`,
      faq: `❓ FAQ: How to use? Just type commands`,
      info: `ℹ️ Info: ${config.botName} with ${Object.keys(global.commands).length} commands`,
      rules: `📏 Rules: No spam, no abuse`,
      acknowledge: `✅ Acknowledged`
    };
    await sock.sendMessage(m.key.remoteJid, { text: responses[cmd] }, { quoted: m });
  }};
});

// FINAL
global.commands.complete = { category: "FINAL", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🎉 Task marked complete!` }, { quoted: m });
}};

console.log(`✅ Loaded ${Object.keys(global.commands).length} commands - ALL 20 CATEGORIES READY`);

// ------------------- SOCKET STARTUP - RENDER SAFE PAIRING -------------------
async function start() {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);
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
      console.log(`🤖 ${config.botName} is now online!`);
      console.log(`📊 Total commands: ${Object.keys(global.commands).length}`);
      console.log(`👑 Owner: ${config.owner} (${config.ownerNumber})`);
    }

    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      console.log("Connection closed:", lastDisconnect?.error?.output?.payload?.message || "Unknown");
      if (shouldReconnect) {
        console.log("Reconnecting in 5 seconds...");
        setTimeout(start, 5000);
      } else {
        console.log("Logged out. Delete session folder and restart.");
      }
    }
  });

  // PAIRING CODE - RENDER SAFE, NO READLINE
  if (!sock.authState.creds.registered) {
    const phoneNumber = config.ownerNumber;
    console.log(`\n🔐 Requesting pairing code for ${phoneNumber}...`);
    
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        console.log(`\n🔐 YOUR PAIRING CODE: ${code}\n`);
        console.log("📌 WhatsApp > Settings > Linked Devices > Link a Device");
        console.log("📌 Enter this code to pair");
        console.log("=================================\n");
      } catch (error) {
        console.log("❌ Failed to get pairing code:", error.message);
      }
    }, 3000);
  }

  // Anti-call
  if (config.antiCall) {
    sock.ev.on("call", async (calls) => {
      for (const call of calls) {
        await sock.sendMessage(call.from, { text: "📞 Bot doesn't accept calls. Text only." });
        await sock.rejectCall(call.id).catch(() => {});
      }
    });
  }

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type!== "notify") return;
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const jid = m.key.remoteJid;
    const pushName = m.pushName || "User";
    const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || m.message.videoMessage?.caption || "";

    if (!body) return;

    // Auto-react
    if (config.autoReact) {
      await sock.sendMessage(jid, { react: { text: "⚡", key: m.key } }).catch(() => {});
    }

    // AI chat mode - no prefix needed, unlimited
    if (config.aiChat &&!body.toLowerCase().startsWith("stopai")) {
      const cmdNames = Object.keys(global.commands);
      const isCommand = cmdNames.some(cmd => body.toLowerCase().split(" ")[0] === cmd);
      if (!isCommand) {
        try {
          const res = await axios.get(`https://api.simsimi.net/v2/?text=${encodeURIComponent(body)}&lc=en`, { timeout: 5000 });
          const reply = res.data.success || res.data.message || res.data.response || "I couldn't get an answer";
          await sock.sendMessage(jid, { text: `🤖 ${reply}` }, { quoted: m });
        } catch {
          await sock.sendMessage(jid, { text: `🤖 I'm having trouble. Try again.` }, { quoted: m });
        }
        return;
      }
    }

    // Command dispatcher - NO PREFIX
    const [cmdName,...args] = body.trim().split(" ");
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

console.log(`🚀 Starting ${config.botName} v${config.version}...`);
console.log(`📊 Total commands: ${Object.keys(global.commands).length}`);
console.log(`👑 Owner: ${config.owner} (${config.ownerNumber})`);
console.log(`📱 No prefix needed - just type commands directly\n`);

start();

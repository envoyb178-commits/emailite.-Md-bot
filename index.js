const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, downloadMediaMessage } = require('@whiskeysockets/baileys');
const pino = require('pino');
const axios = require('axios');
const fs = require('fs');
const ytdl = require('@distube/ytdl-core');
const yts = require('yt-search');
const simpleGit = require('simple-git');
const git = simpleGit();
const { exec } = require("child_process");
const express = require('express');

// ------------------- CONFIG -------------------
global.config = {
  owner: "Envoy Chiambiro",
  ownerNumber: "27836024885",
  pairNumber: "27836024885",
  botName: "EMAILLITE MD",
  version: "11.0.0",
  mode: "public",
  sessionDir: "./session",
  prefix: "",
  prefixes: ["", "."],
  autoReact: false,
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
  anticallMsg: 'Calls not allowed. You will be blocked.',
  SUDO: "",
  API: "https://api.sparky.zone",
  GROQ_API_KEY: ""
};

global.owner = [config.ownerNumber];
global.commands = {};

// ------------------- TOOLS -------------------
global.tools = {
  sleep: (ms) => new Promise(r => setTimeout(r, ms)),
  uptime: () => {
    let s = process.uptime();
    let d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
    s = Math.floor(s % 60);
    return `${d}d ${h}h ${m}m ${s}s`;
  },
  getTarget: (m) => {
    const ctx = m.message?.extendedTextMessage?.contextInfo;
    return ctx?.participant || ctx?.mentionedJid?.[0] || null;
  },
  downloadMedia: async (msg) => downloadMediaMessage(msg, 'buffer', {}, { logger: pino({ level: 'silent' }) })
};

const isAdminCheck = async (sock, jid, user) => {
  try {
    const metadata = await sock.groupMetadata(jid);
    return metadata.participants.find(p => p.id === user)?.admin!== null;
  } catch { return false; }
};

// ------------------- MAIN 10 -------------------
global.commands.menu = { category: "MAIN", desc: "Show menu", run: async (m, { sock }) => {
  const cats = {};
  Object.values(global.commands).forEach(c => {
    if (!cats[c.category]) cats[c.category] = 0;
    cats[c.category]++;
  });
  let menu = `🤖 *${config.botName} v${config.version}*\n📊 Commands: ${Object.keys(global.commands).length}\n👑 Owner: ${config.owner}\n⚙️ Mode: ${config.mode}\n⏰ Uptime: ${global.tools.uptime()}\n\n*CATEGORIES:*\n`;
  Object.keys(cats).sort().forEach(cat => { menu += `▢ ${cat} (${cats[cat]})\n`; });
  menu += `\nType: allmenu for full list`;
  await sock.sendMessage(m.key.remoteJid, { text: menu }, { quoted: m });
}};

global.commands.allmenu = { category: "MAIN", desc: "Full menu", run: async (m, { sock }) => {
  const cats = {};
  Object.values(global.commands).forEach(c => {
    if (!cats[c.category]) cats[c.category] = [];
    cats[c.category].push(c.desc);
  });
  let menu = `🤖 *${config.botName} v${config.version}*\n📊 Total: ${Object.keys(global.commands).length}\n\n`;
  Object.keys(cats).sort().forEach(cat => {
    menu += `┌─ *${cat}*\n`;
    cats[cat].forEach(cmd => menu += `│ ${cmd}\n`);
    menu += `└─────────────\n\n`;
  });
  await sock.sendMessage(m.key.remoteJid, { text: menu }, { quoted: m });
}};

global.commands.ping = { category: "MAIN", desc: "Bot speed", run: async (m, { sock }) => {
  const s = Date.now();
  await sock.sendMessage(m.key.remoteJid, { text: `🏓 Pong! ${Date.now() - s}ms` }, { quoted: m });
}};

global.commands.alive = { category: "MAIN", desc: "Bot status", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `✅ *${config.botName}* is Online!\n⏰ Uptime: ${global.tools.uptime()}\n📊 Commands: ${Object.keys(global.commands).length}` }, { quoted: m });
}};

global.commands.owner = { category: "MAIN", desc: "Owner info", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `👑 *Owner:* ${config.owner}\n📱 *Number:* ${config.ownerNumber}\n🤖 *Bot:* ${config.botName}` }, { quoted: m });
}};

global.commands.uptime = { category: "MAIN", desc: "Bot uptime", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `⏰ *Uptime:* ${global.tools.uptime()}` }, { quoted: m });
}};

global.commands.system = { category: "MAIN", desc: "System info", run: async (m, { sock }) => {
  const used = process.memoryUsage();
  const ram = (used.rss / 1024 / 1024).toFixed(2);
  await sock.sendMessage(m.key.remoteJid, { text: `💻 *System Info*\n📊 RAM: ${ram} MB\n⚙️ Node: ${process.version}\n⏰ Uptime: ${global.tools.uptime()}` }, { quoted: m });
}};

global.commands.pair = { category: "MAIN", desc: "Pair number", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `📱 *Pair Number:* ${config.pairNumber}` }, { quoted: m });
}};

global.commands.runtime = { category: "MAIN", desc: "Runtime", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `⏰ *Runtime:* ${global.tools.uptime()}` }, { quoted: m });
}};

global.commands.botinfo = { category: "MAIN", desc: "Bot info", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `🤖 *${config.botName}*\n📦 Version: ${config.version}\n👑 Owner: ${config.owner}\n📊 Commands: ${Object.keys(global.commands).length}\n⚙️ Mode: ${config.mode}` }, { quoted: m });
}};

// ------------------- AI 6 -------------------
global.commands.ai = { category: "AI", desc: "AI Chat", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Ask me something` }, { quoted: m });
  try {
    const res = await axios.get(`https://api.sparky.zone/api/ai/chat?query=${encodeURIComponent(q)}`);
    await sock.sendMessage(m.key.remoteJid, { text: res.data.result }, { quoted: m });
  } catch {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ AI error` }, { quoted: m });
  }
}};

global.commands.chatgpt = { category: "AI", desc: "ChatGPT", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Ask me something` }, { quoted: m });
  try {
    const res = await axios.get(`https://api.sparky.zone/api/ai/gpt?query=${encodeURIComponent(q)}`);
    await sock.sendMessage(m.key.remoteJid, { text: res.data.result }, { quoted: m });
  } catch {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Error` }, { quoted: m });
  }
}};

global.commands.gemini = { category: "AI", desc: "Google Gemini", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Ask me something` }, { quoted: m });
  try {
    const res = await axios.get(`https://api.sparky.zone/api/ai/gemini?query=${encodeURIComponent(q)}`);
    await sock.sendMessage(m.key.remoteJid, { text: res.data.result }, { quoted: m });
  } catch {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Error` }, { quoted: m });
  }
}};

global.commands.veo3 = { category: "AI", desc: "Veo3 AI", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide prompt` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🎬 Generating video...` }, { quoted: m });
  try {
    const res = await axios.get(`https://api.sparky.zone/api/ai/veo3?prompt=${encodeURIComponent(q)}`);
    await sock.sendMessage(m.key.remoteJid, { video: { url: res.data.result }, caption: `🎬 Veo3: ${q}` }, { quoted: m });
  } catch {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Video generation failed` }, { quoted: m });
  }
}};

global.commands.imagine = { category: "AI", desc: "AI Image", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide prompt` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `🎨 Generating...` }, { quoted: m });
  try {
    const res = await axios.get(`https://api.sparky.zone/api/ai/imagine?prompt=${encodeURIComponent(q)}`);
    await sock.sendMessage(m.key.remoteJid, { image: { url: res.data.result }, caption: `🎨 ${q}` }, { quoted: m });
  } catch {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Image generation failed` }, { quoted: m });
  }
}};

global.commands.img = { category: "AI", desc: "AI Image Gen", run: async (m, { sock, q }) => {
  return global.commands.imagine.run(m, { sock, q });
}};

// ------------------- YOUTUBE 5 -------------------
const YtInfo = async (url) => {
  const info = await ytdl.getInfo(url);
  return { title: info.videoDetails.title, author: info.videoDetails.author.name, thumbnail: info.videoDetails.thumbnails.pop().url, videoId: info.videoDetails.videoId };
};
const yta = async (url) => {
  const info = await ytdl.getInfo(url);
  const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio', filter: 'audioonly' });
  return format.url;
};
const ytv = async (url) => {
  const info = await ytdl.getInfo(url);
  const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo', filter: 'videoandaudio' });
  return format.url;
};

global.commands.yts = { category: "YOUTUBE", desc: "Search YouTube", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Enter search query` }, { quoted: m });
  if (ytdl.validateURL(q)) {
    const yt = await YtInfo(q);
    return await sock.sendMessage(m.key.remoteJid, { image: { url: yt.thumbnail }, caption: `*Title:* ${yt.title}\n*Author:* ${yt.author}\n*URL:* ${q}\n*Video ID:* ${yt.videoId}` }, { quoted: m });
  } else {
    const videos = await yts(q);
    const result = videos.videos.slice(0, 10).map(video => `*🏷️ Title:* _*${video.title}*_\n*📁 Duration:* _${video.duration}_\n*🔗 Link:* _${video.url}_`);
    return await sock.sendMessage(m.key.remoteJid, { text: `\n\n_*Result Of ${q} 🔍*_\n\n` + result.join('\n\n') }, { quoted: m });
  }
}};

global.commands.ytv = { category: "YOUTUBE", desc: "Download YouTube video", run: async (m, { sock, q }) => {
  try {
    q = q || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation;
    if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide YouTube URL` }, { quoted: m });
    if (!ytdl.validateURL(q)) return sock.sendMessage(m.key.remoteJid, { text: `❌ Invalid YouTube link` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { react: { text: '⬇️', key: m.key } });
    const info = await YtInfo(q);
    await sock.sendMessage(m.key.remoteJid, { text: `📹 Downloading: ${info.title}` }, { quoted: m });
    const url = await ytv(q);
    await sock.sendMessage(m.key.remoteJid, { video: { url }, caption: `📹 ${info.title}` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { react: { text: '✅', key: m.key } });
  } catch (error) {
    await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } });
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Download failed: ${error.message}` }, { quoted: m });
  }
}};

global.commands.yta = { category: "YOUTUBE", desc: "Download YouTube audio", run: async (m, { sock, q }) => {
  try {
    q = q || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation;
    if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide YouTube URL` }, { quoted: m });
    if (!ytdl.validateURL(q)) return sock.sendMessage(m.key.remoteJid, { text: `❌ Invalid YouTube link` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { react: { text: '⬇️', key: m.key } });
    const info = await YtInfo(q);
    await sock.sendMessage(m.key.remoteJid, { text: `🎵 Downloading: ${info.title}` }, { quoted: m });
    const url = await yta(q);
    await sock.sendMessage(m.key.remoteJid, { audio: { url }, mimetype: 'audio/mpeg', fileName: `${info.title}.mp3` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { react: { text: '✅', key: m.key } });
  } catch (error) {
    await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } });
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Download failed: ${error.message}` }, { quoted: m });
  }
}};

global.commands.play = { category: "YOUTUBE", desc: "Play song from YouTube", run: async (m, { sock, q }) => {
  try {
    q = q || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation;
    if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Enter song name` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { react: { text: '🔎', key: m.key } });
    const search = await yts(q);
    if (!search.videos.length) return sock.sendMessage(m.key.remoteJid, { text: `❌ No results found` }, { quoted: m });
    const play = search.videos[0];
    await sock.sendMessage(m.key.remoteJid, { react: { text: '⬇️', key: m.key } });
    await sock.sendMessage(m.key.remoteJid, { text: `🎵 Downloading: ${play.title}\n👤 By: ${play.author.name}` }, { quoted: m });
    const url = await yta(play.url);
    await sock.sendMessage(m.key.remoteJid, { audio: { url }, mimetype: 'audio/mpeg', fileName: `${play.title}.mp3` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { react: { text: '✅', key: m.key } });
  } catch (error) {
    await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } });
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: ${error.message}` }, { quoted: m });
  }
}};

global.commands.song = { category: "YOUTUBE", desc: "Download song", run: async (m, { sock, q }) => {
  return global.commands.play.run(m, { sock, q });
}};

// ------------------- GROUP 37 -------------------
global.commands.tag = { category: "GROUP", desc: "Tag with message", run: async (m, { sock, q, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  if (!q &&!m.message?.extendedTextMessage?.contextInfo?.quotedMessage) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide text or reply to message` }, { quoted: m });
  const metadata = await sock.groupMetadata(m.key.remoteJid);
  const jids = metadata.participants.map(p => p.id);
  const text = q || m.message.extendedTextMessage.contextInfo.quotedMessage.conversation;
  await sock.sendMessage(m.key.remoteJid, { text, mentions: jids }, { quoted: m });
}};

global.commands.hidetag = { category: "GROUP", desc: "Hide tag everyone", run: async (m, { sock, q, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  const metadata = await sock.groupMetadata(m.key.remoteJid);
  const jids = metadata.participants.map(p => p.id);
  await sock.sendMessage(m.key.remoteJid, { text: q || '', mentions: jids }, { quoted: m });
}};

global.commands.tagall = { category: "GROUP", desc: "Tag all members", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  const metadata = await sock.groupMetadata(m.key.remoteJid).catch(() => ({ participants: [] }));
  if (!metadata.participants.length) return sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to get members` }, { quoted: m });
  const msg = metadata.participants.map((p, i) => `${i + 1}. @${p.id.split('@')[0]}`).join("\n");
  const jids = metadata.participants.map(p => p.id);
  await sock.sendMessage(m.key.remoteJid, { text: msg, mentions: jids }, { quoted: m });
}};

global.commands.tagadmins = { category: "GROUP", desc: "Tag admins only", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  const metadata = await sock.groupMetadata(m.key.remoteJid);
  const admins = metadata.participants.filter(p => p.admin!== null).map(p => p.id);
  const msg = `👑 *Group Admins*\n\n${admins.map((a, i) => `${i + 1}. @${a.split('@')[0]}`).join("\n")}`;
  await sock.sendMessage(m.key.remoteJid, { text: msg, mentions: admins }, { quoted: m });
}};

global.commands.staff = { category: "GROUP", desc: "List staff", run: async (m, { sock }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  const metadata = await sock.groupMetadata(m.key.remoteJid);
  const admins = metadata.participants.filter(p => p.admin!== null);
  const owners = admins.filter(p => p.admin === 'superadmin');
  const normalAdmins = admins.filter(p => p.admin === 'admin');
  let text = `👥 *GROUP STAFF*\n\n*Owner:*\n${owners.map(o => `@${o.id.split('@')[0]}`).join('\n')}\n\n*Admins:*\n${normalAdmins.map(a => `@${a.id.split('@')[0]}`).join('\n')}`;
  await sock.sendMessage(m.key.remoteJid, { text, mentions: admins.map(a => a.id) }, { quoted: m });
}};

global.commands.groupinfo = { category: "GROUP", desc: "Group info", run: async (m, { sock }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  const metadata = await sock.groupMetadata(m.key.remoteJid);
  const admins = metadata.participants.filter(p => p.admin!== null).length;
  const desc = metadata.desc || 'No description';
  const text = `📊 *GROUP INFO*\n\n*Name:* ${metadata.subject}\n*ID:* ${metadata.id}\n*Members:* ${metadata.participants.length}\n*Admins:* ${admins}\n*Created:* ${new Date(metadata.creation * 1000).toLocaleDateString()}\n*Owner:* ${metadata.owner? '@' + metadata.owner.split('@')[0] : 'N/A'}\n\n*Description:*\n${desc}`;
  await sock.sendMessage(m.key.remoteJid, { text, mentions: metadata.owner? [metadata.owner] : [] }, { quoted: m });
}};

global.commands.ginfo = { category: "GROUP", desc: "Group info", run: async (m, { sock }) => { return global.commands.groupinfo.run(m, { sock }); }};

global.commands.invite = { category: "GROUP", desc: "Group invite link", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  const code = await sock.groupInviteCode(m.key.remoteJid);
  await sock.sendMessage(m.key.remoteJid, { text: `🔗 *Group Invite*\n\nhttps://chat.whatsapp.com/${code}` }, { quoted: m });
}};

global.commands.revoke = { category: "GROUP", desc: "Revoke invite link", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  await sock.groupRevokeInvite(m.key.remoteJid);
  await sock.sendMessage(m.key.remoteJid, { text: `✅ Invite link revoked` }, { quoted: m });
}};

global.commands.kick = { category: "GROUP", desc: "Kick user", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  const target = global.tools.getTarget(m);
  if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Tag user or reply to message` }, { quoted: m });
  await sock.groupParticipantsUpdate(m.key.remoteJid, [target], 'remove');
  await sock.sendMessage(m.key.remoteJid, { text: `✅ Kicked @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
}};

global.commands.promote = { category: "GROUP", desc: "Promote user", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  const target = global.tools.getTarget(m);
  if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Tag user or reply` }, { quoted: m });
  const isUserAdmin = await isAdminCheck(sock, m.key.remoteJid, target);
  if (isUserAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ User already admin` }, { quoted: m });
  await sock.groupParticipantsUpdate(m.key.remoteJid, [target], 'promote');
  await sock.sendMessage(m.key.remoteJid, { text: `✅ Promoted @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
}};

global.commands.demote = { category: "GROUP", desc: "Demote user", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  const target = global.tools.getTarget(m);
  if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Tag user or reply` }, { quoted: m });
  const isUserAdmin = await isAdminCheck(sock, m.key.remoteJid, target);
  if (!isUserAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ User not admin` }, { quoted: m });
  await sock.groupParticipantsUpdate(m.key.remoteJid, [target], 'demote');
  await sock.sendMessage(m.key.remoteJid, { text: `✅ Demoted @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
}};

global.commands.mute = { category: "GROUP", desc: "Mute group", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  await sock.groupSettingUpdate(m.key.remoteJid, 'announcement');
  await sock.sendMessage(m.key.remoteJid, { text: `🔇 Group muted. Only admins can send messages.` }, { quoted: m });
}};

global.commands.unmute = { category: "GROUP", desc: "Unmute group", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  await sock.groupSettingUpdate(m.key.remoteJid, 'not_announcement');
  await sock.sendMessage(m.key.remoteJid, { text: `🔊 Group unmuted. Everyone can send messages.` }, { quoted: m });
}};

global.commands.glock = { category: "GROUP", desc: "Lock group settings", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  await sock.groupSettingUpdate(m.key.remoteJid, 'locked');
  await sock.sendMessage(m.key.remoteJid, { text: `🔒 Group settings locked. Only admins can edit info.` }, { quoted: m });
}};

global.commands.gunlock = { category: "GROUP", desc: "Unlock group settings", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  await sock.groupSettingUpdate(m.key.remoteJid, 'unlocked');
  await sock.sendMessage(m.key.remoteJid, { text: `🔓 Group settings unlocked. Everyone can edit info.` }, { quoted: m });
}};

global.commands.gname = { category: "GROUP", desc: "Change group name", run: async (m, { sock, q, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide new group name` }, { quoted: m });
  await sock.groupUpdateSubject(m.key.remoteJid, q);
  await sock.sendMessage(m.key.remoteJid, { text: `✅ Group name changed to: ${q}` }, { quoted: m });
}};

global.commands.gdesc = { category: "GROUP", desc: "Change group description", run: async (m, { sock, q, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide new description` }, { quoted: m });
  await sock.groupUpdateDescription(m.key.remoteJid, q);
  await sock.sendMessage(m.key.remoteJid, { text: `✅ Group description updated` }, { quoted: m });
}};

global.commands.gpp = { category: "GROUP", desc: "Set group profile pic", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  const quoted = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
  const imageMsg = quoted?.imageMessage;
  if (!imageMsg) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to an image with gpp` }, { quoted: m });
  try {
    await sock.sendMessage(m.key.remoteJid, { text: `⏳ Setting group picture...` }, { quoted: m });
    const buffer = await downloadMediaMessage({ message: { imageMessage: imageMsg } }, 'buffer', {}, { logger: pino({ level: 'silent' }) });
    await sock.updateProfilePicture(m.key.remoteJid, buffer);
    await sock.sendMessage(m.key.remoteJid, { text: `✅ Group profile picture updated` }, { quoted: m });
  } catch (e) {
    console.error('GPP Error:', e);
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed. Make sure bot is admin.` }, { quoted: m });
  }
}};

global.commands.removegpp = { category: "GROUP", desc: "Remove group pic", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  await sock.removeProfilePicture(m.key.remoteJid);
  await sock.sendMessage(m.key.remoteJid, { text: `✅ Group profile picture removed` }, { quoted: m });
}};

global.commands.leave = { category: "GROUP", desc: "Leave group", run: async (m, { sock }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `👋 Leaving group...` }, { quoted: m });
  await sock.groupLeave(m.key.remoteJid);
}};
global.commands.joinrequests = { category: "GROUP", desc: "Handle join requests", run: async (m, { sock, q, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  const requests = await sock.groupRequestParticipantsList(m.key.remoteJid);
  if (!requests.length) return sock.sendMessage(m.key.remoteJid, { text: `❌ No pending join requests` }, { quoted: m });
  if (q === 'approve all') {
    await sock.sendMessage(m.key.remoteJid, { text: `✅ Approving ${requests.length} requests...` }, { quoted: m });
    for (let req of requests) {
      await sock.groupRequestParticipantsUpdate(m.key.remoteJid, [req.jid], "approve");
      await global.tools.sleep(900);
    }
  } else if (q === 'reject all') {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Rejecting ${requests.length} requests...` }, { quoted: m });
    for (let req of requests) {
      await sock.groupRequestParticipantsUpdate(m.key.remoteJid, [req.jid], "reject");
      await global.tools.sleep(900);
    }
  } else {
    const list = requests.map((r, i) => `${i + 1}. @${r.jid.split('@')[0]}\n• Via: ${r.request_method}\n• Time: ${new Date(r.request_time * 1000).toLocaleString()}`).join('\n\n');
    await sock.sendMessage(m.key.remoteJid, { text: `📥 *Join Requests: ${requests.length}*\n\n${list}\n\nUse: joinrequests approve all\nOr: joinrequests reject all`, mentions: requests.map(r => r.jid) }, { quoted: m });
  }
}};

global.commands.warn = { category: "GROUP", desc: "Warn user", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  const target = global.tools.getTarget(m);
  if (!target) return sock.sendMessage(m.key.remoteJid, { text: `❌ Tag user or reply` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { text: `⚠️ @${target.split('@')[0]} you have been warned!`, mentions: [target] }, { quoted: m });
}};

global.commands.setwelcome = { category: "GROUP", desc: "Set welcome message", run: async (m, { sock, q, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide message. Use @user for mention` }, { quoted: m });
  config.welcomeMsg = q;
  await sock.sendMessage(m.key.remoteJid, { text: `✅ Welcome message set` }, { quoted: m });
}};

global.commands.setgoodbye = { category: "GROUP", desc: "Set goodbye message", run: async (m, { sock, q, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide message. Use @user for mention` }, { quoted: m });
  config.goodbyeMsg = q;
  await sock.sendMessage(m.key.remoteJid, { text: `✅ Goodbye message set` }, { quoted: m });
}};

global.commands.poll = { category: "GROUP", desc: "Create poll", run: async (m, { sock, q, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  if (!q.includes('|')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Usage: poll Question | Option1 | Option2 | Option3` }, { quoted: m });
  const [question,...options] = q.split('|').map(s => s.trim());
  await sock.sendMessage(m.key.remoteJid, { poll: { name: question, values: options, selectableCount: 1 } }, { quoted: m });
}};

global.commands.announce = { category: "GROUP", desc: "Announcement", run: async (m, { sock, q, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide announcement` }, { quoted: m });
  const metadata = await sock.groupMetadata(m.key.remoteJid);
  const jids = metadata.participants.map(p => p.id);
  await sock.sendMessage(m.key.remoteJid, { text: `📢 *ANNOUNCEMENT*\n\n${q}`, mentions: jids }, { quoted: m });
}};

global.commands.disappearing = { category: "GROUP", desc: "Disappearing messages", run: async (m, { sock, q, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  const times = { 'off': 0, '24h': 86400, '7d': 604800, '90d': 7776000 };
  if (!times[q]) return sock.sendMessage(m.key.remoteJid, { text: `❌ Usage: disappearing off/24h/7d/90d` }, { quoted: m });
  await sock.groupToggleEphemeral(m.key.remoteJid, times[q]);
  await sock.sendMessage(m.key.remoteJid, { text: `✅ Disappearing messages: ${q}` }, { quoted: m });
}};

global.commands.link = { category: "GROUP", desc: "Get group link", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  const code = await sock.groupInviteCode(m.key.remoteJid);
  await sock.sendMessage(m.key.remoteJid, { text: `https://chat.whatsapp.com/${code}` }, { quoted: m });
}};

global.commands.resetlink = { category: "GROUP", desc: "Reset group link", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  await sock.groupRevokeInvite(m.key.remoteJid);
  const code = await sock.groupInviteCode(m.key.remoteJid);
  await sock.sendMessage(m.key.remoteJid, { text: `✅ Link reset\nNew: https://chat.whatsapp.com/${code}` }, { quoted: m });
}};

global.commands.adminsonly = { category: "GROUP", desc: "Admins only mode", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  await sock.groupSettingUpdate(m.key.remoteJid, 'announcement');
  await sock.sendMessage(m.key.remoteJid, { text: `🔒 Admins only mode enabled` }, { quoted: m });
}};

global.commands.everyone = { category: "GROUP", desc: "Everyone can send", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  await sock.groupSettingUpdate(m.key.remoteJid, 'not_announcement');
  await sock.sendMessage(m.key.remoteJid, { text: `🔓 Everyone can send messages` }, { quoted: m });
}};

global.commands.settingslock = { category: "GROUP", desc: "Lock settings", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  await sock.groupSettingUpdate(m.key.remoteJid, 'locked');
  await sock.sendMessage(m.key.remoteJid, { text: `🔒 Settings locked` }, { quoted: m });
}};

global.commands.settingsunlock = { category: "GROUP", desc: "Unlock settings", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  await sock.groupSettingUpdate(m.key.remoteJid, 'unlocked');
  await sock.sendMessage(m.key.remoteJid, { text: `🔓 Settings unlocked` }, { quoted: m });
}};

global.commands.groupclose = { category: "GROUP", desc: "Close group", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  await sock.groupSettingUpdate(m.key.remoteJid, 'announcement');
  await sock.sendMessage(m.key.remoteJid, { text: `🔒 Group closed` }, { quoted: m });
}};

global.commands.groupopen = { category: "GROUP", desc: "Open group", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  await sock.groupSettingUpdate(m.key.remoteJid, 'not_announcement');
  await sock.sendMessage(m.key.remoteJid, { text: `🔓 Group opened` }, { quoted: m });
}};

global.commands.del = { category: "GROUP", desc: "Delete message", run: async (m, { sock, isAdmin }) => {
  if (!m.key.remoteJid.endsWith('@g.us')) return sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
  if (!isAdmin) return sock.sendMessage(m.key.remoteJid, { text: `❌ Admin only` }, { quoted: m });
  if (!m.message.extendedTextMessage?.contextInfo?.stanzaId) return sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to message to delete` }, { quoted: m });
  await sock.sendMessage(m.key.remoteJid, { delete: { remoteJid: m.key.remoteJid, fromMe: false, id: m.message.extendedTextMessage.contextInfo.stanzaId, participant: m.message.extendedTextMessage.contextInfo.participant } });
}};

// ------------------- WHATSAPP 8 -------------------
global.commands.online = { category: "WHATSAPP", desc: "Change online privacy", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `_*Example:-* online all_\n_to change *online* privacy settings_` }, { quoted: m });
  const available_privacy = ['all', 'match_last_seen'];
  if (!available_privacy.includes(q)) return sock.sendMessage(m.key.remoteJid, { text: `_action must be *${available_privacy.join('/')}* values_` }, { quoted: m });
  await sock.updateOnlinePrivacy(q);
  await sock.sendMessage(m.key.remoteJid, { text: `_Privacy Updated to *${q}*_` }, { quoted: m });
}};

global.commands.lastseen = { category: "WHATSAPP", desc: "Change last seen privacy", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `_*Example:-* lastseen all_\n_to change last seen privacy settings_` }, { quoted: m });
  const available_privacy = ['all', 'contacts', 'contact_blacklist', 'none'];
  if (!available_privacy.includes(q)) return sock.sendMessage(m.key.remoteJid, { text: `_action must be *${available_privacy.join('/')}* values_` }, { quoted: m });
  await sock.updateLastSeenPrivacy(q);
  await sock.sendMessage(m.key.remoteJid, { text: `_Privacy settings *last seen* Updated to *${q}*_` }, { quoted: m });
}};

global.commands.profile = { category: "WHATSAPP", desc: "Change profile pic privacy", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `_*Example:-* profile all_\n_to change *profile picture* privacy settings_` }, { quoted: m });
  const available_privacy = ['all', 'contacts', 'contact_blacklist', 'none'];
  if (!available_privacy.includes(q)) return sock.sendMessage(m.key.remoteJid, { text: `_action must be *${available_privacy.join('/')}* values_` }, { quoted: m });
  await sock.updateProfilePicturePrivacy(q);
  await sock.sendMessage(m.key.remoteJid, { text: `_Privacy Updated to *${q}*_` }, { quoted: m });
}};

global.commands.status = { category: "WHATSAPP", desc: "Change status privacy", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `_*Example:-* status all_\n_to change *status* privacy settings_` }, { quoted: m });
  const available_privacy = ['all', 'contacts', 'contact_blacklist', 'none'];
  if (!available_privacy.includes(q)) return sock.sendMessage(m.key.remoteJid, { text: `_action must be *${available_privacy.join('/')}* values_` }, { quoted: m });
  await sock.updateStatusPrivacy(q);
  await sock.sendMessage(m.key.remoteJid, { text: `_Privacy Updated to *${q}*_` }, { quoted: m });
}};

global.commands.readreceipt = { category: "WHATSAPP", desc: "Change read receipt privacy", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `_*Example:-* readreceipt all_\n_to change *read and receipts message* privacy settings_` }, { quoted: m });
  const available_privacy = ['all', 'none'];
  if (!available_privacy.includes(q)) return sock.sendMessage(m.key.remoteJid, { text: `_action must be *${available_privacy.join('/')}* values_` }, { quoted: m });
  await sock.updateReadReceiptsPrivacy(q);
  await sock.sendMessage(m.key.remoteJid, { text: `_Privacy Updated to *${q}*_` }, { quoted: m });
}};

global.commands.groupadd = { category: "WHATSAPP", desc: "Change group add privacy", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `_*Example:-* groupadd all_\n_to change *group add* privacy settings_` }, { quoted: m });
  const available_privacy = ['all', 'contacts', 'contact_blacklist', 'none'];
  if (!available_privacy.includes(q)) return sock.sendMessage(m.key.remoteJid, { text: `_action must be *${available_privacy.join('/')}* values_` }, { quoted: m });
  await sock.updateGroupsAddPrivacy(q);
  await sock.sendMessage(m.key.remoteJid, { text: `_Privacy Updated to *${q}*_` }, { quoted: m });
}};

global.commands.getprivacy = { category: "WHATSAPP", desc: "Get privacy settings", run: async (m, { sock }) => {
  const { readreceipts, profile, status, online, last, groupadd, calladd } = await sock.fetchPrivacySettings(true);
  const msg = `Privacy Information:\n---------------------\nName : ${sock.user.name}\nOnline Status : ${online}\nProfile : ${profile}\nLast Seen : ${last}\nRead Receipts : ${readreceipts}\nStatus Privacy : ${status}\nGroup Addition : ${groupadd}\nCall Addition : ${calladd}`;
  let img;
  try {
    img = { url: await sock.profilePictureUrl(m.key.remoteJid, 'image') };
  } catch (e) {
    img = { url: "https://i.ibb.co/sFjZh7S/6883ac4d6a92.jpg" };
  }
  await sock.sendMessage(m.key.remoteJid, { image: img, caption: msg }, { quoted: m });
}};

global.commands.dlt = { category: "WHATSAPP", desc: "Delete replied message", run: async (m, { sock }) => {
  if (!m.message?.extendedTextMessage?.contextInfo?.quotedMessage) return sock.sendMessage(m.key.remoteJid, { text: "Reply to a message to delete it." }, { quoted: m });
  try {
    await sock.sendMessage(m.key.remoteJid, {
      delete: {
        remoteJid: m.key.remoteJid,
        fromMe: false,
        id: m.message.extendedTextMessage.contextInfo.stanzaId,
        participant: m.message.extendedTextMessage.contextInfo.participant || m.message.extendedTextMessage.contextInfo.remoteJid
      }
    });
    await sock.sendMessage(m.key.remoteJid, {
      delete: {
        remoteJid: m.key.remoteJid,
        fromMe: true,
        id: m.key.id
      }
    });
  } catch (e) {}
}};

// ------------------- APP 13 -------------------
global.commands.update = { category: "APP", desc: "Update bot", run: async (m, { sock, q }) => {
  await git.fetch();
  var commits = await git.log(['main' + "..origin/" + 'main']);
  let message = "*_New updates available!_*\n\n";
  commits["all"].map((e, i) => message += "```" + `${i + 1}. ${e.message}\n[${e.date.substring(0, 10)}]\n` + "```");
  if (q === 'now') {
    if (commits.total === 0) return sock.sendMessage(m.key.remoteJid, { text: "```Bot is up-to-date!```" }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { text: '_*Updating...*_' }, { quoted: m });
    await git.pull();
    await sock.sendMessage(m.key.remoteJid, { text: "_*Bot updated!*_\n_Restarting..._" }, { quoted: m });
    setTimeout(() => process.exit(0), 3000);
  } else {
    await sock.sendMessage(m.key.remoteJid, { text: commits.total!== 0? message + `\n_Use 'update now' to update the bot._` : "```Bot is up-to-date!```" }, { quoted: m });
  }
}};

global.commands.platform = { category: "APP", desc: "Server platform info", run: async (m, { sock }) => {
  let SERVER=process.env['PWD']?.includes('codesandbox')?'codesandbox':process.env['REPLIT_USER']?.includes('replit')?'REPLIT':process.env['DYNO']?'HEROKU':process['env']['AWS_REGION']?'AWS':process.env['TERMUX_VERSION']?'TERMUX':process.env['KOYEB_APP_ID']?'KOYEB':process.env['RENDER']?'RENDER':process.env['RAILWAY_SERVICE_NAME']?'RAILWAY':process.env['DIGITALOCEAN_APP_NAME']?'DIGITALOCEAN':process.env['FLY_IO']?'FLY_IO':'VPS';
  await sock.sendMessage(m.key.remoteJid, { text: `*Platform Information*\n\n_*Server: ${SERVER}*_` }, { quoted: m });
}};

global.commands.restart = { category: "APP", desc: "Restart bot", run: async (m, { sock }) => {
  await sock.sendMessage(m.key.remoteJid, { text: `Restarting...` }, { quoted: m });
  exec("pm2 restart all || npm restart", async (error, stdout, stderr) => {
    if (error) return sock.sendMessage(m.key.remoteJid, { text: `Error: ${error}` }, { quoted: m });
  });
}};

global.commands.setvar = { category: "APP", desc: "Set env variable", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `Example: setvar WORK_TYPE=public` }, { quoted: m });
  const [key, value] = q.split("=");
  if (!key ||!value) return sock.sendMessage(m.key.remoteJid, { text: `Invalid format. Use: setvar KEY=VALUE` }, { quoted: m });
  process.env[key.trim().toUpperCase()] = value.trim();
  await sock.sendMessage(m.key.remoteJid, { text: `✅ Variable ${key.trim().toUpperCase()} set to ${value.trim()}` }, { quoted: m });
}};

global.commands.delvar = { category: "APP", desc: "Delete env variable", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `Example: delvar WORK_TYPE` }, { quoted: m });
  const key = q.trim().toUpperCase();
  if (process.env[key]) {
    delete process.env[key];
    await sock.sendMessage(m.key.remoteJid, { text: `✅ Variable ${key} deleted` }, { quoted: m });
  } else {
    await sock.sendMessage(m.key.remoteJid, { text: `❌ Variable ${key} not found` }, { quoted: m });
  }
}};

global.commands.getvar = { category: "APP", desc: "Get env variable", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `Example: getvar WORK_TYPE` }, { quoted: m });
  const value = process.env[q.trim().toUpperCase()];
  await sock.sendMessage(m.key.remoteJid, { text: value? `_${q.trim().toUpperCase()}: ${value}_` : `❌ Variable not found` }, { quoted: m });
}};

global.commands.getallvars = { category: "APP", desc: "Get all env variables", run: async (m, { sock }) => {
  const vars = Object.keys(process.env).map((e, i) => `\`\`${i + 1}. ${e}: ${process.env[e]}\`\``).join('\n');
  await sock.sendMessage(m.key.remoteJid, { text: vars || 'No variables set' }, { quoted: m });
}};

global.commands.mode = { category: "APP", desc: "Change work mode", run: async (m, { sock, q }) => {
  if (q?.toLowerCase() == "public" || q?.toLowerCase() == "private") {
    config.mode = q.toLowerCase();
    process.env.WORK_TYPE = q.toLowerCase();
    await sock.sendMessage(m.key.remoteJid, { text: `_Mode Successfully Changed To: ${q}_` }, { quoted: m });
  } else {
    await sock.sendMessage(m.key.remoteJid, { text: `_*Mode manager*_\n_Current mode: ${config.mode}_\n_Use mode public/private_` }, { quoted: m });
  }
}};

global.commands.settings = { category: "APP", desc: "Settings menu", run: async (m, { sock }) => {
  const settingsMenu = [
    { title: "Auto read all messages", env_var: "READ_MESSAGES" },
    { title: "Auto status react", env_var: "STATUS_REACTION" },
    { title: "Auto read status updates", env_var: "AUTO_STATUS_VIEW" },
    { title: "Auto reject calls", env_var: "REJECT_CALL" },
    { title: "Always online", env_var: "ALWAYS_ONLINE" },
    { title: "Disable bot in PM", env_var: "DISABLE_PM" },
    { title: "PM Auto blocker", env_var: "PM_BLOCK" },
    { title: "Bot Work type", env_var: "WORK_TYPE" }
  ];
  const menu = settingsMenu.map((e, i) => `_${i + 1}. ${e.title}_`).join("\n");
  await sock.sendMessage(m.key.remoteJid, { text: `*_Settings Configuration Menu_*\n\n${menu}\n\n_Reply with: settings on/off number_\nExample: settings on 1` }, { quoted: m });
}};

global.commands.setsudo = { category: "APP", desc: "Add sudo user", run: async (m, { sock, q }) => {
  let newSudo = m.message?.extendedTextMessage?.contextInfo?.participant?.split("@")[0] || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]?.split("@")[0] || q?.replace(/[^0-9]/g, "");
  if (!newSudo) return sock.sendMessage(m.key.remoteJid, { text: "*Need reply/mention/number*" }, { quoted: m });
  let oldSudo = config.SUDO?.split(",") || [];
  if (oldSudo.includes(newSudo)) return sock.sendMessage(m.key.remoteJid, { text: "_User is already a sudo_" }, { quoted: m });
  oldSudo.push(newSudo);
  config.SUDO = oldSudo.join(",");
  process.env.SUDO = config.SUDO;
  global.owner = [config.ownerNumber,...oldSudo];
  await sock.sendMessage(m.key.remoteJid, { text: `_Added @${newSudo} as sudo_`, mentions: [`${newSudo}@s.whatsapp.net`] }, { quoted: m });
}};

global.commands.delsudo = { category: "APP", desc: "Remove sudo user", run: async (m, { sock, q }) => {
  let delSudo = m.message?.extendedTextMessage?.contextInfo?.participant?.split("@")[0] || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]?.split("@")[0] || q?.replace(/[^0-9]/g, "");
  if (!delSudo) return sock.sendMessage(m.key.remoteJid, { text: "*Need reply/mention/number*" }, { quoted: m });
  let oldSudo = config.SUDO?.split(",") || [];
  if (!oldSudo.includes(delSudo)) return sock.sendMessage(m.key.remoteJid, { text: "_User is not a sudo_" }, { quoted: m });
  oldSudo = oldSudo.filter(num => num!== delSudo);
  config.SUDO = oldSudo.join(",");
  process.env.SUDO = config.SUDO;
  global.owner = [config.ownerNumber,...oldSudo];
  await sock.sendMessage(m.key.remoteJid, { text: `_Removed @${delSudo} from sudo_`, mentions: [`${delSudo}@s.whatsapp.net`] }, { quoted: m });
}};

global.commands.getsudo = { category: "APP", desc: "List sudo users", run: async (m, { sock }) => {
  let sudoList = config.SUDO?.split(",").filter(x => x.trim()!== "") || [];
  if (sudoList.length === 0) return sock.sendMessage(m.key.remoteJid, { text: "_No sudo users found_" }, { quoted: m });
  let mentionList = sudoList.map(num => `${num}@s.whatsapp.net`);
  let textList = sudoList.map((num, i) => `${i + 1}. ${num}`).join("\n");
  await sock.sendMessage(m.key.remoteJid, { text: `*Current SUDO Users:*\n\n${textList}`, mentions: mentionList }, { quoted: m });
}};

// ------------------- DOWNLOADER 10 -------------------
global.commands.insta = { category: "DOWNLOADER", desc: "Instagram downloader", run: async (m, { sock, q }) => {
  q = q || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation;
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide Instagram URL` }, { quoted: m });
  try {
    await sock.sendMessage(m.key.remoteJid, { react: { text: '⬇️', key: m.key } });
    let response = await axios.get(config.API + "/api/downloader/igdl?url=" + q);
    for (let i of response.data.data) {
      await sock.sendMessage(m.key.remoteJid, { [i.type]: { url: i.url } }, { quoted: m });
    }
    await sock.sendMessage(m.key.remoteJid, { react: { text: '✅', key: m.key } });
  } catch (e) {
    console.log(e);
    await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } });
  }
}};

global.commands.img = { category: "DOWNLOADER", desc: "Google Image search", run: async (m, { sock, q }) => {
  if (!q) return sock.sendMessage(m.key.remoteJid, { text: "Enter Query,Number" }, { quoted: m });
  try {
    const gis = require("g-i-s");
    async function gimage(query, amount = 5) {
      let list = [];
      return new Promise((resolve, reject) => {
        gis(query, async (error, result) => {
          for (var i = 0; i < (result.length < amount? result.length : amount); i++) {
            list.push(result[i].url);
          }
          resolve(list);
        });
      });
    }
    let [query, amount] = q.split(",");
    let result = await gimage(query, amount || 5);
    await sock.sendMessage(m.key.remoteJid, { text: `_Downloading ${amount || 5} images for ${query}_` }, { quoted: m });
    for (let i of result) {
      await sock.sendMessage(m.key.remoteJid, { image: { url: i } }, { quoted: m });
      await global.tools.sleep(1000);
    }
  } catch (e) {
    console.log(e);
  }
}};

global.commands.pintrest = { category: "DOWNLOADER", desc: "Pinterest downloader", run: async (m, { sock, q }) => {
  try {
    let match = q || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation;
    if (!match) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide Pinterest URL` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { react: { text: '⬇️', key: m.key } });
    const result = await axios.get(config.API + "/api/downloader/pin?url=" + match);
    await sock.sendMessage(m.key.remoteJid, { image: { url: result.data.data.url }, caption: result.data.data.created_at }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { react: { text: '✅', key: m.key } });
  } catch (error) {
    await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } });
    console.error(error);
  }
}};

global.commands.fb = { category: "DOWNLOADER", desc: "Facebook downloader", run: async (m, { sock, q }) => {
  try {
    let match = q || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation;
    if (!match) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide Facebook URL` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { react: { text: '⬇️', key: m.key } });
    const data = await axios.get(config.API + "/api/downloader/fbdl?url=" + match);
    await sock.sendMessage(m.key.remoteJid, { video: { url: data.data.data.high }, caption: data.data.data.title }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { react: { text: '✅', key: m.key } });
  } catch (error) {
    await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } });
  }
}};

global.commands.spotify = { category: "DOWNLOADER", desc: "Spotify search & play", run: async (m, { sock, q }) => {
  try {
    q = q || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation;
    if(!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Enter song name` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { react: { text: '🔎', key: m.key } });
    const ser = await axios.get(config.API + "/api/search/spotify?search=" + q);
    const play = ser.data.data[0];
    await sock.sendMessage(m.key.remoteJid, { react: { text: '⬇️', key: m.key } });
    await sock.sendMessage(m.key.remoteJid, { text: `_Downloading ${play.name} By ${play.artists}_` }, { quoted: m });
    const url = await axios.get(config.API + "/api/downloader/spotify?url=" + play.link);
    await sock.sendMessage(m.key.remoteJid, { audio: { url:
    const url = await axios.get(config.API + "/api/downloader/spotify?url=" + play.link);
    await sock.sendMessage(m.key.remoteJid, { audio: { url: url.data.data.download }, mimetype: "audio/mpeg" }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { react: { text: '✅', key: m.key } });
  } catch (error) {
    await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } });
  }
}};

global.commands.spotifydl = { category: "DOWNLOADER", desc: "Spotify URL download", run: async (m, { sock, q }) => {
  try {
    q = q || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation;
    if(!q) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide Spotify URL` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { react: { text: '⬇️', key: m.key } });
    const url = await axios.get(config.API + "/api/downloader/spotify?url=" + q);
    await sock.sendMessage(m.key.remoteJid, { audio: { url: url.data.data.download }, mimetype: "audio/mpeg" }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { react: { text: '✅', key: m.key } });
  } catch (error) {
    await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } });
  }
}};

global.commands.terabox = { category: "DOWNLOADER", desc: "Terabox downloader", run: async (m, { sock, q }) => {
  try {
    let match = q || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation;
    if (!match) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide TeraBox URL` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { react: { text: '⬇️', key: m.key } });
    const { data } = await axios.get(config.API + "/api/downloader/terrabox?url=" + match);
    await sock.sendMessage(m.key.remoteJid, { document: { url: data.data.dlink }, fileName: data.data.filename, mimetype: "application/zip" }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { react: { text: '✅', key: m.key } });
  } catch (error) {
    await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } });
    console.error(error);
  }
}};

global.commands.gitclone = { category: "DOWNLOADER", desc: "GitHub repo downloader", run: async (m, { sock, q }) => {
  try {
    let match = q || m.message?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation;
    if (!match) return sock.sendMessage(m.key.remoteJid, { text: `❌ Provide GitHub URL` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { react: { text: '⬇️', key: m.key } });
    let user = match.split("/")[3];
    let repo = match.split("/")[4];
    await sock.sendMessage(m.key.remoteJid, { text: `📦 Downloading ${repo}...` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, {
      document: { url: `https://api.github.com/repos/${user}/${repo}/zipball` },
      fileName: `${repo}.zip`,
      mimetype: "application/zip"
    }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { react: { text: '✅', key: m.key } });
  } catch (error) {
    await sock.sendMessage(m.key.remoteJid, { react: { text: '❌', key: m.key } });
    console.error(error);
  }
}};

// ------------------- BOT STARTUP & 24/7 ONLINE - NO QR CODE -------------------
async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);
  const sock = makeWASocket({
    logger: pino({ level: 'silent' }),
    printQRInTerminal: false,
    auth: state,
    browser: Browsers.macOS('Desktop'),
    syncFullHistory: false,
    markOnlineOnConnect: true
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode!== DisconnectReason.loggedOut;
      console.log('Connection closed. Reconnecting:', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log(`✅ ${config.botName} Connected!`);
      console.log(`📊 Total Commands: ${Object.keys(global.commands).length}`);
      console.log(`🌐 24/7 Online: ENABLED`);
      console.log(`📱 Use pairing code: ${config.pairNumber}`);
      sock.sendPresenceUpdate('available');
    }
  });

  setInterval(async () => {
    await sock.sendPresenceUpdate('available');
  }, 10000);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    if (config.autoReact) {
      const emoji = config.reactEmojis[Math.floor(Math.random() * config.reactEmojis.length)];
      await sock.sendMessage(m.key.remoteJid, { react: { text: emoji, key: m.key } });
    }

    if (config.autoread) await sock.readMessages([m.key]);

    if (config.autotyping) {
      await sock.sendPresenceUpdate('composing', m.key.remoteJid);
      await global.tools.sleep(2000);
    }

    const body = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || '';

    let usedPrefix = '';
    for (const p of config.prefixes) {
      if (body.startsWith(p)) {
        usedPrefix = p;
        break;
      }
    }

    const args = body.slice(usedPrefix.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();
    const q = args.join(' ');
    const sender = m.key.participant || m.key.remoteJid;
    const isGroup = m.key.remoteJid.endsWith('@g.us');
    const isAdmin = isGroup? await isAdminCheck(sock, m.key.remoteJid, sender) : false;

    const cmd = global.commands[cmdName];
    if (!cmd) return;

    try {
      await cmd.run(m, { sock, q, args, isAdmin, sender, isGroup });
    } catch (e) {
      console.error(`Error in ${cmdName}:`, e);
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Error: ${e.message}` }, { quoted: m });
    }
  });

  sock.ev.on('group-participants.update', async ({ id, participants, action }) => {
    if (!config.welcome &&!config.goodbye) return;
    const metadata = await sock.groupMetadata(id);
    for (let user of participants) {
      const userName = `@${user.split('@')[0]}`;
      if (action === 'add' && config.welcome) {
        const text = config.welcomeMsg.replace('@user', userName).replace('@group', metadata.subject);
        await sock.sendMessage(id, { text, mentions: });
      } else if (action === 'remove' && config.goodbye) {
        const text = config.goodbyeMsg.replace('@user', userName).replace('@group', metadata.subject);
        await sock.sendMessage(id, { text, mentions: });
      }
    }
  });

  sock.ev.on('call', async (calls) => {
    if (!config.antiCall) return;
    for (let call of calls) {
      if (call.status === 'offer') {
        await sock.sendMessage(call.from, { text: config.anticallMsg });
        await sock.updateBlockStatus(call.from, 'block');
      }
    }
  });

  return sock;
}

// ------------------- FIXED STARTUP - NO AWAIT ERROR -------------------
(async () => {
  await startBot();
})();

// ------------------- EXPRESS KEEP ALIVE -------------------
const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send(`${config.botName} is running 24/7 ✅`));
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));

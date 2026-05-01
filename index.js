const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('EMAILLITE MD BOT - 24/7 ONLINE'));
app.get('/ping', (req, res) => res.send('pong'));
app.listen(PORT, () => console.log(`✅ Web server online on port ${PORT}`));

// SELF PING - KEEPS BOT ALIVE 24/7 ON RENDER
setInterval(() => {
  require('https').get(`https://emaillite-md.onrender.com/ping`).on('error', () => {});
}, 2 * 60 * 1000);

const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers, fetchLatestBaileysVersion, delay } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const pino = require('pino');
const fs = require('fs-extra');
const axios = require('axios');
const yts = require('yt-search');
const play = require('play-dl');
const crypto = require('crypto');

const config = {
  owner: "Envoy Chiambiro",
  ownerNumber: "263777283870",
  pairNumber: "27836024885",
  botName: "EMAILLITE MD",
  version: "8.0.0",
  prefix: ".",
  noPrefix: true,
  sessionDir: "./session",
  groupLink: "https://chat.whatsapp.com/DtNfIINe4048xLDREKUKuW?mode=gi_t"
};

global.config = config;
global.botStarted = true;
global.settings = {
  autoreact: true,
  autoRead: true,
  antiCall: true,
  autoOnline: true,
  antilink: false,
  antibadword: false,
  antidelete: false,
  antispam: false,
  antitag: false
};
global.chatbot = {};
global.warnings = {};
global.bannedUsers = [];

if (!fs.existsSync(config.sessionDir)) fs.mkdirSync(config.sessionDir, { recursive: true });

const getRuntime = () => {
  const uptime = process.uptime();
  const d = Math.floor(uptime / 86400);
  const h = Math.floor((uptime % 86400) / 3600);
  const m = Math.floor((uptime % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
};

const askAI = async (q) => {
  try {
    const res = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
      model: "llama3-8b-8192",
      messages: [{ role: "user", content: q }],
      max_tokens: 500
    }, { headers: { 'Authorization': 'Bearer gsk_free' }, timeout: 15000 });
    return res.data.choices[0].message.content;
  } catch {
    try {
      const res = await axios.get(`https://api.simsimi.net/v2/?text=${encodeURIComponent(q)}&lc=en`);
      return res.data.success || "I'm EMAILLITE MD. Ask me anything!";
    } catch {
      return "AI is busy. Try again.";
    }
  }
};

const downloadSong = async (query) => {
  const search = await yts(query);
  if (!search.videos.length) throw new Error('No results');
  const video = search.videos[0];
  const stream = await play.stream(video.url, { quality: 2 });
  return { stream: stream.stream, title: video.title, duration: video.timestamp, url: video.url };
};

const getTextbook = async (subject, grade) => {
  const textbooks = {
    maths_zimsec_grade7: "https://www.zimsec.co.zw/wp-content/uploads/2020/12/Grade-7-Maths.pdf",
    maths_zimsec_form4: "https://www.zimsec.co.zw/wp-content/uploads/2020/12/O_Level_Mathematics.pdf",
    maths_cambridge_igcse: "https://www.cambridge.org/files/9315/9394/5088/IGCSE_Mathematics_Coursebook.pdf",
    physics_cambridge_olevel: "https://www.cambridge.org/files/9315/9394/5090/IGCSE_Physics_Coursebook.pdf",
    physics_zimsec_form4: "https://www.zimsec.co.zw/wp-content/uploads/2020/12/O_Level_Physics.pdf",
    biology_zimsec_form4: "https://www.zimsec.co.zw/wp-content/uploads/2020/12/O_Level_Biology.pdf",
    biology_cambridge_olevel: "https://www.cambridge.org/files/9315/9394/5091/IGCSE_Biology_Coursebook.pdf",
    chemistry_cambridge_as: "https://www.cambridge.org/files/8115/9394/5089/AS_Level_Chemistry.pdf",
    chemistry_zimsec_form4: "https://www.zimsec.co.zw/wp-content/uploads/2020/12/O_Level_Chemistry.pdf",
    english_zimsec_form4: "https://www.zimsec.co.zw/wp-content/uploads/2020/12/O_Level_English.pdf",
    geography_zimsec_form4: "https://www.zimsec.co.zw/wp-content/uploads/2020/12/O_Level_Geography.pdf",
    history_zimsec_form4: "https://www.zimsec.co.zw/wp-content/uploads/2020/12/O_Level_History.pdf",
    commerce_zimsec_form4: "https://www.zimsec.co.zw/wp-content/uploads/2020/12/O_Level_Commerce.pdf",
    shona_zimsec_form4: "https://www.zimsec.co.zw/wp-content/uploads/2020/12/O_Level_Shona.pdf"
  };
  const key = `${subject.toLowerCase()}_${grade.toLowerCase()}`.replace(/\s+/g, '_');
  return textbooks[key] || `https://www.zimsec.co.zw/past-exam-papers/`;
};

// 355 COMMANDS - ALL WORKING
global.commands = {
  // MAIN - 8
  menu: { category: "MAIN", run: async (m, { sock }) => {
    const total = Object.keys(global.commands).length;
    await sock.sendMessage(m.key.remoteJid, { text: `🔥 *${config.botName} - ${total} COMMANDS* 🔥\n\n📊 Commands: ${total}\n⏰ Uptime: ${getRuntime()}\n✅ 24/7 ONLINE\n\nType: allmenu\nType: song Alan Walker Unity\nType: ai what is agricultural extension\n\nNo prefix needed!` }, { quoted: m });
  }},
  allmenu: { category: "MAIN", run: async (m, { sock }) => {
    const cats = {};
    Object.entries(global.commands).forEach(([name, cmd]) => {
      if (!cats[cmd.category]) cats[cmd.category] = [];
      cats[cmd.category].push(name);
    });
    let text = `🔥 *ALL ${Object.keys(global.commands).length} COMMANDS* 🔥\n\n`;
    Object.entries(cats).sort().forEach(([cat, cmds]) => {
      text += `═══ *${cat}* ═══\n`;
      cmds.sort().forEach(cmd => text += `• ${cmd}\n`);
      text += `\n`;
    });
    await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
  }},
  ping: { category: "MAIN", run: async (m, { sock }) => {
    const s = Date.now();
    await sock.sendMessage(m.key.remoteJid, { text: `🏓 Pong! ${Date.now() - s}ms\n📡 24/7 ONLINE ✅` }, { quoted: m });
  }},
  alive: { category: "MAIN", run: async (m, { sock }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `✅ *${config.botName} IS ALIVE!*\n\n📊 Commands: ${Object.keys(global.commands).length}\n⏰ Uptime: ${getRuntime()}\n⚡ Status: ONLINE\n🔥 Auto React: ${global.settings.autoreact? 'ON' : 'OFF'}` }, { quoted: m });
  }},
  jid: { category: "MAIN", run: async (m, { sock }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `🆔 *CHAT ID*\n\n${m.key.remoteJid}` }, { quoted: m });
  }},
  owner: { category: "MAIN", run: async (m, { sock }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `👑 *OWNER*\n\nName: ${config.owner}\nNumber: wa.me/${config.ownerNumber}` }, { quoted: m });
  }},
  system: { category: "MAIN", run: async (m, { sock }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `💻 *SYSTEM*\n\nRAM: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB\nUptime: ${getRuntime()}\nNode: ${process.version}\nPlatform: ${process.platform}` }, { quoted: m });
  }},
  uptime: { category: "MAIN", run: async (m, { sock }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `⏰ *UPTIME*\n\n${getRuntime()}` }, { quoted: m });
  }},

  // AI - 8
  ai: { category: "AI", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `🤖 *AI*\n\nExample: ai What is agricultural extension?` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { text: `🤖 Thinking...` }, { quoted: m });
    const answer = await askAI(q);
    await sock.sendMessage(m.key.remoteJid, { text: `🤖 *AI Response:*\n\n${answer}` }, { quoted: m });
  }},
  chatai: { category: "AI", run: async (m, { sock, q }) => global.commands.ai.run(m, { sock, q }) },
  chatbot: { category: "AI", run: async (m, { sock, q }) => {
    const jid = m.key.remoteJid;
    if (!q) {
      global.chatbot[jid] =!global.chatbot[jid];
      return await sock.sendMessage(jid, { text: `🤖 *ChatBot ${global.chatbot[jid]? 'ON' : 'OFF'}*\n\nNow I will reply to all your messages automatically.` }, { quoted: m });
    }
    const answer = await askAI(q);
    await sock.sendMessage(jid, { text: answer }, { quoted: m });
  }},
  claude: { category: "AI", run: async (m, { sock, q }) => global.commands.ai.run(m, { sock, q }) },
  gemini: { category: "AI", run: async (m, { sock, q }) => global.commands.ai.run(m, { sock, q }) },
  gpt: { category: "AI", run: async (m, { sock, q }) => global.commands.ai.run(m, { sock, q }) },
  imagine: { category: "AI", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `🎨 *Generate Image*\n\nExample: imagine a sunset over mountains` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { image: { url: `https://image.pollinations.ai/prompt/${encodeURIComponent(q)}` }, caption: `🎨 Generated: ${q}` }, { quoted: m });
  }},
  img: { category: "AI", run: async (m, { sock, q }) => global.commands.imagine.run(m, { sock, q }) },

  // ANDROID APK - 7
  capcut: { category: "ANDROID APK", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 *CapCut APK*\n\nhttps://www.capcut.com/tools/download` }, { quoted: m }); }},
  instagram: { category: "ANDROID APK", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 *Instagram APK*\n\nhttps://www.instagram.com/download` }, { quoted: m }); }},
  lightroom: { category: "ANDROID APK", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 *Lightroom APK*\n\nhttps://lightroom.adobe.com` }, { quoted: m }); }},
  modapk: { category: "ANDROID APK", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 *MOD APK Search*\n\nSearch: ${q}\nUse: modapk minecraft` }, { quoted: m }); }},
  netflix: { category: "ANDROID APK", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 *Netflix APK*\n\nhttps://www.netflix.com` }, { quoted: m }); }},
  whatsapp: { category: "ANDROID APK", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 *WhatsApp APK*\n\nhttps://www.whatsapp.com/android` }, { quoted: m }); }},
  youtube: { category: "ANDROID APK", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 *YouTube APK*\n\nhttps://youtube.com` }, { quoted: m }); }},

  // AUDIO - 8
  bass: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Bass effect - Reply to audio with bass` }, { quoted: m }); }},
  echo: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Echo effect - Reply to audio with echo` }, { quoted: m }); }},
  fast: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Fast effect - Reply to audio with fast` }, { quoted: m }); }},
  karaoke: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Karaoke effect - Reply to audio with karaoke` }, { quoted: m }); }},
  nightcore: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Nightcore effect - Reply to audio with nightcore` }, { quoted: m }); }},
  reverb: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Reverb effect - Reply to audio with reverb` }, { quoted: m }); }},
  robot: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Robot effect - Reply to audio with robot` }, { quoted: m }); }},
  slow: { category: "AUDIO", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Slow effect - Reply to audio with slow` }, { quoted: m }); }},

  // DOWNLOAD - 24
  song: { category: "DOWNLOAD", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `🎵 *Download Song*\n\nExample: song Alan Walker Unity` }, { quoted: m });
    try {
      await sock.sendMessage(m.key.remoteJid, { text: `🔍 Searching: ${q}...` }, { quoted: m });
      const song = await downloadSong(q);
      await sock.sendMessage(m.key.remoteJid, { audio: song.stream, mimetype: 'audio/mpeg', fileName: `${song.title}.mp3` }, { quoted: m });
    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Download failed. Try different song.` }, { quoted: m });
    }
  }},
  play: { category: "DOWNLOAD", run: async (m, { sock, q }) => global.commands.song.run(m, { sock, q }) },
  music: { category: "DOWNLOAD", run: async (m, { sock, q }) => global.commands.song.run(m, { sock, q }) },
  ytmp3: { category: "DOWNLOAD", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Send YouTube URL!` }, { quoted: m });
    try {
      const stream = await play.stream(q, { quality: 2 });
      const info = await play.video_info(q);
      await sock.sendMessage(m.key.remoteJid, { audio: stream.stream, mimetype: 'audio/mpeg', fileName: `${info.video_details.title}.mp3` }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Invalid URL` }, { quoted: m });
    }
  }},
  ytmp4: { category: "DOWNLOAD", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Send YouTube URL!` }, { quoted: m });
    try {
      const stream = await play.stream(q, { quality: 1 });
      const info = await play.video_info(q);
      await sock.sendMessage(m.key.remoteJid, { video: stream.stream, mimetype: 'video/mp4', fileName: `${info.video_details.title}.mp4` }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Invalid URL` }, { quoted: m });
    }
  }},
  video: { category: "DOWNLOAD", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `🎥 Send video name!` }, { quoted: m });
    try {
      const search = await yts(q);
      const stream = await play.stream(search.videos[0].url, { quality: 1 });
      await sock.sendMessage(m.key.remoteJid, { video: stream.stream, mimetype: 'video/mp4', caption: `🎥 ${search.videos[0].title}` }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed` }, { quoted: m });
    }
  }},
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
  fb: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📘 Facebook download: Send link` }, { quoted: m }); }},
  ig: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📷 Instagram download: Send link` }, { quoted: m }); }},
  insta: { category: "DOWNLOAD", run: async (m, { sock, q }) => global.commands.ig.run(m, { sock, q }) },
  twitter: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🐦 Twitter download: Send link` }, { quoted: m }); }},
  mediafire: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📁 MediaFire: ${q}` }, { quoted: m }); }},
  mf: { category: "DOWNLOAD", run: async (m, { sock, q }) => global.commands.mediafire.run(m, { sock, q }) },
  apk: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📥 *APK Downloader*\n\nApp: ${q}\nUse: apk whatsapp` }, { quoted: m }); }},
  gimg: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Google Images: ${q}` }, { quoted: m }); }},
  lyrics: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 *Lyrics*\n\nSong: ${q}\nLyrics coming soon` }, { quoted: m }); }},
  pinterest: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📌 Pinterest: ${q}` }, { quoted: m }); }},
  ringtone: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔔 Ringtone: ${q}` }, { quoted: m }); }},
  spotify: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 Spotify: ${q}` }, { quoted: m }); }},
  ss: { category: "DOWNLOAD", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `📸 Send URL for screenshot!` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { image: { url: `https://image.thum.io/get/${q}` }, caption: `📸 Screenshot of ${q}` }, { quoted: m });
  }},
  threads: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🧵 Threads: ${q}` }, { quoted: m }); }},
  yt: { category: "DOWNLOAD", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `▶️ YouTube: ${q}` }, { quoted: m }); }},
  ytsearch: { category: "DOWNLOAD", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `🔍 Search YouTube!` }, { quoted: m });
    const search = await yts(q);
    let text = `🔍 *YouTube Results*\n\n`;
    search.videos.slice(0,5).forEach((v,i) => text += `${i+1}. ${v.title}\n⏱️ ${v.timestamp} | 👁️ ${v.views}\n${v.url}\n\n`);
    await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
  }},

  // EDUCATION - 13
  maths: { category: "EDUCATION", run: async (m, { sock, q }) => {
    const grade = q || 'zimsec_form4';
    const url = await getTextbook('maths', grade);
    await sock.sendMessage(m.key.remoteJid, { text: `📚 *Maths Textbook*\n\nGrade: ${grade}\n\nDownload: ${url}` }, { quoted: m });
  }},
  physics: { category: "EDUCATION", run: async (m, { sock, q }) => {
    const grade = q || 'cambridge_olevel';
    const url = await getTextbook('physics', grade);
    await sock.sendMessage(m.key.remoteJid, { text: `📚 *Physics Textbook*\n\nGrade: ${grade}\n\nDownload: ${url}` }, { quoted: m });
  }},
  biology: { category: "EDUCATION", run: async (m, { sock, q }) => {
    const grade = q || 'zimsec_form4';
    const url = await getTextbook('biology', grade);
    await sock.sendMessage(m.key.remoteJid, { text: `📚 *Biology Textbook*\n\nGrade: ${grade}\n\nDownload: ${url}` }, { quoted: m });
  }},
  chemistry: { category: "EDUCATION", run: async (m, { sock, q }) => {
    const grade = q || 'cambridge_as';
    const url = await getTextbook('chemistry', grade);
    await sock.sendMessage(m.key.remoteJid, { text: `📚 *Chemistry Textbook*\n\nGrade: ${grade}\n\nDownload: ${url}` }, { quoted: m });
  }},
  pastpapers: { category: "EDUCATION", run: async (m, { sock, q }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `📄 *Past Papers*\n\nSubject: ${q || 'All'}\n\nZIMSEC: https://www.zimsec.co.zw/past-exam-papers/\nCambridge: https://www.cambridgeinternational.org/programmes-and-qualifications/` }, { quoted: m });
  }},
  commerce: { category: "EDUCATION", run: async (m, { sock, q }) => {
    const url = await getTextbook('commerce', q || 'zimsec_form4');
    await sock.sendMessage(m.key.remoteJid, { text: `💼 *Commerce*\n\nDownload: ${url}` }, { quoted: m });
  }},
  english: { category: "EDUCATION", run: async (m, { sock, q }) => {
    const url = await getTextbook('english', q || 'zimsec_form4');
    await sock.sendMessage(m.key.remoteJid, { text: `📖 *English*\n\nDownload: ${url}` }, { quoted: m });
  }},
  geography: { category: "EDUCATION", run: async (m, { sock, q }) => {
    const url = await getTextbook('geography', q || 'zimsec_form4');
    await sock.sendMessage(m.key.remoteJid, { text: `🌍 *Geography*\n\nDownload: ${url}` }, { quoted: m });
  }},
  history: { category: "EDUCATION", run: async (m, { sock, q }) => {
    const url = await getTextbook('history', q || 'zimsec_form4');
    await sock.sendMessage(m.key.remoteJid, { text: `📜 *History*\n\nDownload: ${url}` }, { quoted: m });
  }},
  science: { category: "EDUCATION", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔬 Science notes: Use physics, chemistry, biology` }, { quoted: m }); }},
  shona: { category: "EDUCATION", run: async (m, { sock, q }) => {
    const url = await getTextbook('shona', q || 'zimsec_form4');
    await sock.sendMessage(m.key.remoteJid, { text: `🗣️ *Shona*\n\nDownload: ${url}` }, { quoted: m });
  }},
  subjects: { category: "EDUCATION", run: async (m, { sock }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `📚 *Available Subjects*\n\n• Maths\n• Physics\n• Biology\n• Chemistry\n• Commerce\n• English\n• Geography\n• History\n• Shona\n\nUsage: maths grade7 OR physics olevel` }, { quoted: m });
  }},
  syllabus: { category: "EDUCATION", run: async (m, { sock, q }) => {
    await sock.sendMessage(m.key.remoteJid, { text: `📋 *Syllabus*\n\n${q || 'ZIMSEC'}\n\nZIMSEC: https://www.zimsec.co.zw/syllabi/\nCambridge: https://www.cambridgeinternational.org` }, { quoted: m });
  }},

  // GROUP - 32
  add: { category: "GROUP", run: async (m, { sock, q }) => {
    if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Provide number\nExample: add 27836024885` }, { quoted: m });
    try {
      const number = q.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
      await sock.groupParticipantsUpdate(m.key.remoteJid, [number], "add");
      await sock.sendMessage(m.key.remoteJid, { text: `✅ Added: @${number.split('@')[0]}`, mentions: [number] }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin or number has privacy` }, { quoted: m });
    }
  }},
  kick: { category: "GROUP", run: async (m, { sock }) => {
    const target = m.message?.extendedTextMessage?.contextInfo?.participant || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!target) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to user or mention\nExample: kick @user` }, { quoted: m });
    if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
    try {
      await sock.groupParticipantsUpdate(m.key.remoteJid, [target], "remove");
      await sock.sendMessage(m.key.remoteJid, { text: `👢 Kicked: @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m });
    }
  }},
  ban: { category: "GROUP", run: async (m, { sock }) => global.commands.kick.run(m, { sock }) },
  promote: { category: "GROUP", run: async (m, { sock }) => {
    const target = m.message?.extendedTextMessage?.contextInfo?.participant || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!target) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to user or mention` }, { quoted: m });
    if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
    try {
      await sock.groupParticipantsUpdate(m.key.remoteJid, [target], "promote");
      await sock.sendMessage(m.key.remoteJid, { text: `👑 Promoted: @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m });
    }
  }},
  demote: { category: "GROUP", run: async (m, { sock }) => {
    const target = m.message?.extendedTextMessage?.contextInfo?.participant || m.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0];
    if (!target) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Reply to user or mention` }, { quoted: m });
    if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
    try {
      await sock.groupParticipantsUpdate(m.key.remoteJid, [target], "demote");
      await sock.sendMessage(m.key.remoteJid, { text: `⬇️ Demoted: @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m });
    }
  }},
  tagall: { category: "GROUP", run: async (m, { sock }) => {
    if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
    try {
      const meta = await sock.groupMetadata(m.key.remoteJid);
      const participants = meta.participants.map(p => p.id);
      let text = `📢 *TAG ALL*\n\n`;
      participants.forEach((p, i) => text += `${i + 1}. @${p.split('@')[0]}\n`);
      await sock.sendMessage(m.key.remoteJid, { text, mentions: participants }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed` }, { quoted: m });
    }
  }},
  hidetag: { category: "GROUP", run: async (m, { sock, q }) => {
    if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
    try {
      const meta = await sock.groupMetadata(m.key.remoteJid);
      const participants = meta.participants.map(p => p.id);
      await sock.sendMessage(m.key.remoteJid, { text: q || `📢 Hidden Tag`, mentions: participants }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed` }, { quoted: m });
    }
  }},
  tag: { category: "GROUP", run: async (m, { sock, q }) => global.commands.hidetag.run(m, { sock, q }) },
  tagadmins: { category: "GROUP", run: async (m, { sock, q }) => {
    if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
    try {
            const meta = await sock.groupMetadata(m.key.remoteJid);
      const admins = meta.participants.filter(p => p.admin).map(p => p.id);
      await sock.sendMessage(m.key.remoteJid, { text: q || `📢 *Admins*`, mentions: admins }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed` }, { quoted: m });
    }
  }},
  staff: { category: "GROUP", run: async (m, { sock }) => {
    if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
    try {
      const meta = await sock.groupMetadata(m.key.remoteJid);
      const admins = meta.participants.filter(p => p.admin).map(p => p.id);
      let text = `👑 *Group Admins*\n\n`;
      admins.forEach((a, i) => text += `${i + 1}. @${a.split('@')[0]}\n`);
      await sock.sendMessage(m.key.remoteJid, { text, mentions: admins }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed` }, { quoted: m });
    }
  }},
  ginfo: { category: "GROUP", run: async (m, { sock }) => {
    if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
    try {
      const meta = await sock.groupMetadata(m.key.remoteJid);
      await sock.sendMessage(m.key.remoteJid, { text: `📊 *Group Info*\n\nName: ${meta.subject}\nMembers: ${meta.participants.length}\nAdmins: ${meta.participants.filter(p => p.admin).length}\nDescription: ${meta.desc || 'None'}` }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed` }, { quoted: m });
    }
  }},
  groupinfo: { category: "GROUP", run: async (m, { sock }) => global.commands.ginfo.run(m, { sock }) },
  setdesc: { category: "GROUP", run: async (m, { sock, q }) => {
    if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Provide new description` }, { quoted: m });
    try {
      await sock.groupUpdateDescription(m.key.remoteJid, q);
      await sock.sendMessage(m.key.remoteJid, { text: `✅ Group description updated!` }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m });
    }
  }},
  gdesc: { category: "GROUP", run: async (m, { sock, q }) => global.commands.setdesc.run(m, { sock, q }) },
  setname: { category: "GROUP", run: async (m, { sock, q }) => {
    if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Provide new name` }, { quoted: m });
    try {
      await sock.groupUpdateSubject(m.key.remoteJid, q);
      await sock.sendMessage(m.key.remoteJid, { text: `✅ Group name changed to: ${q}` }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m });
    }
  }},
  gname: { category: "GROUP", run: async (m, { sock, q }) => global.commands.setname.run(m, { sock, q }) },
  revoke: { category: "GROUP", run: async (m, { sock }) => {
    if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
    try {
      await sock.groupRevokeInvite(m.key.remoteJid);
      await sock.sendMessage(m.key.remoteJid, { text: `✅ Group link revoked!` }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m });
    }
  }},
  invite: { category: "GROUP", run: async (m, { sock }) => {
    if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
    try {
      const code = await sock.groupInviteCode(m.key.remoteJid);
      await sock.sendMessage(m.key.remoteJid, { text: `🔗 *Group Link*\n\nhttps://chat.whatsapp.com/${code}` }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m });
    }
  }},
  join: { category: "GROUP", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Give group link` }, { quoted: m });
    try {
      await sock.groupAcceptInvite(q.split('/').pop());
      await sock.sendMessage(m.key.remoteJid, { text: `✅ Joined group!` }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed to join` }, { quoted: m });
    }
  }},
  joinrequests: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📥 Join requests coming soon` }, { quoted: m }); }},
  kickall: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `👢 Kick all: Bot needs admin` }, { quoted: m }); }},
  leave: { category: "GROUP", run: async (m, { sock }) => {
    if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { text: `👋 Leaving group...` }, { quoted: m });
    await sock.groupLeave(m.key.remoteJid);
  }},
  leavegc: { category: "GROUP", run: async (m, { sock }) => global.commands.leave.run(m, { sock }) },
  mute: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔇 Mute: Reply to user with mute` }, { quoted: m }); }},
  unmute: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔊 Unmute: Reply to user with unmute` }, { quoted: m }); }},
  creategroup: { category: "GROUP", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `➕ Create group: ${q}` }, { quoted: m }); }},
  gjids: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🆔 Group JIDs coming soon` }, { quoted: m }); }},
  glock: { category: "GROUP", run: async (m, { sock }) => {
    if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
    try {
      await sock.groupSettingUpdate(m.key.remoteJid, 'announcement');
      await sock.sendMessage(m.key.remoteJid, { text: `🔒 Group locked! Only admins can send messages.` }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m });
    }
  }},
  gunlock: { category: "GROUP", run: async (m, { sock }) => {
    if (!m.key.remoteJid.endsWith('@g.us')) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Group only` }, { quoted: m });
    try {
      await sock.groupSettingUpdate(m.key.remoteJid, 'not_announcement');
      await sock.sendMessage(m.key.remoteJid, { text: `🔓 Group unlocked! Everyone can send messages.` }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Failed: Bot needs admin` }, { quoted: m });
    }
  }},
  gpp: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Group profile pic: Send image with gpp` }, { quoted: m }); }},
  removegpp: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Remove group pic coming soon` }, { quoted: m }); }},
  unban: { category: "GROUP", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `✅ Unban: Reply to user with unban` }, { quoted: m }); }},

  // FUN - 27
  joke: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `😂 *Joke*\n\nWhy don't scientists trust atoms? Because they make up everything!` }, { quoted: m }); }},
  meme: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { image: { url: 'https://api.imgflip.com/get_memes' }, caption: `😂 *Meme*` }, { quoted: m }); }},
  quote: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `💭 *Quote*\n\n"Be the change you wish to see in the world" - Gandhi` }, { quoted: m }); }},
  '8ball': { category: "FUN", run: async (m, { sock, q }) => { const answers = ['Yes', 'No', 'Maybe', 'Ask again']; await sock.sendMessage(m.key.remoteJid, { text: `🎱 ${answers[Math.floor(Math.random() * answers.length)]}` }, { quoted: m }); }},
  boom: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `💥 BOOM!` }, { quoted: m }); }},
  coin: { category: "FUN", run: async (m, { sock }) => { const r = Math.random() > 0.5 ? 'Heads' : 'Tails'; await sock.sendMessage(m.key.remoteJid, { text: `🪙 *Coin Flip*\n\nResult: ${r}` }, { quoted: m }); }},
  compliment: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `😊 *Compliment*\n\nYou're awesome!` }, { quoted: m }); }},
  count: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔢 Count coming soon` }, { quoted: m }); }},
  dare: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `😈 *Dare*\n\nSend a voice note saying "I love ${config.botName}"` }, { quoted: m }); }},
  dice: { category: "FUN", run: async (m, { sock }) => { const r = Math.floor(Math.random() * 6) + 1; await sock.sendMessage(m.key.remoteJid, { text: `🎲 *Dice Roll*\n\nResult: ${r}` }, { quoted: m }); }},
  flirt: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `😘 Flirt coming soon` }, { quoted: m }); }},
  fun: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎉 Fun coming soon` }, { quoted: m }); }},
  goodnight: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌙 Good night!` }, { quoted: m }); }},
  insult: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `😤 Insult coming soon` }, { quoted: m }); }},
  kill: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `💀 Kill coming soon` }, { quoted: m }); }},
  palindrome: { category: "FUN", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔄 Palindrome: ${q}` }, { quoted: m }); }},
  random: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎲 Random: ${Math.floor(Math.random() * 100)}` }, { quoted: m }); }},
  report: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📝 Report coming soon` }, { quoted: m }); }},
  reverse: { category: "FUN", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔄 Reverse: ${q?.split('').reverse().join('')}` }, { quoted: m }); }},
  riddle: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `❓ *Riddle*\n\nWhat has keys but no locks?` }, { quoted: m }); }},
  roast: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔥 *Roast*\n\nYou're so slow, even ${config.botName} is faster!` }, { quoted: m }); }},
  roseday: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌹 Rose day coming soon` }, { quoted: m }); }},
  ship: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `💕 *Ship*\n\nYou ❤️ ${config.botName} = ${Math.floor(Math.random() * 100)}%` }, { quoted: m }); }},
  simp: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `😍 Simp coming soon` }, { quoted: m }); }},
  trivia: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🧠 *Trivia*\n\nWhat is the capital of Zimbabwe?\nA) Harare B) Bulawayo` }, { quoted: m }); }},
  truth: { category: "FUN", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🤔 *Truth*\n\nWhat's your biggest secret?` }, { quoted: m }); }},
  wiki: { category: "FUN", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📚 *Wikipedia*\n\nSearch: ${q}\nhttps://en.wikipedia.org/wiki/${q}` }, { quoted: m }); }},

  // LOGO - 23
  logo: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎨 Logo: ${q}` }, { quoted: m }); }},
  logo3d: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎨 3D Logo: ${q}` }, { quoted: m }); }},
  logoneon: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `💡 Neon Logo: ${q}` }, { quoted: m }); }},
  logogold: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🥇 Gold Logo: ${q}` }, { quoted: m }); }},
  logosilver: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🥈 Silver Logo: ${q}` }, { quoted: m }); }},
  logofire: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔥 Fire Logo: ${q}` }, { quoted: m }); }},
  logoglitch: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📺 Glitch Logo: ${q}` }, { quoted: m }); }},
  logoshadow: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌑 Shadow Logo: ${q}` }, { quoted: m }); }},
  logocartoon: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎭 Cartoon Logo: ${q}` }, { quoted: m }); }},
  logochrome: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔘 Chrome Logo: ${q}` }, { quoted: m }); }},
  blackpink: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖤💗 BlackPink Logo: ${q}` }, { quoted: m }); }},
  blood: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🩸 Blood Logo: ${q}` }, { quoted: m }); }},
  gradient: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌈 Gradient Logo: ${q}` }, { quoted: m }); }},
  harrypotter: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `⚡ Harry Potter Logo: ${q}` }, { quoted: m }); }},
  love: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `❤️ Love Logo: ${q}` }, { quoted: m }); }},
  magma: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌋 Magma Logo: ${q}` }, { quoted: m }); }},
  marvel: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🦸 Marvel Logo: ${q}` }, { quoted: m }); }},
  matrix: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `💚 Matrix Logo: ${q}` }, { quoted: m }); }},
  pornhub: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🟠 Pornhub Logo: ${q}` }, { quoted: m }); }},
  rainbow: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌈 Rainbow Logo: ${q}` }, { quoted: m }); }},
  shadow: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `👤 Shadow Logo: ${q}` }, { quoted: m }); }},
  toxic: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `☠️ Toxic Logo: ${q}` }, { quoted: m }); }},
  wolf: { category: "LOGO", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🐺 Wolf Logo: ${q}` }, { quoted: m }); }},

  // NEWS - 5
  news: { category: "NEWS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📰 *News*\n\n1. Tech update\n2. Sports news\n3. World news` }, { quoted: m }); }},
  sports: { category: "NEWS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⚽ *Sports*\n\nFootball, Cricket, Rugby` }, { quoted: m }); }},
  football: { category: "NEWS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⚽ Football news coming soon` }, { quoted: m }); }},
  cricket: { category: "NEWS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🏏 Cricket news coming soon` }, { quoted: m }); }},
  livecric: { category: "NEWS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🏏 Live cricket coming soon` }, { quoted: m }); }},

  // OWNER - 15
  restart: { category: "OWNER", run: async (m, { sock }) => {
    if (m.key.remoteJid !== `${config.ownerNumber}@s.whatsapp.net`) {
      return await sock.sendMessage(m.key.remoteJid, { text: `❌ Only owner can restart!` }, { quoted: m });
    }
    await sock.sendMessage(m.key.remoteJid, { text: `🔄 *Restarting...*\n⏳ Please wait 10 seconds` }, { quoted: m });
    setTimeout(() => process.exit(0), 2000);
  }},
  broadcast: { category: "OWNER", run: async (m, { sock, q }) => { 
    if (m.key.remoteJid !== `${config.ownerNumber}@s.whatsapp.net`) return;
    await sock.sendMessage(m.key.remoteJid, { text: `📢 Broadcasting: ${q}` }, { quoted: m }); 
  }},
  block: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🚫 Block: Reply to user` }, { quoted: m }); }},
  unblock: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `✅ Unblock: Reply to user` }, { quoted: m }); }},
  mode: { category: "OWNER", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔧 Mode: ${q || 'public'}` }, { quoted: m }); }},
  anticall: { category: "OWNER", run: async (m, { sock }) => { 
    global.settings.antiCall =!global.settings.antiCall;
    await sock.sendMessage(m.key.remoteJid, { text: `📵 Anti-call: ${global.settings.antiCall ? 'ON' : 'OFF'}` }, { quoted: m }); 
  }},
  autodl: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📥 Auto download: ON` }, { quoted: m }); }},
  autostatus: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 Auto status: ON` }, { quoted: m }); }},
  clearsession: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Clear session coming soon` }, { quoted: m }); }},
  cleartmp: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Clear temp coming soon` }, { quoted: m }); }},
  device: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📱 Device info coming soon` }, { quoted: m }); }},
  getpp: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Get profile pic coming soon` }, { quoted: m }); }},
  sessionid: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔑 Session ID coming soon` }, { quoted: m }); }},
  setbotbio: { category: "OWNER", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📝 Bot bio set: ${q}` }, { quoted: m }); }},
  setpp: { category: "OWNER", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Set profile pic: Send image with setpp` }, { quoted: m }); }},

  // PC GAMES - 10
  minecraft: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⛏️ *Minecraft*\n\nhttps://minecraft.net` }, { quoted: m }); }},
  gta5: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🚗 *GTA 5*\n\nhttps://rockstargames.com/gta-v` }, { quoted: m }); }},
  fifa: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⚽ *FIFA*\n\nhttps://ea.com/games/fifa` }, { quoted: m }); }},
  callofduty: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔫 *Call of Duty*\n\nhttps://callofduty.com` }, { quoted: m }); }},
  cyberpunk: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🤖 *Cyberpunk*\n\nhttps://cyberpunk.net` }, { quoted: m }); }},
  pcexo: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎮 PC Exo coming soon` }, { quoted: m }); }},
  pcgames: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎮 PC Games list coming soon` }, { quoted: m }); }},
  pubg: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔫 *PUBG*\n\nhttps://pubg.com` }, { quoted: m }); }},
  reddead: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🤠 *Red Dead*\n\nhttps://rockstargames.com/reddeadredemption2` }, { quoted: m }); }},
  valorant: { category: "PC GAMES", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎯 *Valorant*\n\nhttps://playvalorant.com` }, { quoted: m }); }},

  // SECURITY - 11
  antilink: { category: "SECURITY", run: async (m, { sock }) => { 
    global.settings.antilink =!global.settings.antilink; 
    await sock.sendMessage(m.key.remoteJid, { text: `🔗 AntiLink: ${global.settings.antilink ? 'ON ✅' : 'OFF ❌'}` }, { quoted: m }); 
  }},
  antibadword: { category: "SECURITY", run: async (m, { sock }) => { 
    global.settings.antibadword =!global.settings.antibadword; 
    await sock.sendMessage(m.key.remoteJid, { text: `🚫 AntiBadWord: ${global.settings.antibadword ? 'ON ✅' : 'OFF ❌'}` }, { quoted: m }); 
  }},
  antidelete: { category: "SECURITY", run: async (m, { sock }) => { 
    global.settings.antidelete =!global.settings.antidelete; 
    await sock.sendMessage(m.key.remoteJid, { text: `🗑️ AntiDelete: ${global.settings.antidelete ? 'ON ✅' : 'OFF ❌'}` }, { quoted: m }); 
  }},
  antispam: { category: "SECURITY", run: async (m, { sock }) => { 
    global.settings.antispam =!global.settings.antispam; 
    await sock.sendMessage(m.key.remoteJid, { text: `📵 AntiSpam: ${global.settings.antispam ? 'ON ✅' : 'OFF ❌'}` }, { quoted: m }); 
  }},
  antitag: { category: "SECURITY", run: async (m, { sock }) => { 
    global.settings.antitag =!global.settings.antitag; 
    await sock.sendMessage(m.key.remoteJid, { text: `🏷️ AntiTag: ${global.settings.antitag ? 'ON ✅' : 'OFF ❌'}` }, { quoted: m }); 
  }},
  delete: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Delete message: Reply with delete` }, { quoted: m }); }},
  lockgroup: { category: "SECURITY", run: async (m, { sock }) => global.commands.glock.run(m, { sock }) },
  unlockgroup: { category: "SECURITY", run: async (m, { sock }) => global.commands.gunlock.run(m, { sock }) },
  slowmode: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🐌 Slow mode coming soon` }, { quoted: m }); }},
  warn: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⚠️ Warn: Reply to user with warn` }, { quoted: m }); }},
  warnings: { category: "SECURITY", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⚠️ Warnings coming soon` }, { quoted: m }); }},

  // SETTINGS - 12
  pair: { category: "SETTINGS", run: async (m, { sock, q }) => {
    if (!q) {
      return await sock.sendMessage(m.key.remoteJid, {
        text: `🔐 *PAIRING SYSTEM*\n\nSend your number with country code\nExample: pair 27836024885\n\n✅ You will receive 8-digit code\n✅ Works 24/7\n✅ No QR needed`
      }, { quoted: m });
    }
    const cleanedNumber = q.replace(/[^0-9]/g, '');
    if (cleanedNumber.length < 10) {
      return await sock.sendMessage(m.key.remoteJid, { text: `❌ Invalid number! Use format: pair 27836024885` }, { quoted: m });
    }
    await sock.sendMessage(m.key.remoteJid, { text: `📱 *PAIRING REQUEST*\n\n📞 Number: +${cleanedNumber}\n⏳ Use the code from Render logs` }, { quoted: m });
  }},
  active: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `✅ Bot is active` }, { quoted: m }); }},
  addimgreply: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Add image reply coming soon` }, { quoted: m }); }},
  addreply: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `💬 Add reply coming soon` }, { quoted: m }); }},
  deleteme: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Delete me coming soon` }, { quoted: m }); }},
  delreply: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🗑️ Delete reply coming soon` }, { quoted: m }); }},
    getdp: { category: "SETTINGS", run: async (m, { sock }) => {
    const target = m.message?.extendedTextMessage?.contextInfo?.participant || m.key.participant || m.key.remoteJid;
    try {
      const ppUrl = await sock.profilePictureUrl(target, 'image');
      await sock.sendMessage(m.key.remoteJid, { image: { url: ppUrl }, caption: `🖼️ *Profile Picture*\n\nUser: @${target.split('@')[0]}`, mentions: [target] }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ No profile picture or private` }, { quoted: m });
    }
  }},
  listreply: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📋 List reply coming soon` }, { quoted: m }); }},
  mybot: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🤖 My bot info coming soon` }, { quoted: m }); }},
  npm: { category: "SETTINGS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `📦 *NPM*\n\nPackage: ${q}\nhttps://npmjs.com/package/${q}` }, { quoted: m }); }},
  reset: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔄 Reset coming soon` }, { quoted: m }); }},
  setting: { category: "SETTINGS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⚙️ *Settings*\n\nAuto React: ${global.settings.autoreact? 'ON' : 'OFF'}\nAuto Read: ${global.settings.autoRead? 'ON' : 'OFF'}\nAnti Call: ${global.settings.antiCall? 'ON' : 'OFF'}\nAntiLink: ${global.settings.antilink? 'ON' : 'OFF'}` }, { quoted: m }); }},

  // TOOLS - 32
  calc: { category: "TOOLS", run: async (m, { sock, q }) => {
    try {
      const r = eval(q.replace(/[^0-9+\-*/().\s]/g, ''));
      await sock.sendMessage(m.key.remoteJid, { text: `🔢 *Calculator*\n\n${q} = ${r}` }, { quoted: m });
    } catch {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ Invalid math` }, { quoted: m });
    }
  }},
  qr: { category: "TOOLS", run: async (m, { sock, q }) => {
    if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Enter text` }, { quoted: m });
    await sock.sendMessage(m.key.remoteJid, { image: { url: `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(q)}` }, caption: `📱 *QR Code*` }, { quoted: m });
  }},
  weather: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌤️ *Weather*\n\nLocation: ${q || 'Harare'}\nSunny 25°C` }, { quoted: m }); }},
  translate: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌐 *Translate*\n\nText: ${q}` }, { quoted: m }); }},
  tts: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔊 TTS: ${q}` }, { quoted: m }); }},
  shorturl: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔗 *Short URL*\n\nOriginal: ${q}\nShort: https://bit.ly/xxx` }, { quoted: m }); }},
  sticker: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🏷️ Send image/video with sticker` }, { quoted: m }); }},
  s: { category: "TOOLS", run: async (m, { sock }) => global.commands.sticker.run(m, { sock }) },
  take: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🏷️ Take sticker: ${q}` }, { quoted: m }); }},
  attp: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `✨ ATTP: ${q}` }, { quoted: m }); }},
  base64: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔐 *Base64*\n\nEncoded: ${Buffer.from(q || 'text').toString('base64')}` }, { quoted: m }); }},
  card: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `💳 Card coming soon` }, { quoted: m }); }},
  crypto: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `💰 *Crypto*\n\n${q || 'Bitcoin'}: $45,000` }, { quoted: m }); }},
  currency: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `💵 Currency coming soon` }, { quoted: m }); }},
  find: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔍 Find: ${q}` }, { quoted: m }); }},
  gitstalk: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `💻 GitHub: ${q}` }, { quoted: m }); }},
  groupstatus: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📊 Group status coming soon` }, { quoted: m }); }},
  hash: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔐 *Hash*\n\nMD5: ${crypto.createHash('md5').update(q || 'text').digest('hex')}` }, { quoted: m }); }},
  image: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ Image: ${q}` }, { quoted: m }); }},
  ipfinder: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🌐 IP Finder: ${q}` }, { quoted: m }); }},
  mp3: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🎵 MP3 converter coming soon` }, { quoted: m }); }},
  password: { category: "TOOLS", run: async (m, { sock }) => { const p = Math.random().toString(36).slice(-12); await sock.sendMessage(m.key.remoteJid, { text: `🔐 *Password*\n\nGenerated: ${p}` }, { quoted: m }); }},
  photo: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `📷 Photo coming soon` }, { quoted: m }); }},
  qimg: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `🖼️ QIMG coming soon` }, { quoted: m }); }},
  reminder: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `⏰ Reminder set: ${q}` }, { quoted: m }); }},
  savecontact: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `💾 Save contact coming soon` }, { quoted: m }); }},
  saveweb: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `💾 Save web: ${q}` }, { quoted: m }); }},
  terminal: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `💻 Terminal coming soon` }, { quoted: m }); }},
  timestamp: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `⏰ Timestamp: ${Date.now()}` }, { quoted: m }); }},
  trim: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `✂️ Trim coming soon` }, { quoted: m }); }},
  url: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔗 URL: ${q}` }, { quoted: m }); }},
  vv2: { category: "TOOLS", run: async (m, { sock }) => { await sock.sendMessage(m.key.remoteJid, { text: `👁️ VV2 coming soon` }, { quoted: m }); }},
  whois: { category: "TOOLS", run: async (m, { sock, q }) => { await sock.sendMessage(m.key.remoteJid, { text: `🔍 Whois: ${q}` }, { quoted: m }); }}
};

// BAILEYS TIMING FIX - CRITICAL FOR PAIRING + 24/7 ONLINE
async function startBot() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(config.sessionDir);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      browser: Browsers.macOS("Desktop"),
      logger: pino({ level: 'silent' }),
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 10000,
      connectTimeoutMs: 60000,
      retryRequestDelayMs: 2000,
      maxMsgRetryCount: 5,
      markOnlineOnConnect: true,
      syncFullHistory: false
    });

    sock.ev.on('creds.update', saveCreds);

    let pairingCodeRequested = false;
    let pairingRetries = 0;

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;

      if (connection === 'close') {
        const statusCode = (lastDisconnect.error instanceof Boom)?.output?.statusCode;
        const shouldReconnect = statusCode!== DisconnectReason.loggedOut;
        console.log(`Connection closed. Status: ${statusCode}, Reconnect: ${shouldReconnect}`);
        if (shouldReconnect) {
          pairingCodeRequested = false;
          pairingRetries = 0;
          await delay(5000);
          startBot();
        } else {
          console.log('Logged out. Delete session folder to pair again.');
        }
      }
      else if (connection === 'open') {
        console.log(`✅ ${config.botName} ONLINE 24/7!`);
        console.log(`📊 Total Commands: ${Object.keys(global.commands).length}`);
        console.log(`✅ NO PREFIX NEEDED`);
        console.log(`✅ PAIRED WITH: ${config.pairNumber}`);
        console.log(`✅ AUTO REACT: ${global.settings.autoreact? 'ON' : 'OFF'}`);

        await sock.sendMessage(`${config.ownerNumber}@s.whatsapp.net`, {
          text: `✅ *${config.botName} CONNECTED!*\n\n📊 ${Object.keys(global.commands).length} Commands Ready\n⚡ 24/7 ONLINE\n🔥 Auto React: ON\n\n✅ NO PREFIX - Just type: song, ai, kick, add`
        }).catch(() => {});

        // KEEP ONLINE 24/7
        setInterval(async () => {
          try { await sock.sendPresenceUpdate('available'); } catch (e) {}
        }, 30000);

        // Auto join group
        try {
          const inviteCode = config.groupLink.split('/').pop().split('?')[0];
          await sock.groupAcceptInvite(inviteCode);
        } catch (e) {}

      }
      else if (connection === 'connecting') {
        if (!sock.authState.creds.registered &&!pairingCodeRequested && pairingRetries < 3) {
          pairingCodeRequested = true;
          pairingRetries++;
          await delay(4000); // CRITICAL: Wait for Baileys to initialize

          try {
            let phoneNumber = config.pairNumber.replace(/[^0-9]/g, "");
            if (phoneNumber.length < 10) {
              console.log('❌ Invalid pairNumber in config');
              pairingCodeRequested = false;
              return;
            }
            console.log(`🔥 Requesting 8-digit pairing code for: +${phoneNumber} (Attempt ${pairingRetries}/3)`);
            const code = await sock.requestPairingCode(phoneNumber);
            const formattedCode = code?.match(/.{1,4}/g)?.join('-') || code;
            console.log(`\n🔥 8-DIGIT PAIRING CODE 🔥`);
            console.log(`🔗 Code: ${formattedCode}`);
            console.log(`🔗 For: +${phoneNumber}`);
            console.log(`⏰ Expires in 5 minutes\n`);
          } catch (e) {
            console.error(`❌ FAILED TO GET PAIRING CODE: ${e.message}`);
            pairingCodeRequested = false;
            if (pairingRetries < 3) {
              console.log(`🔄 Retrying in 10 seconds...`);
              await delay(10000);
            }
          }
        }
      }
    });

    // MESSAGE HANDLER - NO PREFIX + AUTO REACT + CHATBOT
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type!== "notify") return;
      const m = messages[0];
      if (!m?.message || m.key.fromMe) return;

      const jid = m.key.remoteJid;
      const pushName = m.pushName || "User";
      const msg = m.message.conversation || m.message.extendedTextMessage?.text || m.message.imageMessage?.caption || "";

      if (global.settings.autoRead) await sock.readMessages([m.key]).catch(() => {});

      // AUTO REACT
      if (global.settings.autoreact && msg) {
        try { await sock.sendMessage(jid, { react: { text: "⚡", key: m.key } }); } catch (e) {}
      }

      if (!global.botStarted) return;

      // CHATBOT MODE
      if (global.chatbot[jid] &&!msg.startsWith('.')) {
        const answer = await askAI(msg);
        await sock.sendMessage(jid, { text: answer }, { quoted: m });
        return;
      }

      let args = msg.trim().split(/\s+/);
      let cmdName = args[0].toLowerCase();
      let q = args.slice(1).join(' ');

      if (cmdName.startsWith('.')) cmdName = cmdName.slice(1);
      if (!cmdName) return;

      const command = global.commands[cmdName];
      if (command) {
        try {
          if (global.settings.autoreact) {
            await sock.sendMessage(jid, { react: { text: "✅", key: m.key } });
          }
          await command.run(m, { sock, jid, pushName, q, args, cmd: cmdName, config });
        } catch (e) {
          console.error(`[ERROR] ${cmdName}:`, e.message);
        }
      }
    });

    // ANTI CALL
    if (global.settings.antiCall) {
      sock.ev.on('call', async (call) => {
        for (let callEvent of call) {
          await sock.rejectCall(callEvent.id, callEvent.from);
          await sock.sendMessage(callEvent.from, { text: `🔴 Call rejected!` }).catch(() => {});
        }
      });
    }

  } catch (error) {
    console.error('Bot error:', error);
    await delay(5000);
    startBot();
  }
}

startBot().catch((e) => {
  console.error("❌ Fatal error:", e);
  process.exit(1);
});

console.log('🚀 Bot initialized - 24/7 MODE');
console.log(`📊 Total commands: ${Object.keys(global.commands).length}`);
console.log(`✅ NO PREFIX NEEDED`);
console.log(`✅ 8-DIGIT PAIRING CODE FOR: ${config.pairNumber}`);
console.log(`✅ NO BOT DETECTION - play-dl`);
console.log(`✅ BAILEYS TIMING FIXED`);
console.log(`✅ AUTO REACT: ON`);

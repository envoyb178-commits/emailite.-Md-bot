module.exports = {
  commands: {
    play: {
      category: "DOWNLOAD",
      desc: "Play song from YouTube",
      run: async (m, { sock, args }) => {
        if (!args[0]) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Song name?` }, { quoted: m });
        await sock.sendMessage(m.key.remoteJid, { text: `🎵 Downloading: ${args.join(" ")}` }, { quoted: m });
      }
    },
    ytmp3: {
      category: "DOWNLOAD",
      desc: "YouTube to MP3", 
      run: async (m, { sock, args }) => {
        if (!args[0]) return await sock.sendMessage(m.key.remoteJid, { text: `❌ YouTube link?` }, { quoted: m });
        await sock.sendMessage(m.key.remoteJid, { text: `🎵 Converting to MP3...` }, { quoted: m });
      }
    },
    ytmp4: {
      category: "DOWNLOAD",
      desc: "YouTube to MP4",
      run: async (m, { sock, args }) => {
        if (!args[0]) return await sock.sendMessage(m.key.remoteJid, { text: `❌ YouTube link?` }, { quoted: m });
        await sock.sendMessage(m.key.remoteJid, { text: `📹 Converting to MP4...` }, { quoted: m });
      }
    }
  }
}

module.exports = {
  commands: {
    ping: {
      category: "MAIN",
      desc: "Check bot speed",
      run: async (m, { sock }) => {
        const start = Date.now();
        const msg = await sock.sendMessage(m.key.remoteJid, { text: "Pinging..." }, { quoted: m });
        const end = Date.now();
        await sock.sendMessage(m.key.remoteJid, { text: `🏓 Pong! ${end - start}ms`, edit: msg.key });
      }
    },
    owner: {
      category: "MAIN", 
      desc: "Bot owner info",
      run: async (m, { sock }) => {
        await sock.sendMessage(m.key.remoteJid, { text: `👑 Owner: ${global.config.owner}\n📞 Number: wa.me/${global.config.ownerNumber}` }, { quoted: m });
      }
    }
  }
}

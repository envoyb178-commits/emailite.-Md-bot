module.exports = {
  commands: {
    menu: {
      category: "MAIN",
      desc: "Show bot menu",
      run: async (m, { sock, pushName, prefix }) => {
        const text = global.buildMenu(pushName);
        await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
      }
    },
    allmenu: {
      category: "MAIN", 
      desc: "Show all 350+ commands",
      run: async (m, { sock }) => {
        const text = global.allMenu();
        await sock.sendMessage(m.key.remoteJid, { text }, { quoted: m });
      }
    },
    alive: {
      category: "MAIN",
      desc: "Check if bot is alive", 
      run: async (m, { sock }) => {
        await sock.sendMessage(m.key.remoteJid, { text: `✅ ${global.config.botName} is Alive!\n\n⚡ Prefix: ${global.config.prefix}\n📊 Commands: ${Object.keys(global.commands).length}+` }, { quoted: m });
      }
    }
  }
}

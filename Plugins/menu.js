module.exports = {
  commands: {
    menu: { category: 'MAIN', desc: 'Show menu', run: async (m, { sock, jid, pushName }) => {
      await sock.sendMessage(jid, { text: global.buildMenu(pushName) }, { quoted: m });
    }},
    allmenu: { category: 'MAIN', desc: 'All commands', run: async (m, { sock, jid }) => {
      await sock.sendMessage(jid, { text: global.allMenu() }, { quoted: m });
    }},
    help: { category: 'MAIN', desc: 'Help', run: async (m, { sock, jid }) => {
      await sock.sendMessage(jid, { text: global.allMenu() }, { quoted: m });
    }},
    ping: { category: 'MAIN', desc: 'Speed test', run: async (m, { sock, jid }) => {
      const start = Date.now();
      await sock.sendMessage(jid, { text: `Pong! ✅\nSpeed: ${Date.now() - start}ms` }, { quoted: m });
    }},
    alive: { category: 'MAIN', desc: 'Bot status', run: async (m, { sock, jid, config, getRuntime, getRamUsed }) => {
      await sock.sendMessage(jid, { text: `*${config.botName}*\n\n✅ Online 24/7\n⏰ Uptime: ${getRuntime()}\n📊 RAM: ${getRamUsed()}` }, { quoted: m });
    }},
    owner: { category: 'MAIN', desc: 'Owner info', run: async (m, { sock, jid, config }) => {
      await sock.sendMessage(jid, { text: `*Owner:* ${config.owner}\n*Number:* wa.me/${config.ownerNumber}` }, { quoted: m });
    }},
    uptime: { category: 'MAIN', desc: 'Uptime', run: async (m, { sock, jid, getRuntime, getRamUsed, getRamTotal }) => {
      await sock.sendMessage(jid, { text: `⏰ Uptime: ${getRuntime()}\n💾 RAM: ${getRamUsed()}/${getRamTotal()}` }, { quoted: m });
    }},
    system: { category: 'MAIN', desc: 'System info', run: async (m, { sock, jid, getRuntime, getRamUsed, getRamTotal }) => {
      await sock.sendMessage(jid, { text: `*System Info*\n\nRAM: ${getRamUsed()}/${getRamTotal()}\nUptime: ${getRuntime()}\nPlatform: ${process.platform}\nNode: ${process.version}` }, { quoted: m });
    }},
    jid: { category: 'MAIN', desc: 'Get JID', run: async (m, { sock, jid }) => {
      await sock.sendMessage(jid, { text: `Your JID: ${m.key.participant || jid}` }, { quoted: m });
    }}
  }
}
module.exports = {
  commands: {
    ai: {
      category: "AI",
      desc: "Ask AI anything",
      run: async (m, { sock, args }) => {
        const q = args.join(" ");
        if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ What do you want to ask?\nExample: ${global.config.prefix}ai hello` }, { quoted: m });
        await sock.sendMessage(m.key.remoteJid, { text: `🤖 AI Response for: ${q}\n\nThis is a demo. Connect OpenAI/Gemini API here.` }, { quoted: m });
      }
    },
    gpt: {
      category: "AI", 
      desc: "ChatGPT",
      run: async (m, { sock, args }) => {
        const q = args.join(" ");
        if (!q) return await sock.sendMessage(m.key.remoteJid, { text: `❌ Ask something` }, { quoted: m });
        await sock.sendMessage(m.key.remoteJid, { text: `ChatGPT: ${q} - API needed` }, { quoted: m });
      }
    }
  }
}

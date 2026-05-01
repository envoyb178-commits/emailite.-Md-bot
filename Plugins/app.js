module.exports = {
  commands: {
    ai: { category: 'AI', desc: 'Ask AI', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.ai <question>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🤖 AI: ${q}\n\n📝 Add OpenAI API` }, { quoted: m });
    }},
    gpt: { category: 'AI', desc: 'ChatGPT', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.gpt <question>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🤖 GPT: ${q}` }, { quoted: m });
    }},
    gemini: { category: 'AI', desc: 'Gemini AI', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.gemini <question>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🤖 Gemini: ${q}` }, { quoted: m });
    }},
    claude: { category: 'AI', desc: 'Claude AI', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.claude <question>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🤖 Claude: ${q}` }, { quoted: m });
    }},
    chatai: { category: 'AI', desc: 'Chat AI', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.chatai <question>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🤖 Chat: ${q}` }, { quoted: m });
    }},
    imagine: { category: 'AI', desc: 'AI Image', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.imagine <prompt>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Generating: ${q}` }, { quoted: m });
    }},
    img: { category: 'AI', desc: 'Generate image', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.img <prompt>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Image: ${q}` }, { quoted: m });
    }},
    chatbot: { category: 'AI', desc: 'Chatbot', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.chatbot <msg>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🤖 Bot: ${q}` }, { quoted: m });
    }},
    logo: { category: 'LOGO', desc: 'Logo maker', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.logo <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Logo: ${q}` }, { quoted: m });
    }},
    logochrome: { category: 'LOGO', desc: 'Chrome logo', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.logochrome <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Chrome: ${q}` }, { quoted: m });
    }},
    logofire: { category: 'LOGO', desc: 'Fire logo', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.logofire <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Fire: ${q}` }, { quoted: m });
    }},
    logogold: { category: 'LOGO', desc: 'Gold logo', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.logogold <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Gold: ${q}` }, { quoted: m });
    }},
    logosilver: { category: 'LOGO', desc: 'Silver logo', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.logosilver <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Silver: ${q}` }, { quoted: m });
    }},
    logoshadow: { category: 'LOGO', desc: 'Shadow logo', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.logoshadow <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Shadow: ${q}` }, { quoted: m });
    }},
    logoglitch: { category: 'LOGO', desc: 'Glitch logo', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.logoglitch <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Glitch: ${q}` }, { quoted: m });
    }},
    logo3d: { category: 'LOGO', desc: '3D logo', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.logo3d <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 3D: ${q}` }, { quoted: m });
    }},
    logocartoon: { category: 'LOGO', desc: 'Cartoon logo', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.logocartoon <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Cartoon: ${q}` }, { quoted: m });
    }},
    logoneon: { category: 'LOGO', desc: 'Neon logo', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.logoneon <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Neon: ${q}` }, { quoted: m });
    }},
    blackpink: { category: 'LOGO', desc: 'Blackpink logo', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.blackpink <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Blackpink: ${q}` }, { quoted: m });
    }},
    marvel: { category: 'LOGO', desc: 'Marvel logo', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.marvel <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Marvel: ${q}` }, { quoted: m });
    }},
    harrypotter: { category: 'LOGO', desc: 'Harry Potter logo', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.harrypotter <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Harry Potter: ${q}` }, { quoted: m });
    }},
    wolf: { category: 'LOGO', desc: 'Wolf logo', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.wolf <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Wolf: ${q}` }, { quoted: m });
    }},
    matrix: { category: 'LOGO', desc: 'Matrix logo', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.matrix <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Matrix: ${q}` }, { quoted: m });
    }},
    gradient: { category: 'LOGO', desc: 'Gradient logo', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.gradient <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Gradient: ${q}` }, { quoted: m });
    }},
    pornhub: { category: 'LOGO', desc: 'Pornhub logo', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.pornhub <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Pornhub: ${q}` }, { quoted: m });
    }},
    love: { category: 'LOGO', desc: 'Love logo', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.love <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Love: ${q}` }, { quoted: m });
    }},
    shadow: { category: 'LOGO', desc: 'Shadow logo', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.shadow <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Shadow: ${q}` }, { quoted: m });
    }},
    magma: { category: 'LOGO', desc: 'Magma logo', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.magma <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Magma: ${q}` }, { quoted: m });
    }},
    toxic: { category: 'LOGO', desc: 'Toxic logo', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.toxic <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Toxic: ${q}` }, { quoted: m });
    }},
    rainbow: { category: 'LOGO', desc: 'Rainbow logo', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.rainbow <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Rainbow: ${q}` }, { quoted: m });
    }},
    blood: { category: 'LOGO', desc: 'Blood logo', run: async (m, { sock, jid, q }) => {
      if (!q) return await sock.sendMessage(jid, { text: `Usage:.blood <text>` }, { quoted: m });
      await sock.sendMessage(jid, { text: `🎨 Blood: ${q}` }, { quoted: m });
    }}
  }
}
const toolCmds = ['sticker','s','take','photo','qr','shorturl','url','weather','translate','tts','calc','password','hash','base64','timestamp','reminder','savecontact','vv2','crypto','currency','saveweb','terminal','card','qimg','groupstatus','attp','gitstalk','ipfinder','whois','trim','find','image','mp3'];
const eduCmds = ['subjects','maths','english','science','shona','history','geography','commerce','biology','chemistry','physics','pastpapers','syllabus'];
const audioCmds = ['karaoke','reverb','bass','nightcore','slow','fast','robot','echo'];
const funCmds = ['trivia','truth','dare','8ball','dice','coin','random','ship','simp','meme','joke','quote','compliment','insult','flirt','roast','riddle','goodnight','roseday','wiki','count','reverse','palindrome','fun','kill','boom','report'];
const newsCmds = ['news','cricket','livecric','football','sports'];
const settingCmds = ['setting','mybot','reset','deleteme','addreply','addimgreply','delreply','listreply','pair','active','npm','getdp'];
const gameCmds = ['pcgames','gta5','minecraft','valorant','pubg','fifa','callofduty','cyberpunk','reddead','pcexo','modapk','netflix','youtube','whatsapp','instagram','capcut','lightroom'];

const commands = {};
[...toolCmds,...eduCmds,...audioCmds,...funCmds,...newsCmds,...settingCmds,...gameCmds].forEach(cmd => {
  let category = 'TOOLS';
  if (eduCmds.includes(cmd)) category = 'EDUCATION';
  if (audioCmds.includes(cmd)) category = 'AUDIO';
  if (funCmds.includes(cmd)) category = 'FUN';
  if (newsCmds.includes(cmd)) category = 'NEWS';
  if (settingCmds.includes(cmd)) category = 'SETTINGS';
  if (gameCmds.includes(cmd)) category = cmd.includes('apk') || cmd.includes('netflix') || cmd.includes('youtube') || cmd.includes('whatsapp') || cmd.includes('instagram') || cmd.includes('capcut') || cmd.includes('lightroom')? 'ANDROID APK' : 'PC GAMES';
  
  commands[cmd] = {
    category,
    desc: cmd,
    run: async (m, { sock, jid, q }) => {
      if (cmd === '8ball') {
        const answers = ['Yes','No','Maybe','Definitely','Ask again','Without a doubt','Absolutely not'];
        return await sock.sendMessage(jid, { text: `🎱 ${answers[Math.floor(Math.random() * answers.length)]}` }, { quoted: m });
      }
      if (cmd === 'dice') return await sock.sendMessage(jid, { text: `🎲 You rolled: ${Math.floor(Math.random() * 6) + 1}` }, { quoted: m });
      if (cmd === 'coin') return await sock.sendMessage(jid, { text: `🪙 ${Math.random() > 0.5? 'Heads' : 'Tails'}` }, { quoted: m });
      if (cmd === 'calc' && q) {
        try {
          return await sock.sendMessage(jid, { text: `🧮 Result: ${eval(q)}` }, { quoted: m });
        } catch {
          return await sock.sendMessage(jid, { text: `❌ Invalid calculation` }, { quoted: m });
        }
      }
      if (!q && ['translate','tts','weather','qr','shorturl','url','password','hash','base64','reminder','crypto','currency','ipfinder','whois','wiki'].includes(cmd)) {
        return await sock.sendMessage(jid, { text: `Usage:.${cmd} <input>` }, { quoted: m });
      }
      await sock.sendMessage(jid, { text: `⚙️.${cmd}\n\n📝 Add API to enable` }, { quoted: m });
    }
  };
});

module.exports = { commands };
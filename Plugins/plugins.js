const downloadCmds = ['song','play','music','lyrics','ytsearch','ytmp3','ytmp4','yt','video','tiktok','tt','ig','insta','fb','twitter','threads','spotify','gimg','pinterest','ringtone','apk','mf','mediafire','ss'];
const ownerCmds = ['mode','autostatus','anticall','autodl','setpp','setbotbio','clearsession','cleartmp','block','unblock','broadcast','getpp','device','sessionid','restart'];
const groupCmds = ['ban','unban','promote','demote','kick','mute','unmute','add','kickall','leavegc','leave','setname','gname','setdesc','gdesc','revoke','tagall','tag','hidetag','tagadmins','staff','groupinfo','ginfo','invite','glock','gunlock','joinrequests','gpp','removegpp','join','creategroup','gjids'];
const securityCmds = ['antilink','antitag','antibadword','antidelete','slowmode','lockgroup','unlockgroup','warn','warnings','delete','antispam'];
const commands = {};

[...downloadCmds,...ownerCmds,...groupCmds,...securityCmds].forEach(cmd => {
  let category = 'TOOLS';
  if (downloadCmds.includes(cmd)) category = 'DOWNLOAD';
  if (ownerCmds.includes(cmd)) category = 'OWNER';
  if (groupCmds.includes(cmd)) category = 'GROUP';
  if (securityCmds.includes(cmd)) category = 'SECURITY';
  
  commands[cmd] = {
    category,
    desc: cmd,
    owner: ownerCmds.includes(cmd),
    group: groupCmds.includes(cmd),
    run: async (m, { sock, jid, q, isGroup }) => {
      if (cmd === 'tagall' && isGroup) {
        const groupMetadata = await sock.groupMetadata(jid);
        const participants = groupMetadata.participants;
        let txt = `📢 *Tag All*\n\n`;
        participants.forEach(p => txt += `@${p.id.split('@')[0]}\n`);
        return await sock.sendMessage(jid, { text: txt, mentions: participants.map(p => p.id) }, { quoted: m });
      }
      if (!q && ['song','play','music','lyrics','ytsearch','ytmp3','ytmp4','yt','video','tiktok','tt','ig','insta','fb','twitter','threads','spotify','gimg','pinterest'].includes(cmd)) {
        return await sock.sendMessage(jid, { text: `Usage:.${cmd} <query/url>` }, { quoted: m });
      }
      await sock.sendMessage(jid, { text: `⚙️.${cmd} executed\n\n📝 Add API to enable` }, { quoted: m });
    }
  };
});

module.exports = { commands };
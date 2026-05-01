const { Sparky } = require('../lib');
const config = require('../config');
const fs = require('fs');

let bans = JSON.parse(fs.readFileSync('./database/bans.json', 'utf8') || '{}');
let warns = JSON.parse(fs.readFileSync('./database/warns.json', 'utf8') || '{}');

Sparky({
    name: "ban",
    fromMe: true,
    desc: "Ban a user in group",
    category: "group",
}, async ({ m, args, client }) => {
    if (!m.isGroup) return;
    let user = m.mentionedUsers[0] || (m.quoted ? m.quoted.sender : null);
    if (!user) return m.reply("Tag or reply to user");
    if (!await m.isBotAdmin(m.sender)) return m.reply("I'm not admin");
    if (!bans[m.jid]) bans[m.jid] = [];
    if (!bans[m.jid].includes(user)) bans[m.jid].push(user);
    fs.writeFileSync('./database/bans.json', JSON.stringify(bans));
    await m.reply(`🚫 Banned @${user.split('@')[0]}`, { mentions: [user] });
});

Sparky({
    name: "kick",
    fromMe: true,
    desc: "Kick user",
    category: "group",
}, async ({ m }) => {
    if (!m.isGroup) return;
    let user = m.mentionedUsers[0] || (m.quoted ? m.quoted.sender : null);
    if (!user) return;
    await client.groupParticipantsUpdate(m.jid, [user], 'remove');
    await m.reply(`👢 Kicked`);
});

Sparky({
    name: "promote",
    fromMe: true,
    desc: "Make admin",
    category: "group",
}, async ({ m, client }) => {
    let user = m.mentionedUsers[0] || (m.quoted ? m.quoted.sender : null);
    if (!user) return;
    await client.groupParticipantsUpdate(m.jid, [user], 'promote');
    await m.reply(`👑 Promoted`);
});

// Add tagall, hidetag, welcome, goodbye, lock, unlock, etc. similarly...
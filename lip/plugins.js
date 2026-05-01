/* ============================================
   EMAILLITE BOT – PLUGIN HANDLER
   Manages commands, prefixes, and public/private mode
   ============================================ */

const config = require('../config.js');

// Determine the command prefix
let prefix;
if (config.HANDLERS === "MULTI_HANDLERS") {
    prefix = '^';
} else {
    prefix = config.HANDLERS;
}

// Handle multiple prefixes (e.g., ".", "!")
let finalPrefix;
if (config.HANDLERS.split('').length > 1 && config.HANDLERS.split('')[0] === config.HANDLERS.split('')[1]) {
    finalPrefix = config.HANDLERS;
} else {
    // Check if prefix contains special regex characters
    const regexTest = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/;
    if (regexTest.test(prefix) && prefix !== '^') {
        finalPrefix = '^[' + prefix + ']';
    } else {
        finalPrefix = prefix;
    }
}

// Add optional "?" for commands that might have no extra args
if (config.dontAddCommandList && finalPrefix.includes('^[')) {
    finalPrefix = finalPrefix + '?';
}

// Store all registered commands
const commands = [];

/**
 * Registers a command (plugin) into the bot.
 * @param {Object} cmd - Command object with name, function, category, etc.
 * @returns {Object} The registered command object.
 */
function Sparky(cmd) {
    // Attach the compiled regex pattern: prefix + commandName + optional arguments
    cmd.pattern = new RegExp(
        finalPrefix + '\\s*' + cmd.name + '\\s*(?!\\S)(.*)$',
        'i'
    );

    // Defaults for missing properties
    if (cmd.on === undefined && cmd.name === undefined) {
        cmd.on = 'message';
        cmd.fromMe = false;
    }

    if (!(cmd.name === undefined && cmd.name)) {
        cmd.dontAddCommandList = false;
    }

    if (cmd.on) {
        cmd.dontAddCommandList = true;
    }

    if (!cmd.category) {
        cmd.category = 'misc';
    }

    // Add to commands array
    commands.push(cmd);
    return cmd;
}

// Determine if bot is in public mode (all users) or private (owner/sudo only)
const isPublic = (config.WORK_TYPE && config.WORK_TYPE.toLowerCase() === 'private') ? false : true;

// Exports
module.exports = {
    commands,
    Sparky,
    isPublic
};
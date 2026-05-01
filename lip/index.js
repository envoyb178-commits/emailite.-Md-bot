/* =================================================
   EMAILLITE BOT – CORE MODULE EXPORTS
   Clean version of the ASWINSPARKY structure
   ================================================= */

// Import required modules
const { commands, Sparky, isPublic, plugins } = require('./plugins');
const { YtInfo, yts, yta, ytv, spdl } = require('./youtube');
const { serialize } = require('./serialize');
const { whatsappAutomation, callAutomation } = require('./whatsappController');
const { warnDB } = require('./database/warn');
const { externalPlugins, installExternalPlugins } = require('./database/external_plugins');
const { setData, getData } = require('./database');
const { uploadMedia, handleMediaUpload, addMessage, getMessages, askGroq } = require('./tools');

// Global sudo users (owner numbers)
global.sudoUsers = ['1234567890']; // Replace with your number(s) – Emaillite

// Export all components for use across the bot
module.exports = {
    commands,
    Sparky,
    YtInfo,
    yts,
    yta,
    ytv,
    spdl,
    isPublic,
    serialize,
    whatsappAutomation,
    callAutomation,
    externalPlugins,
    installExternalPlugins,
    warnDB,
    uploadMedia,
    handleMediaUpload,
    addMessage,
    getMessages,
    askGroq,
    setData,
    getData
};
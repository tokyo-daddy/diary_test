const crypto = require('crypto');

function generateInviteCode() {
    // 8文字のランダム英数字 (大文字)
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    return code;
}

module.exports = { generateInviteCode };

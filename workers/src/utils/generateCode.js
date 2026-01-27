// Web Crypto APIを使用
export function generateInviteCode() {
    // 8文字のランダム英数字 (大文字)
    // crypto.randomUUID() の最初のセグメント(8文字)を使用
    return crypto.randomUUID().split('-')[0].toUpperCase();
}

import CryptoJS from 'crypto-js';

export const encryptMessage = (message: string, key: string): string => {
  return CryptoJS.AES.encrypt(message, key).toString();
};

export const decryptMessage = (encryptedMessage: string, key: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};

export const generateSessionKey = (): string => {
  return CryptoJS.lib.WordArray.random(16).toString();
};
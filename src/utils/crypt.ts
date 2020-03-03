import crypto from "crypto";
import CryptoJs from "crypto-js";

export const encrypt = (data: string) => {
  let encrypted_data: string = CryptoJs.AES.encrypt(
    data,
    process.env.SECRET
  ).toString();
  return encrypted_data;
};

export const decrypt = (data: string) => {
  let decrypted_data = CryptoJs.AES.decrypt(data, process.env.SECRET);
  return decrypted_data.toString(CryptoJs.enc.Utf8);
};



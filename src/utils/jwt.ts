import jwt from "jsonwebtoken";

import { encrypt, decrypt } from "./crypt";

class Token {
  data: any;
  token: string;
  configuration_token = {
    algorithm: "HS256"
  };

  constructor(data: object) {
    this.data = {
      issuer: process.env.AUTOR,
      audience: process.env.APP_NAME,
      ...data
    };
    this.token = "";
  }

  static decrypt_data(object_data: any) {
    return async () => {
      try {
        let llave_objeto = Object.keys(object_data);
        let nuevo = {};
        llave_objeto.map((i: string) => {
          if (i != "iat" && i != "exp") {
            nuevo = { ...nuevo, [i]: decrypt(object_data[i]) };
          }
        });
        return Promise.resolve(nuevo);
      } catch (error) {
        Promise.reject(error);
      }
    };
  }

  _crypt_data() {
    return async () => {
      try {
        let llave_objeto = Object.keys(this.data);
        let nuevo = {};
        llave_objeto.map(
          (i: string) => (nuevo = { ...nuevo, [i]: encrypt(this.data[i]) })
        );
        return Promise.resolve(nuevo);
      } catch (error) {
        Promise.reject(error);
      }
    };
  }

  create_token(expiresIn: string = "24h", keyid: string, privateKey: string) {
    return new Promise(async (resolve, reject) => {
      this.data = { ...(await this._crypt_data()()) };

      try {
        this.token = await jwt.sign(this.data, privateKey, {
          algorithm: "RS256",
          expiresIn,
          keyid,
          issuer: process.env.APP_NAME,
          audience: "GENERAL"
        });
        resolve(this.token);
      } catch (error) {
        reject(error);
      }
    });
  }

  static validateToken(token: string) {
    try {
      return Promise.resolve(jwt.verify(token, process.env.SECRET));
    } catch (err) {
      return Promise.reject(err);
    }
  }
}

export default Token;

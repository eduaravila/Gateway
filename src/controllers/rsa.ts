import crypto from "crypto";
import fs from "fs";
import path from "path";
import uuid from "uuid/v4";
import moment from "moment";
import { AuthenticationError, ApolloError } from "apollo-server-express";

const generate_pair = async (): Promise<{
  privateKey: string;
  publicKey: string;
}> => {
  try {
    let llaves = await crypto.generateKeyPairSync("rsa", {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: "spki",
        format: "pem"
      },
      privateKeyEncoding: {
        type: "pkcs1",
        format: "pem"
      }
    });
    return Promise.resolve(llaves);
  } catch (error) {
    console.log(error);

    return error;
  }
};

export const generate_pair_keys = async (
  current_size: number,
  expected_size: number = 3
): Promise<string> => {
  try {
    let arrSize = expected_size - current_size / 2;

    await Promise.all(
      Array.apply(null, Array(arrSize)).map(
        async (_: any, currentWeeks: number) => {
          let llaves = await generate_pair();

          let credentialDir = path.join(__dirname, "..", "credentials");
          if (!fs.existsSync(credentialDir)) {
            await fs.mkdirSync(credentialDir);
          }

          let threeWeeks = moment().add((currentWeeks + 1) * 3, "weeks");
          let keysID = uuid();

          let publicKeyNameThree = `${keysID}.key.json`;

          let publicObjectThree = {
            publicKey: llaves.publicKey,
            privateKey: llaves.privateKey,
            expires: threeWeeks
          };
          let publicPathThree = path.join(
            __dirname,
            "..",
            "credentials",
            publicKeyNameThree
          );

          await fs.writeFileSync(
            publicPathThree,
            JSON.stringify(publicObjectThree)
          );
        }
      )
    );

    return Promise.resolve(`New keys were generated ${current_size}`);
  } catch (error) {
    console.log(error);

    return error;
  }
};

export const checkKeys = async () => {
  try {
    console.log("You will see this message every month 21 at 12");

    let credentialDir = path.join(__dirname, "..", "credentials");
    if (!fs.existsSync(credentialDir)) {
      await fs.mkdirSync(credentialDir);
    }
    // ? checks if the credeential folder exist

    let files = await fs.readdirSync(credentialDir);
    if (files.length == 6) {
      return Promise.resolve("Key already created");
    } else if (files.length % 2 != 0) {
      return Promise.resolve("Keys should be pair ");
    } else if (files.length % 2 == 0 && files.length < 6) {
      return await generate_pair_keys(files.length, 3);
    }
    return Promise.resolve("Nothing happen");
  } catch (error) {
    console.log(error);
  }
};

export const getRecentKeys = async () => {
  try {
    let credentialDir = path.join(__dirname, "..", "credentials");
    await fs.existsSync(credentialDir); // ? checks if the credeential folder exist

    let files = await fs.readdirSync(credentialDir);
    let dates = await Promise.all(
      files.map(async i => {
        let fileContent = await fs.readFileSync(
          path.join(credentialDir, i),
          "utf8"
        );

        let fileContentJson = JSON.parse(fileContent);

        return Promise.resolve({
          date: moment(fileContentJson.expires).unix(),
          name: i
        });
      })
    );

    // ? gets the min date
    let minDate = dates.reduce(
      (min: any, i) => (i.date < min.date ? i : min),
      dates[0]
    );

    let replaceString = ".key.json";
    let replaceStringExp = new RegExp(replaceString, "gi");
    let keyidNoReplace = minDate.name;
    let keyid = keyidNoReplace.replace(replaceStringExp, "");

    let fileContent = await fs.readFileSync(
      path.join(credentialDir, minDate.name),
      "utf8"
    );

    let fileContentJson = JSON.parse(fileContent);

    return Promise.resolve({
      keyid: keyid,
      privateKey: fileContentJson.privateKey
    });
  } catch (error) {
    throw new ApolloError(error);
  }
};

export const getPublicKey = async (name: string) => {
  try {
    let credentialDir = path.join(__dirname, "..", "credentials");
    await fs.existsSync(credentialDir); // ? checks if the credeential folder exist

    let fileContent = await fs.readFileSync(
      path.join(credentialDir, name + ".key.json"),
      "utf8"
    );

    let fileContentJson = JSON.parse(fileContent);

    return Promise.resolve({
      keyid: name,
      publicKey: fileContentJson.publicKey
    });
  } catch (error) {
    console.log(error);
    throw new AuthenticationError("Key is expired");
  }
};

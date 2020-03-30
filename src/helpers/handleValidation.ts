import { getRecentKeys, getPublicKey } from "../controllers/rsa";
import jwt from "jsonwebtoken";

const PUBLIC_ACTIONS = [
  "Login",
  "RegisterUser",
  "ResendVerifyCode",
  "RestorePasswordCode"
];

const NO_KEYS = [
  "CheckUserEmailAvailable",
  "DeletePreUser",
  "AddChallenge",
  "DeleteChallenge",
  "ModifyChallenge",
  "NewArena",
  "DeleteArena",
  "ModifyArena",
  "NewRarity",
  "ModifyRarity",
  "Raritys",
  "DeleteRarity",
  "Wallets",
  "AddBadge",
  "DeleteBadge",
  "ModifyBadge"
];

const actionIsPublic = ({ query }: any) =>
  PUBLIC_ACTIONS.some(action => query.includes(action));

const actionIsNoKeys = ({ query }: any) =>
  NO_KEYS.some(action => query.includes(action));

const isIntrospectionQuery = ({ operationName }: any) =>
  operationName === "IntrospectionQuery";

const shouldAuthenticate = (body: any) =>
  !isIntrospectionQuery(body) && !actionIsPublic(body);

export const handleAuth = async (context: any) => {
  let { req } = context;

  if (actionIsNoKeys(req.body)) {
    return Promise.resolve({
      token: req.headers.token ? req.headers.token : ""
    });
  } else if (shouldAuthenticate(req.body)) {
    let keyId = (await jwt.decode(req.headers.token, {
      complete: true
    })) as any;
    let publicKey = await getPublicKey(keyId.header.kid);
    return {
      publicKey: publicKey.publicKey,
      keyid: publicKey.keyid,
      token: req.headers.token
    };
  } else if (actionIsPublic(req.body)) {
    return await getRecentKeys();
  }
};

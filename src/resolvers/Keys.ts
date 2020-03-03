import { Resolver, Query, Mutation, Root } from "type-graphql";

import { Keys, SuccessResponse } from "../schema/KeysSchema";
import { checkKeys } from "../controllers/rsa";

@Resolver(of => Keys)
export class KeysResolver {
  @Mutation(returns => SuccessResponse)
  async rsa() {
    let keys = await checkKeys();
    return {
      code: "200",
      msg: keys
    };
  }

  @Query(returns => String)
  rsaPublic(@Root() id: number) {
    console.log("====================================");
    console.log(id);
    console.log("====================================");
  }

  @Query(returns => String)
  rsaPrivate(@Root() id: number) {}
}

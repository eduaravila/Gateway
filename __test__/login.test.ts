const dotenv = require("dotenv");

dotenv.config({ path: ".env.dev" });

test("some trash test", async done => {
  await expect(2 + 2).resolves.toBe(4);
});

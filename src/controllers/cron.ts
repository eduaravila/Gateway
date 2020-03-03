import { CronJob } from "cron";
import fs from "fs";
import path from "path";
import moment from "moment";
import { checkKeys } from "./rsa";
export let job = new CronJob(
  "* * * * *", // 0 12 21 * *
  async () => {
    try {
      let credentialDir = path.join(__dirname, "..", "credentials");
      await fs.existsSync(credentialDir); // ? checks if the credeential folder exist

      let files = await fs.readdirSync(credentialDir);
      await Promise.all(
        files.map(async i => {
          let fileContent = await fs.readFileSync(
            path.join(credentialDir, i),
            "utf8"
          );

          let fileContentJson = JSON.parse(fileContent);

          if (moment(moment(fileContentJson.expires)).isBefore(moment())) {
            await fs.unlinkSync(path.join(credentialDir, i));
          }
        })
      );
      let mes = await checkKeys();
    } catch (error) {
      console.log(error);
    }
  },
  null,
  true,
  "America/Mexico_City"
);

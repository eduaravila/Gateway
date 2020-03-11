import express from "express";
import { ApolloServer } from "apollo-server-express";
import express_user_ip from "express-ip";
import bp from "body-parser";
import { ApolloGateway, RemoteGraphQLDataSource } from "@apollo/gateway";
import cluster from "cluster";

import { job } from "./controllers/cron";
import { checkKeys } from "./controllers/rsa";
import { handleAuth } from "./helpers/handleValidation";
//?  decorators metadata
import "reflect-metadata";

const PORT: string = process.env.PORT || "3000";

if (cluster.isMaster) {
  cluster.fork();

  cluster.on("exit", function(worker, code, signal) {
    cluster.fork();
  });
}
if (cluster.isWorker) {
  (async () => {
    try {
      const gateway = new ApolloGateway({
        serviceList: [
          { name: "Access", url: "http://localhost:3000/graphql" },
          { name: "Challenge", url: "http://localhost:3001/graphql" },
          { name: "Arena", url: "http://localhost:3003/graphql" },
          { name: "Comentary", url: "http://localhost:3004/graphql" },
          { name: "Wallet", url: "http://localhost:3005/graphql" },
          { name: "History", url: "http://localhost:3006/graphql" }
          // more services
        ],
        buildService({ name, url }) {
          return new RemoteGraphQLDataSource({
            url,
            willSendRequest({ request, context }: any) {
              request.http.headers.set("token", context.token);
              if (context.privateKey) {
                request.variables.privateKey = context.privateKey
                  ? context.privateKey.toString()
                  : "";
              }
              if (context.publicKey) {
                request.variables.publicKey = context.publicKey
                  ? context.publicKey.toString()
                  : "";
              }
              if (context.keyid) {
                request.variables.keyid = context.keyid
                  ? context.keyid.toString()
                  : "";
              }
            }
          });
        }
      });

      // Initialize the app
      const app = express();
      app.use(
        /\/((?!graphql).)*/,
        bp.urlencoded({
          limit: "50mb",
          extended: true
        })
      );
      app.use(
        /\/((?!graphql).)*/,
        bp.json({
          limit: "50mb"
        })
      );
      const { schema, executor } = await gateway.load();
      app.use(express_user_ip().getIpInfoMiddleware); //* get the user location data
      app.use((req, res, next) => {
        res.setHeader("Access-Control-Allow-Origin", "*"); //* dominios por donde se permite el acceso
        res.setHeader(
          "Access-Control-Allow-Methods",
          "POST,GET,DELETE,UPDATE,PUT"
        ); //* metodos permitidos por el cliente
        res.setHeader(
          "Access-Control-Allow-Headers",
          "Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With,token"
        );

        //* dominios por donde se permite el acceso
        //* graph ql no envia una respuesta valida con el tipo options, cuando hay un tipo de request OPTIONS se retorna una respuesta con el estado 200
        // * graphql does not send a valid response when the OPTIONS request is received, if a OPTIONS request type is presented server return an empty response with the code 200

        if (req.method === "OPTIONS") {
          res.sendStatus(200);
        }
        next();
      });

      const server = new ApolloServer({
        schema,
        executor,
        subscriptions: false,
        context: async e => handleAuth(e),

        formatError: err => {
          console.log(err);

          err.extensions.variables = null;
          return err;
        }
      });
      // The GraphQL endpoint

      server.applyMiddleware({ app, path: "/graphql" });

      // Start the server

      app.listen(PORT, async () => {
        job.start(); // * start keys renovation service
        let messageKeys = await checkKeys();
        console.log(`Go to http://localhost:${PORT}/graphiql to run queries!`);
      });
    } catch (error) {
      console.log(error);
    }
  })();
}

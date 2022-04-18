import { game } from ".";

const fastify = require("fastify")({ logger: false });

fastify.get("/state", async (request: any, reply: any) => {
  reply.header("Access-Control-Allow-Origin", "*");
  return game.toJSON();
});

fastify.get("/card/:user/:row/:col", async (request: any, reply: any) => {
  game.playerClickCard(
    request.params.user,
    +request.params.row,
    +request.params.col
  );
  reply.header("Access-Control-Allow-Origin", "*");
  return "OK";
});

fastify.get("/draw", async (request: any, reply: any) => {
  game.currentPlayerDrawCard(false);
  reply.header("Access-Control-Allow-Origin", "*");
  return "OK";
});

fastify.get("/discard", async (request: any, reply: any) => {
  game.currentPlayerUseDiscard();
  reply.header("Access-Control-Allow-Origin", "*");
  return "OK";
});

const start = async () => {
  try {
    await fastify.listen(3000, "0.0.0.0");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();

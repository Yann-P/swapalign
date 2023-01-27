import Fastify, { FastifyReply, FastifyRequest } from "fastify";
import cors from "@fastify/cors";
import { RoomManager } from "./room-manager";

const fastify = Fastify({ logger: false });

(async () => {
  await fastify.register(cors, {
    origin: "*",
  });

  fastify.get("/state", async (request: any, reply: any) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const roomId = request.headers["roomid"];
    const room = RoomManager.getRoom(roomId);
    const game = room!.getGame();
    return game.toJSON();
  });

  fastify.get("/createroom", async (request: any, reply: FastifyReply) => {
    const players = request.query["players"];
    return RoomManager.createRoomAndGetId(players.split(" "));
  });

  fastify.get("/action", async (request: any, reply: any) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const roomId = request.headers["roomid"] as string;
    const room = RoomManager.getRoom(roomId);
    const game = room!.getGame();
    const userId = request.headers["userid"];
    console.log(request.query["action"], userId, roomId);
    switch (request.query["action"]) {
      case "draw":
        game.currentPlayerDrawCard(false);
        break;
      case "card":
        game.playerClickCard(
          userId,
          +request.query["row"],
          +request.query["col"]
        );
        break;
      case "discard":
        game.currentPlayerUseDiscard();
        break;
    }
  });

  const start = async () => {
    try {
      await fastify.listen(4000, "0.0.0.0");
    } catch (err) {
      fastify.log.error(err);
      process.exit(1);
    }
  };
  start();
})().catch(console.error);

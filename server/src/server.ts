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

  fastify.get("/registerplayer/:roomid/:name", async (request: any) => {
    const [roomId, name] = [request.params["roomid"], request.params["name"]];
    return RoomManager.registerPlayer(roomId, name);
  });

  fastify.get("/startgame/:roomid", async (request: any) => {
    const roomId = request.params["roomid"];
    const room = RoomManager.getRoom(roomId);
    await room.startGame();
  });

  fastify.get("/createroom", async (request: any, reply: FastifyReply) => {
    return RoomManager.createRoomAndGetId();
  });

  fastify.get(
    "/lobbyinfo/:roomid",
    async (request: any, reply: FastifyReply) => {
      const roomId = request.params["roomid"];
      const room = RoomManager.getRoom(roomId);
      return room.toJSON();
    }
  );

  fastify.get("/action", async (request: any, reply: any) => {
    reply.header("Access-Control-Allow-Origin", "*");
    const roomId = request.headers["roomid"] as string;
    const token = request.headers["token"] as string;
    const room = RoomManager.getRoom(roomId);
    const game = room!.getGame();
    const userId = room.getPlayerNameFromToken(token);

    if (!userId) {
      console.error("unknown player");
      return;
    }

    //console.log(request.query["action"], userId, roomId);
    switch (request.query["action"]) {
      case "draw":
        if (game.getCurrentPlayerName() !== userId) {
          return;
        }
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
        if (game.getCurrentPlayerName() !== userId) {
          return;
        }
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

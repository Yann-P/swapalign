import { Room } from "./room";

const rooms: Map<string, Room> = new Map();
const takenRoomIds = new Set();

export const RoomManager = {
  createRoomAndGetId(): string {
    const roomId = this.generateRoomId();
    const room = new Room();
    rooms.set(roomId, room);
    return roomId;
  },

  registerPlayer(roomId: string, name: string) {
    const room = rooms.get(roomId);

    if (!room) {
      throw new Error("room does not exist");
    }

    return room.addPlayer(name);
  },

  startGame(roomId: string) {
    const room = rooms.get(roomId);

    if (!room) {
      console.error("start game : room does not exist");
      return;
    }

    return room.startGame();
  },

  getRoom(id: string): Room {
    const room = rooms.get(id);
    if (!room) {
      throw new Error("no such room");
    }
    return room;
  },

  generateRoomId() {
    const adjectives =
      "cool red blue green dark brown light nice fun geek fast slow big small fat calm free half lazy wild tall drunk high low old new rare".split(
        " "
      );
    const nouns =
      "eye cat dog sheep horse seal fish whale rat mouse car lamb tree spy hat plant tea wolf cube fly bee wasp ant monkey king star sign shop shark cake fruit oak elk fox frog cow".split(
        " "
      );
    let word;
    do {
      word =
        adjectives[~~(Math.random() * adjectives.length)] +
        "-" +
        nouns[~~(Math.random() * nouns.length)];
    } while (!word || takenRoomIds.has(word));

    return word;
  },
};

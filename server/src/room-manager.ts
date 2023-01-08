import { Room } from "./room";

const rooms: Map<string, Room> = new Map();
const takenRoomIds = new Set();

export const RoomManager = {
  createRoomAndGetId(players: string[]): string {
    const id = this.generateRoomId();
    const room = new Room();
    rooms.set(id, room);

    players.forEach((p) => room.addPlayer(p)); // todo remove
    room.startGame(); // todo remove
    return id;
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
      "red blue green dark light nice fun geek fast slow big small fat calm free half lazy mean rude sick ugly wild tall drunk high low old new rare".split(
        " "
      );
    const nouns =
      "cat dog sheep horse seal fish whale rat mouse lamb tree plant tea wolf cube fly bee wasp ant monkey king star sign shop shark cake fruit oak elk fox frog cow".split(
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

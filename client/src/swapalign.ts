import { cardColor } from "./util";

export interface JSONGameState {
  phase: "REVEAL" | "PLAY" | "END";
  turn: string | undefined;
  boards: { [name: string]: (number | null)[][] };
  hands: { [name: string]: number | null };
  discardSize: number;
  discard: number | undefined;
  drawSize: number;
  lastRoundTurn: number;
  scores: { [name: string]: number };
  events: [string, number][];
}

const BASEURL = window.location.origin.replace(":1234", ":4000");

const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());
const roomId = params.r;

import * as qr from "qrcode";
document.addEventListener("DOMContentLoaded", async () => {
  const qrdata = await qr.toDataURL(window.location.href);
  const img = document.createElement("img");
  img.src = qrdata;
  document.body.appendChild(img);
});

function transpose<T>(array: T[][]) {
  return array[0].map((_, colIndex) => array.map((row) => row[colIndex]));
}

async function fetchState() {
  const res = await fetch(BASEURL + "/state", {
    headers: { roomid: roomId },
  });
  return res.json();
}

function genBoard(board: (number | null)[][]): string {
  return `
        <table style="margin: 0 auto">
            ${transpose(board)
              .map(
                (rowData, row) => `
                <tr>
                    ${rowData
                      .map(
                        (val, col) => `
                        <td class="card boardcard${
                          val === null ? " unknowncard" : ""
                        }" data-col="${col}" data-row="${row}" style="background: ${cardColor(
                          val
                        )}; ">${val ?? ""}</td>
                    `
                      )
                      .join("")}
                </tr>
            `
              )
              .join("")}
        </table>
    `;
}

function renderState(state: JSONGameState) {
  document.getElementById("game").innerHTML = `

        <div id="gameinfo">${
          state.phase === "REVEAL"
            ? "Révélez 2 cartes"
            : state.phase === "END"
            ? "Partie terminée"
            : state.events[state.events.length - 1][0]
        }</div>

        <table>
        <tr style="font-variant:small-caps;color: #444"><td style="width: 100px;text-align:center;">Pioche</td><td style="width: 100px;text-align:center;">Défausse</td></tr>
        <tr style="height: 130px">
            <td style="width: 100px;">
                <div class="card megacard drawcard unknowncard" style="margin: 0 auto;border-bottom: ${Math.min(
                  20,
                  state.drawSize
                )}px solid grey">
                    ?
                </div>
            </td>
            <td style="width: 100px;">
                <div class="card megacard discard" style="margin: 0 auto;background: ${cardColor(
                  state.discard
                )}; border-bottom: ${Math.min(
    20,
    state.discardSize
  )}px solid grey">
                    ${state.discard ?? ""}
                </div>
            </td>
        </tr>
        </table>

        <div style="display: flex; flex-wrap: wrap; margin-bottom: 300px">

        ${Object.keys(state.boards)
          .map(
            (name) =>
              `
            <div style='flex-grow: 1; padding: 10px; margin: 10px; background: #eee; border: 2px solid ${
              state.turn === name ? "red" : "#ddd"
            }'>
                    <h2 style="height:50px;${
                      state.turn === name ? "color: red;" : ""
                    }">${name}${
                state.scores[name] ? ` (${state.scores[name]} points) ` : ""
              } ${
                state.hands[name] !== null
                  ? `
                        <div class="card" style="display: inline-block;background: ${cardColor(
                          state.hands[name]
                        )}">
                            ${state.hands[name]}
                        </div>`
                  : ``
              }</h2>
                    <div class="board" data-name="${name}">
                        ${genBoard(state.boards[name])}
                    </div>
            </div>
            `
          )
          .join("")}

          </div>
          <div id='events'>
          ${[...(state.events ?? [])]
            .reverse()
            .map(
              (e) =>
                `<div style='width: 300px; padding: 2px; background: rgb(255, 255, ${~~Math.min(
                  (Date.now() - e[1]) / 10,
                  255
                )})'>${e[0]}</div>`
            )
            .join("")}
          </div>
        `;
}

async function sendCardAction(name: string, row: string, col: string) {
  //header ${name}
  await fetch(BASEURL + `/action?action=card&row=${row}&col=${col}`, {
    headers: { roomid: roomId, userid: name },
  });
}

async function sendDrawAction() {
  await fetch(BASEURL + `/action?action=draw`, { headers: { roomid: roomId } });
}

async function sendDiscardAction() {
  await fetch(BASEURL + `/action?action=discard`, {
    headers: { roomid: roomId },
  });
}

async function newRoom(players: string) {
  const res = await fetch(
    BASEURL + `/createroom?players=${encodeURI(players)}`
  );
  return res.text();
}

(async () => {
  let state: JSONGameState;

  document
    .querySelector('#newroom input[type="button"]')!
    .addEventListener("click", () => {
      const players = (
        document.querySelector('#newroom input[type="text"]') as HTMLFormElement
      ).value;
      newRoom(players).then((name) => (window.location.href = "/?r=" + name));
    });

  while (true) {
    state = await fetchState();

    renderState(state);

    [...document.querySelectorAll(".boardcard")].forEach((card) => {
      card.addEventListener("mouseup", (e) => {
        const [row, col, name] = [
          card.getAttribute("data-row"),
          card.getAttribute("data-col"),
          card.closest(".board").getAttribute("data-name"),
        ];
        sendCardAction(name, row, col).catch(console.error);
      });
    });

    document.querySelector(".drawcard").addEventListener("mouseup", () => {
      sendDrawAction().catch(console.error);
    });

    document.querySelector(".discard").addEventListener("mouseup", () => {
      sendDiscardAction().catch(console.error);
    });

    await new Promise((res) => setTimeout(res, 200));
  }
})().catch(console.error);

const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());
const roomId = params.r;
const BASEURL = process.env.BASEURL;

async function fetchLobbyState(): Promise<{
  players: string[];
  started: true;
}> {
  return (await fetch(BASEURL + `/lobbyinfo/${roomId}`)).json() as any;
}

async function registerPlayer(name: string): Promise<string> {
  const token = await (
    await fetch(BASEURL + `/registerplayer/${roomId}/${name}`)
  ).text();

  return token;
}

async function startGame() {
  await fetch(BASEURL + `/startgame/${roomId}`);
}

const playerListDiv = document.querySelector("#playerlist")!;
const joinForm = document.querySelector("#joinform")!;

document.querySelector("#gameid")!.innerText = roomId;

joinForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = joinForm.querySelector('input[type="text"]')!.value;
  const token = await registerPlayer(name);
  localStorage.setItem(roomId, JSON.stringify({ token, name }));
  joinForm.remove();
});

const startGameButton = document.querySelector("#startgame")!;

startGameButton.addEventListener("click", async () => {
  await startGame();
});

import * as qr from "qrcode";
document.addEventListener("DOMContentLoaded", async () => {
  const qrdata = await qr.toDataURL(window.location.href);
  const img = document.createElement("img");
  img.style.display = "block";
  img.src = qrdata;

  document.querySelector("#qr")!.appendChild(img);
});

let i = 0;
(async () => {
  while (true) {
    const state = await fetchLobbyState();

    if (state.started) {
      window.location.href = "index.html?r=" + roomId;
      return;
    }

    const registered = JSON.parse(localStorage.getItem(roomId) ?? "{}");

    if (!registered.name) {
      joinForm.style.display = "block";
      startGameButton.style.display = "none";
    } else {
      joinForm.style.display = "none";
      startGameButton.style.display = "block";
    }

    startGameButton.value = `Start now with ${state.players.length} player${
      state.players.length > 1 ? "s" : ""
    }`;

    playerListDiv.innerHTML = `<ul>${state.players
      .map(
        (p) =>
          `<li>– ${
            registered.name === p
              ? `<b style="color: #fee761;">${p}</b> (You)`
              : p
          }</li>`
      )
      .join("")}<li style='opacity: 0.5;display:${
      registered.name ? "block" : "none"
    }'>– Waiting for players${Array(i++ % 4)
      .fill(".")
      .join("")}</li></ul>`;

    await new Promise((res) => setTimeout(res, 1000));
  }
})().catch(console.error);

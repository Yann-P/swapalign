export function cardColor(val: number | null) {
  if (val === null) {
    return "lightgray";
  }
  if (val <= -1) {
    return "blue";
  }
  if (val === 0) {
    return "skyblue";
  }
  if (val < 5) {
    return "lightgreen";
  }
  if (val < 9) {
    return "yellow";
  }
  return "indianred";
}

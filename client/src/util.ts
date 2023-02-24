export function cardColor(val: number | null) {
  if (val === null) {
    return "lightgray";
  }
  if (val <= -1) {
    return "#124e89";
  }
  if (val === 0) {
    return "#0099db";
  }
  if (val < 5) {
    return "#63c74d";
  }
  if (val < 9) {
    return "#fee761";
  }
  return "#e43b44";
}

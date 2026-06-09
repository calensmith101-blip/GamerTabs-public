
export function isAiMode(props = {}) {
  return [props.gameMode, props.mode, props.selectedMode]
    .filter(Boolean)
    .some((value) => ['ai', 'computer', 'cpu', 'bot'].some((tag) => String(value).toLowerCase().includes(tag)));
}

export function isOnlineMode(props = {}) {
  return [props.gameMode, props.mode, props.selectedMode]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes('online'));
}

export function randItem(items = []) {
  return items[Math.floor(Math.random() * items.length)];
}

export function delayRange(min = 500, max = 900) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

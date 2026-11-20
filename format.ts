// Coordinates are shown to 5 decimal places (~1 m). When privacy mode is on,
// they are masked on screen so screenshots / demo videos don't reveal a real location.
export function formatCoord(value: number, masked: boolean): string {
  return masked ? '••.•••••' : value.toFixed(5);
}

export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? 'Unknown time' : d.toLocaleString();
}

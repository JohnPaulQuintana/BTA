export function generateBusColors(buses: { id: string | number; bus_name: string }[]) {
  const colors: Record<string | number, string> = {};
  const baseColors = [
    "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
    "#ec4899", "#10b981", "#f97316", "#6366f1", "#eab308"
  ];

  buses.forEach((bus, index) => {
    colors[bus.id] = baseColors[index % baseColors.length];
  });

  return colors;
}

const zones = Intl.supportedValuesOf("timeZone");
const aliases: Record<string, string> = {
  utc: "UTC",
  gmt: "UTC",
  pst: "America/Los_Angeles",
  pdt: "America/Los_Angeles",
  mst: "America/Denver",
  mdt: "America/Denver",
  cst: "America/Chicago",
  cdt: "America/Chicago",
  est: "America/New_York",
  edt: "America/New_York",
};

export function timezone(value: string) {
  const query = normalize(value);
  if (aliases[query]) return aliases[query]!;
  const exact = zones.find((zone) => normalize(zone) === query);
  if (exact) return exact;
  const matches = zones.filter((zone) => normalize(zone).includes(query));
  return matches.length === 1 ? matches[0]! : null;
}

export function findTimezones(query: string) {
  const value = normalize(query);
  return zones.filter((zone) => normalize(zone).includes(value)).slice(0, 20);
}

export function localTime(zone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());
}

const normalize = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "_");

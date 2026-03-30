export type EthiopiaSearchHit = {
  displayName: string;
  lat: string;
  lon: string;
  address: Record<string, string>;
};

/** Map Nominatim address parts to region / town / city / street (Ethiopia). */
export function nominatimToParts(addr: Record<string, string>): {
  region: string;
  town: string;
  city: string;
  street: string;
} {
  const region =
    addr.state || addr.region || addr["ISO3166-2-lvl4"] || "";
  const city =
    addr.city || addr.municipality || addr.county || "";
  const town =
    addr.town ||
    addr.village ||
    addr.suburb ||
    addr.city_district ||
    addr.neighbourhood ||
    addr.hamlet ||
    "";
  const street = [addr.road, addr.pedestrian, addr.house_number]
    .filter(Boolean)
    .join(" ")
    .trim();
  return { region, town, city, street };
}

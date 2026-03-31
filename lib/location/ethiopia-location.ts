export type EthiopiaSearchHit = {
  displayName: string;
  lat: string;
  lon: string;
  address: Record<string, string>;
};

/** Map Nominatim address parts to region / city / woreda / kebele / street (Ethiopia). Town-level OSM tags are folded into city. */
export function nominatimToParts(addr: Record<string, string>): {
  region: string;
  city: string;
  woreda: string;
  kebele: string;
  street: string;
} {
  const region =
    addr.state || addr.region || addr["ISO3166-2-lvl4"] || "";
  const cityCore =
    addr.city || addr.municipality || addr.county || "";
  const townLevel =
    addr.town || addr.village || addr.city_district || "";
  const city = [cityCore, townLevel]
    .map((s) => String(s).trim())
    .filter(Boolean)
    .join(", ");
  const woreda = (addr.district || addr.quarter || "").trim();
  const kebele = (addr.neighbourhood || addr.suburb || addr.hamlet || "").trim();
  const street = [addr.road, addr.pedestrian, addr.house_number]
    .filter(Boolean)
    .join(" ")
    .trim();
  return { region, city, woreda, kebele, street };
}

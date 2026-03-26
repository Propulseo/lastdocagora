"use server";

/**
 * Geocode an address via Nominatim (OpenStreetMap).
 * Returns { latitude, longitude } or null on failure.
 * Non-fatal — callers should treat null as "could not geocode".
 */
export async function geocodeAddress(
  address?: string | null,
  city?: string | null,
  postalCode?: string | null,
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    const parts = [address, postalCode, city, "Portugal"].filter(Boolean);
    if (parts.length <= 1) return null; // only "Portugal" — nothing to geocode

    const q = parts.join(", ");
    const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({
      q,
      format: "json",
      limit: "1",
      countrycodes: "pt",
    })}`;

    const res = await fetch(url, {
      headers: { "User-Agent": "DocAgora/1.0 contact@docagora.com" },
      next: { revalidate: 0 },
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!Array.isArray(data) || data.length === 0) return null;

    const lat = parseFloat(data[0].lat);
    const lon = parseFloat(data[0].lon);
    if (isNaN(lat) || isNaN(lon)) return null;

    return { latitude: lat, longitude: lon };
  } catch {
    return null;
  }
}

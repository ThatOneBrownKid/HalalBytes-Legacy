// Geocoding utility for converting addresses to coordinates
// Uses a free geocoding service (Nominatim) as fallback when Google API isn't available

interface GeocodingResult {
  lat: number;
  lng: number;
  formattedAddress?: string;
}

/**
 * Geocode an address to coordinates using Nominatim (OpenStreetMap)
 * This is a free service with usage limits - for production, consider using Google Geocoding API
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (!address.trim()) return null;

  try {
    const encodedAddress = encodeURIComponent(address);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
      {
        headers: {
          // Nominatim requires a valid User-Agent
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();
    
    if (data.length === 0) {
      return null;
    }

    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      formattedAddress: result.display_name,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

/**
 * Reverse geocode coordinates to an address
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding request failed');
    }

    const data = await response.json();
    return data.display_name || null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}


const EARTH_RADIUS_KM: number = 6371;

function toRadian(degrees: number): number{
    return (degrees * Math.PI) / 180
}

export function calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
) :number{
    const dLat = toRadian(lat2 - lat1);
    const dLon = toRadian(lon2 - lon1);

    const a = 
    Math.sin(dLat / 2) ** 2 + 
    Math.cos(toRadian(lat1)) *
        Math.cos(toRadian(lat2)) *
      Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
}
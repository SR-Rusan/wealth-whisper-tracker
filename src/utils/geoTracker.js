// Haversine formula to calculate distance between two coordinates in km
export function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Known coordinates for Dhaka hubs (defaults)
export const knownHubs = {
  DHANMONDI: { lat: 23.7461, lng: 90.3742, name: 'Dhanmondi' },
  GULSHAN: { lat: 23.7925, lng: 90.4078, name: 'Gulshan' },
  BANANI: { lat: 23.7937, lng: 90.4047, name: 'Banani' },
  UTTARA: { lat: 23.8759, lng: 90.3795, name: 'Uttara' },
  MOTIJHEEL: { lat: 23.733, lng: 90.4172, name: 'Motijheel' },
  MIRPUR: { lat: 23.8069, lng: 90.3687, name: 'Mirpur' }
};

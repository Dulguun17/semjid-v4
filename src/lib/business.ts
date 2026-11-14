// Business identity and locality already used by the site. No street address,
// opening hours, ratings or precise map pin are inferred here.
export const BUSINESS = {
  name: "Сэмжид Хужирт Рашаан Сувилал",
  englishName: "Semjid Khujirt",
  locality: "Khujirt",
  region: "Uvurkhangai",
  country: "MN",
};
const destination = `${BUSINESS.name}, ${BUSINESS.locality}, ${BUSINESS.region}, Mongolia`;
export const MAP_SEARCH_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(destination)}`;
export const MAP_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;

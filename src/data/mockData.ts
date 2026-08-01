import { IMAGES } from '../assets/images';
import { ReviewCategory, RoomType, ServiceDetail } from '../types';

// Everything factual below is taken from the property's Booking.com listing:
// https://www.booking.com/hotel/lk/om-surf-club.html
export const HERO_DATA = {
  companyName: 'Mellow Bay',
  legalName: 'Mellow Bay Living Beach Coworking & Coliving',
  titleLead: 'Your stay',
  titleRest: '— your\nrules',
  description: 'Beachfront coliving and coworking\non the south coast of Sri Lanka',
  caption: 'Private beach, restaurant and workspace\nsix minutes from Weligama Beach',
  ctaText: 'Check availability',
  // TODO: phone + email are still placeholders — Booking.com does not publish them.
  phone: '+1 (800) 555-0199',
  phoneClean: '+18005550199',
  email: 'email@example.com',
  address: 'Matara Road 693, Pelena, 81700 Weligama, Sri Lanka',
  city: 'Weligama, Sri Lanka',
  bookingUrl: 'https://www.booking.com/hotel/lk/om-surf-club.html',
  checkIn: '2:00 PM – 10:00 PM',
  checkOut: '7:00 AM – 10:00 PM',
  minAge: 18,
  rating: 7.2,
  ratingWord: 'Good',
  reviewsCount: 78,
  beachScore: 8.5,
  beachWalkMinutes: 6,
};

/** Published category scores, as shown on the listing. */
export const REVIEW_CATEGORIES: ReviewCategory[] = [
  { label: 'Location', score: 8.4 },
  { label: 'Staff', score: 8.0 },
  { label: 'Value for money', score: 7.6 },
  { label: 'Facilities', score: 7.3 },
  { label: 'Cleanliness', score: 7.3 },
  { label: 'Comfort', score: 7.2 },
];

export const MOST_POPULAR_AMENITIES = [
  'Private beach area',
  'Free WiFi',
  'Restaurant',
  'Bar',
  'Free parking',
  'Room service',
  'Family rooms',
  'Breakfast',
  'Non-smoking rooms',
];

export const NEARBY = [
  { label: 'Weligama Beach', distance: '750 ft' },
  { label: 'Mirissa Beach', distance: '2.8 mi' },
  { label: 'Weligama Railway Station', distance: '0.9 mi' },
  { label: 'Koggala Airport', distance: '9.9 mi' },
];

export const SERVICES_DATA: ServiceDetail[] = [
  {
    id: 'stay',
    title: 'Rooms and dorms',
    description:
      'Private doubles, a family suite and custom-built cement bunk dorms — all with air-conditioning, private bathrooms and sea views.',
    imageUrl: IMAGES.houseBlueprint,
    features: ['Air-conditioning', 'Private bathrooms', 'Sea views'],
    href: '/rooms',
  },
  {
    id: 'eat',
    title: 'Restaurant and bar',
    description:
      'Indian, seafood, Russian, local and European dishes from breakfast through cocktail hour, with full English/Irish, vegan and Asian breakfasts.',
    imageUrl: IMAGES.facadeVentilation,
    features: ['Breakfast to dinner', 'Vegetarian options', 'Bar and high tea'],
    href: '/eat-and-work#eat',
  },
  {
    id: 'work',
    title: 'Coworking and yoga',
    description:
      'A dedicated workspace for guests staying long-term, plus yoga classes, evening entertainment, a lounge and a garden terrace.',
    imageUrl: IMAGES.roofingBuilder,
    features: ['Free WiFi', 'Yoga classes', 'Garden terrace'],
    href: '/eat-and-work#work',
  },
];

/** The home page's hub — one card per other page on the site. */
export const SITE_SECTIONS = [
  {
    to: '/rooms',
    label: 'Rooms',
    title: 'Five ways to stay',
    detail: 'A private double, a family suite, or a bed in one of the air-conditioned dorms.',
    imageUrl: IMAGES.heroHouse,
  },
  {
    to: '/eat-and-work',
    label: 'Eat & work',
    title: 'The restaurant and the workspace',
    detail: 'Five cuisines from breakfast to cocktail hour, and a desk for the long stays.',
    imageUrl: IMAGES.facadeVentilation,
  },
  {
    to: '/about',
    label: 'About',
    title: 'What the place actually is',
    detail: 'Private beach, garden, bar and coliving on the south coast of Sri Lanka.',
    imageUrl: IMAGES.houseBlueprint,
  },
  {
    to: '/contact',
    label: 'Contact',
    title: 'Find us in Weligama',
    detail: 'Directions, check-in times and everything worth knowing before you arrive.',
    imageUrl: IMAGES.roofingBuilder,
  },
];

export const RESTAURANT = {
  cuisines: ['Indian', 'Seafood', 'Russian', 'Local', 'European'],
  openFor: ['Breakfast', 'Brunch', 'Lunch', 'Dinner', 'High tea', 'Cocktail hour'],
  breakfasts: ['Full English/Irish', 'Vegan', 'Asian'],
  ambience: 'Modern',
  dietary: 'Vegetarian options',
};

export const COWORKING_FEATURES = [
  { title: 'Dedicated workspace', detail: 'Desks and free WiFi across the property.' },
  { title: 'Yoga classes', detail: 'Regular sessions for guests staying with us.' },
  { title: 'Evening entertainment', detail: 'Something on most nights, right on site.' },
  { title: 'Lounge and garden terrace', detail: 'Somewhere to land between calls.' },
  { title: 'Room service', detail: 'Food and drinks brought to you while you work.' },
  { title: 'Free private parking', detail: 'On site, including accessible spaces.' },
];

export const HOUSE_RULES = [
  { label: 'Check-in', value: '2:00 PM – 10:00 PM' },
  { label: 'Check-out', value: '7:00 AM – 10:00 PM' },
  { label: 'Minimum age', value: '18 years' },
  { label: 'Pets', value: 'Not allowed' },
  { label: 'Payment', value: 'Cash accepted' },
  { label: 'Parking', value: 'Free, private, on site' },
];

export const SERVICE_HIGHLIGHTS = [
  {
    id: '1',
    title: 'Private beach area, lush garden and a terrace with sea views',
  },
  {
    id: '2',
    title: 'Free WiFi, free private parking on site and an airport shuttle',
  },
];

export const ROOM_TYPES: RoomType[] = [
  {
    id: 'deluxe-double',
    title: 'Deluxe Double Room',
    subtitle: 'Queen bed, private bathroom and air-conditioning',
    sleeps: 2,
    bedSummary: '1 queen bed',
    category: 'private',
    imageUrl: IMAGES.heroHouse,
    features: ['Queen bed', 'Private bathroom', 'Air-conditioning', 'Sea view'],
    description:
      'Our private double — a queen bed, your own bathroom and air-conditioning, a short walk from the water.',
    privateBathroom: true,
    seaView: true,
  },
  {
    id: 'family-suite',
    title: 'Deluxe Family Suite',
    subtitle: 'Sleeps four, with a queen bed and a bunk bed',
    sleeps: 4,
    bedSummary: '1 bunk bed and 1 queen bed',
    category: 'suite',
    imageUrl: IMAGES.facadeVentilation,
    features: ['Sleeps 4', 'Queen bed and bunk bed', 'Private bathroom', 'Air-conditioning'],
    description:
      'The largest room on site: a queen bed plus a bunk, a private bathroom and room for a family of four.',
    privateBathroom: true,
    seaView: true,
  },
  {
    id: 'dorm-8-mixed',
    title: 'Bed in 8-Bed Mixed Dormitory',
    subtitle: 'A bed in our largest mixed dorm',
    sleeps: 1,
    bedSummary: '1 bunk bed',
    category: 'dorm',
    imageUrl: IMAGES.roofingBuilder,
    features: ['Mixed dorm', 'Air-conditioning', 'Shared bathroom', 'Locker'],
    description:
      'A bed in the eight-bed mixed dorm, air-conditioned, with a shared bathroom and space to stash your board.',
    privateBathroom: false,
    seaView: false,
  },
  {
    id: 'dorm-6-female',
    title: 'Bed in 6-Bed Female Dormitory',
    subtitle: 'Female-only dorm, six beds',
    sleeps: 1,
    bedSummary: '1 bunk bed',
    category: 'dorm',
    imageUrl: IMAGES.houseBlueprint,
    features: ['Female only', 'Air-conditioning', 'Shared bathroom', 'Locker'],
    description: 'A bed in the six-bed female-only dorm, air-conditioned with a shared bathroom.',
    privateBathroom: false,
    seaView: false,
  },
  {
    id: 'dorm-female-bunk',
    title: 'Bunk Bed in Female Dormitory',
    subtitle: 'Female-only dorm, single bunk',
    sleeps: 1,
    bedSummary: '1 bunk bed',
    category: 'dorm',
    imageUrl: IMAGES.heroHouse,
    features: ['Female only', 'Air-conditioning', 'Shared bathroom', 'Locker'],
    description: 'A single bunk in the female-only dorm — the most affordable way to stay on the beach.',
    privateBathroom: false,
    seaView: false,
  },
];

export const GALLERY_PHOTOS = [
  {
    id: 'g-1',
    title: 'The beach in front of the property',
    location: 'Weligama, Sri Lanka',
    imageUrl: IMAGES.heroHouse,
    year: 'Private beach area',
  },
  {
    id: 'g-2',
    title: 'Restaurant and bar',
    location: 'Open daily for breakfast through dinner',
    imageUrl: IMAGES.facadeVentilation,
    year: 'On site',
  },
  {
    id: 'g-3',
    title: 'Rooms and dorms',
    location: 'Air-conditioned, with sea views',
    imageUrl: IMAGES.houseBlueprint,
    year: '5 room types',
  },
  {
    id: 'g-4',
    title: 'Garden terrace and coworking',
    location: 'Yoga classes and evening entertainment',
    imageUrl: IMAGES.roofingBuilder,
    year: 'Coliving',
  },
];

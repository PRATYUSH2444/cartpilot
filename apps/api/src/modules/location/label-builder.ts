/**
 * Locality Label Builder
 *
 * Produces clean, friendly Indian locality labels from geocoded address components
 * and raw geocoded text by stripping granular unit-level identifiers (tower, flat,
 * apartment, block, floor, house, plot, room, villa, plus codes) while preserving
 * meaningful localities, sectors, society/colony names, and cities.
 *
 * Example:
 * Input: "Tower 5, Flat 1203, La Residencia, Greater Noida West, Gautam Buddha Nagar, Uttar Pradesh 201308"
 * Result:
 *   label: "La Residencia, Greater Noida"
 *   subLabel: "Gautam Buddha Nagar, Uttar Pradesh 201308"
 */

export interface AddressComponentsInput {
  houseFlat?: string;
  street?: string;
  sublocality?: string;
  locality?: string;
  neighborhood?: string;
  residential?: string;
  city?: string;
  district?: string;
  state?: string;
  pincode?: string;
  country?: string;
  rawFormatted?: string;
}

export interface LocalityLabelResult {
  label: string;
  subLabel: string;
  locality: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  fullCleanAddress: string;
}

/**
 * Regex patterns for unit, flat, tower, floor, plot, room, and plus codes
 */
const UNIT_PATTERNS = [
  // Plus codes (Open Location Code base-20 alphabet: 23456789CFGHJMPQRVWX)
  /\b[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,4}\b/gi,
  // Tower / Flat / Unit / Floor / Room / Plot / Villa / House / H.No with numbers
  /\b(?:tower|flat|apt|apartment|block|flr|floor|house|h\.no|h-no|unit|room|plot|villa|kothi|bungalow)\s*(?:no\.?|#)?\s*[-A-Za-z0-9/]+/gi,
  // Short tower/block abbreviations: T-5, T5, B-12, B12, Blk-A
  /\b(?:t|b|blk)[-]\d+\b/gi,
  // Floor indicators: 1st floor, 2nd flr, ground floor, etc.
  /\b(?:\d+(?:st|nd|rd|th)?|ground|basement)\s+(?:floor|flr)\b/gi,
];

/**
 * Strips unit/flat/tower identifiers from a given string segment
 */
export function stripUnitDetails(text: string): string {
  if (!text) return '';
  let cleaned = text;

  for (const pattern of UNIT_PATTERNS) {
    cleaned = cleaned.replace(pattern, ' ');
  }

  // Remove leading house/plot numbers like "1203,", "#45,", "12-A,"
  cleaned = cleaned.replace(/^\s*#?\d+[-/A-Za-z0-9]*\s*,\s*/g, '');
  // Remove standalone leading numbers: "1203 La Residencia" -> "La Residencia"
  cleaned = cleaned.replace(/^\s*#?\d+[-/A-Za-z0-9]*\s+/g, '');

  // Clean redundant whitespace and punctuation
  cleaned = cleaned
    .replace(/,\s*,+/g, ',')
    .replace(/\s{2,}/g, ' ')
    .replace(/^[,.\s-]+|[,.\s-]+$/g, '')
    .trim();

  return cleaned;
}

/**
 * Builds clean locality-level display labels
 */
export function buildLocalityLabel(
  components: AddressComponentsInput,
  rawAddress?: string
): LocalityLabelResult {
  const raw = rawAddress || components.rawFormatted || '';

  // Extract raw components
  let pincode = (components.pincode || '').trim();
  let state = (components.state || '').trim();
  let district = (components.district || '').trim();
  let city = (components.city || '').trim();
  let locality = (
    components.residential ||
    components.sublocality ||
    components.locality ||
    components.neighborhood ||
    ''
  ).trim();

  // If pincode is missing from components, extract 6-digit pin from raw text
  if (!pincode && raw) {
    const pinMatch = raw.match(/\b([1-9][0-9]{5})\b/);
    if (pinMatch && pinMatch[1]) {
      pincode = pinMatch[1];
    }
  }

  // If raw string exists, clean it and split by commas to find rich locality tokens
  const cleanTokens = raw
    ? raw
        .split(',')
        .map((part) => stripUnitDetails(part))
        .filter((part) => {
          if (!part || part.length < 2) return false;
          // Discard pure postal code tokens or country names
          if (/^\d{6}$/.test(part) || /^india$/i.test(part)) return false;
          return true;
        })
    : [];

  // If state is missing, check the last clean token (often "State 123456" or "State")
  if (!state && cleanTokens.length > 0) {
    const lastToken = cleanTokens[cleanTokens.length - 1];
    if (lastToken) {
      const strippedLast = lastToken.replace(/\b[1-9][0-9]{5}\b/g, '').trim();
      if (strippedLast.length >= 3 && !/greater noida|noida|delhi|mumbai|bengaluru|bangalore|pune|patna/i.test(strippedLast)) {
        state = strippedLast;
        cleanTokens.pop();
      }
    }
  }

  // Identify city if missing
  if (!city && cleanTokens.length > 0) {
    city = district || cleanTokens[cleanTokens.length - 1] || '';
  }

  // Extract best locality name from clean tokens if locality is empty or identical to city
  if (!locality || locality.toLowerCase() === city.toLowerCase()) {
    for (const token of cleanTokens) {
      const lower = token.toLowerCase();
      if (
        lower !== city.toLowerCase() &&
        lower !== district.toLowerCase() &&
        lower !== state.toLowerCase() &&
        !/^india$/i.test(token)
      ) {
        locality = token;
        break;
      }
    }
  } else {
    locality = stripUnitDetails(locality);
  }

  // Clean locality and city
  locality = stripUnitDetails(locality);
  city = stripUnitDetails(city);
  district = stripUnitDetails(district);
  state = stripUnitDetails(state);

  // If city is Greater Noida or Noida, and district is Gautam Buddha Nagar, preserve standard hierarchy
  if (/greater noida/i.test(raw) && !/greater noida/i.test(city)) {
    city = 'Greater Noida';
  } else if (/noida/i.test(raw) && !/noida/i.test(city) && !/greater noida/i.test(raw)) {
    city = 'Noida';
  }

  // If locality is still missing or matches city, fallback gracefully
  if (!locality || locality.toLowerCase() === city.toLowerCase()) {
    locality = city || district || 'Local Area';
  }

  // Construct primary headline label (e.g., "La Residencia, Greater Noida")
  let label = '';
  if (locality && city && locality.toLowerCase() !== city.toLowerCase()) {
    label = `${locality}, ${city}`;
  } else if (locality) {
    label = locality;
  } else if (city) {
    label = city;
  } else {
    label = 'Delivery Location';
  }

  // Construct secondary subLabel (e.g., "Gautam Buddha Nagar, Uttar Pradesh 201308")
  const subParts: string[] = [];
  if (
    district &&
    district.toLowerCase() !== city.toLowerCase() &&
    district.toLowerCase() !== locality.toLowerCase()
  ) {
    subParts.push(district);
  }
  if (
    state &&
    state.toLowerCase() !== city.toLowerCase() &&
    state.toLowerCase() !== district.toLowerCase()
  ) {
    subParts.push(state);
  }

  let subLabel = subParts.join(', ');
  if (pincode) {
    subLabel = subLabel ? `${subLabel} ${pincode}` : pincode;
  }

  // Build full clean display address
  const fullCleanAddress = [label, subLabel].filter(Boolean).join(' · ');

  return {
    label,
    subLabel,
    locality,
    city,
    district,
    state,
    pincode,
    fullCleanAddress,
  };
}

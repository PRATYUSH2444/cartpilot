import { describe, it, expect } from 'vitest';
import { buildLocalityLabel, stripUnitDetails } from './label-builder.js';

describe('Locality Label Builder & Unit Stripper', () => {
  it('strips unit, tower, flat, floor, and plot identifiers from strings', () => {
    expect(stripUnitDetails('Tower 5, Flat 1203, La Residencia')).toBe('La Residencia');
    expect(stripUnitDetails('Flat No. 402, Block B, ATS Advantage')).toBe('ATS Advantage');
    expect(stripUnitDetails('Plot 45, Sector 62')).toBe('Sector 62');
    expect(stripUnitDetails('Villa #9, Palm Meadows')).toBe('Palm Meadows');
    expect(stripUnitDetails('H.No 12-4-88, Kothrud')).toBe('Kothrud');
    expect(stripUnitDetails('2nd Floor, 100 Feet Road')).toBe('100 Feet Road');
    expect(stripUnitDetails('7JVW+8X Greater Noida')).toBe('Greater Noida');
  });

  it('correctly handles the user primary case: La Residencia, Greater Noida', () => {
    const raw =
      'Tower 5, Flat 1203, La Residencia, Greater Noida West, Gautam Buddha Nagar, Uttar Pradesh 201308';
    const components = {
      residential: 'La Residencia',
      sublocality: 'Greater Noida West',
      city: 'Greater Noida',
      district: 'Gautam Buddha Nagar',
      state: 'Uttar Pradesh',
      pincode: '201308',
      rawFormatted: raw,
    };

    const res = buildLocalityLabel(components, raw);

    expect(res.label).toBe('La Residencia, Greater Noida');
    expect(res.subLabel).toBe('Gautam Buddha Nagar, Uttar Pradesh 201308');
    expect(res.locality).toBe('La Residencia');
    expect(res.city).toBe('Greater Noida');
    expect(res.pincode).toBe('201308');
    // Ensure no flat or tower numbers leaked
    expect(res.label).not.toMatch(/tower|flat|1203|5/i);
    expect(res.subLabel).not.toMatch(/tower|flat|1203|5/i);
  });

  const testCases = [
    {
      name: 'Noida Sector 62 with House Number',
      raw: 'House No 12, Block C, Sector 62, Noida, Gautam Buddha Nagar, Uttar Pradesh 201301',
      components: {
        locality: 'Sector 62',
        city: 'Noida',
        district: 'Gautam Buddha Nagar',
        state: 'Uttar Pradesh',
        pincode: '201301',
      },
      expectedLabel: 'Sector 62, Noida',
      expectedSubLabel: 'Gautam Buddha Nagar, Uttar Pradesh 201301',
    },
    {
      name: 'Indiranagar Bengaluru with Plot Number',
      raw: 'Plot 104, 12th Main Road, Indiranagar, Bengaluru, Karnataka 560038',
      components: {
        locality: 'Indiranagar',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        pincode: '560038',
      },
      expectedLabel: 'Indiranagar, Bengaluru',
      expectedSubLabel: 'Bengaluru Urban, Karnataka 560038',
    },
    {
      name: 'Kothrud Pune with H.No',
      raw: 'H.No 45/2, Ideal Colony, Kothrud, Pune, Maharashtra 411038',
      components: {
        locality: 'Kothrud',
        city: 'Pune',
        district: 'Pune',
        state: 'Maharashtra',
        pincode: '411038',
      },
      expectedLabel: 'Kothrud, Pune',
      expectedSubLabel: 'Maharashtra 411038',
    },
    {
      name: 'Boring Road Patna with Landmark',
      raw: 'Apt 302, Boring Road, Near Alankar Jewellers, Patna, Bihar 800001',
      components: {
        locality: 'Boring Road',
        city: 'Patna',
        district: 'Patna',
        state: 'Bihar',
        pincode: '800001',
      },
      expectedLabel: 'Boring Road, Patna',
      expectedSubLabel: 'Bihar 800001',
    },
    {
      name: 'Ghaziabad Society with Block and Flat',
      raw: 'Flat 402, Block B, ATS Advantage, Ahinsa Khand 1, Indirapuram, Ghaziabad, Uttar Pradesh 201014',
      components: {
        residential: 'ATS Advantage',
        sublocality: 'Indirapuram',
        city: 'Ghaziabad',
        district: 'Ghaziabad',
        state: 'Uttar Pradesh',
        pincode: '201014',
      },
      expectedLabel: 'ATS Advantage, Ghaziabad',
      expectedSubLabel: 'Uttar Pradesh 201014',
    },
    {
      name: 'Whitefield Bengaluru Villa',
      raw: 'Villa 14, Palm Meadows, Ramagondanahalli, Whitefield, Bengaluru, Karnataka 560066',
      components: {
        residential: 'Palm Meadows',
        locality: 'Whitefield',
        city: 'Bengaluru',
        district: 'Bengaluru Urban',
        state: 'Karnataka',
        pincode: '560066',
      },
      expectedLabel: 'Palm Meadows, Bengaluru',
      expectedSubLabel: 'Bengaluru Urban, Karnataka 560066',
    },
    {
      name: 'Gaur City 2 Greater Noida West',
      raw: 'Tower J, Flat 904, 14th Avenue, Gaur City 2, Greater Noida, Gautam Buddha Nagar, Uttar Pradesh 201009',
      components: {
        residential: 'Gaur City 2',
        city: 'Greater Noida',
        district: 'Gautam Buddha Nagar',
        state: 'Uttar Pradesh',
        pincode: '201009',
      },
      expectedLabel: 'Gaur City 2, Greater Noida',
      expectedSubLabel: 'Gautam Buddha Nagar, Uttar Pradesh 201009',
    },
    {
      name: 'Gurugram DLF Phase 5',
      raw: 'Unit 1201, The Icon, DLF Phase 5, Sector 43, Gurugram, Haryana 122002',
      components: {
        locality: 'DLF Phase 5',
        city: 'Gurugram',
        district: 'Gurugram',
        state: 'Haryana',
        pincode: '122002',
      },
      expectedLabel: 'DLF Phase 5, Gurugram',
      expectedSubLabel: 'Haryana 122002',
    },
    {
      name: 'Bandra West Mumbai',
      raw: '3rd Floor, Hill Road, Bandra West, Mumbai, Maharashtra 400050',
      components: {
        locality: 'Bandra West',
        city: 'Mumbai',
        district: 'Mumbai Suburban',
        state: 'Maharashtra',
        pincode: '400050',
      },
      expectedLabel: 'Bandra West, Mumbai',
      expectedSubLabel: 'Mumbai Suburban, Maharashtra 400050',
    },
    {
      name: 'Salt Lake Sector 5 Kolkata',
      raw: 'Room 501, Godrej Genesis, Sector 5, Salt Lake, Kolkata, West Bengal 700091',
      components: {
        locality: 'Salt Lake',
        city: 'Kolkata',
        district: 'North 24 Parganas',
        state: 'West Bengal',
        pincode: '700091',
      },
      expectedLabel: 'Salt Lake, Kolkata',
      expectedSubLabel: 'North 24 Parganas, West Bengal 700091',
    },
    {
      name: 'Jubilee Hills Hyderabad',
      raw: 'Plot 32, Road No. 36, Jubilee Hills, Hyderabad, Telangana 500033',
      components: {
        locality: 'Jubilee Hills',
        city: 'Hyderabad',
        district: 'Hyderabad',
        state: 'Telangana',
        pincode: '500033',
      },
      expectedLabel: 'Jubilee Hills, Hyderabad',
      expectedSubLabel: 'Telangana 500033',
    },
    {
      name: 'Adyar Chennai',
      raw: 'Door No. 15, 2nd Main Road, Gandhi Nagar, Adyar, Chennai, Tamil Nadu 600020',
      components: {
        locality: 'Adyar',
        city: 'Chennai',
        district: 'Chennai',
        state: 'Tamil Nadu',
        pincode: '600020',
      },
      expectedLabel: 'Adyar, Chennai',
      expectedSubLabel: 'Tamil Nadu 600020',
    },
    {
      name: 'Sector 137 Noida Society',
      raw: 'Tower 4, Paras Tierea, Sector 137, Noida, Uttar Pradesh 201305',
      components: {
        residential: 'Paras Tierea',
        locality: 'Sector 137',
        city: 'Noida',
        district: 'Gautam Buddha Nagar',
        state: 'Uttar Pradesh',
        pincode: '201305',
      },
      expectedLabel: 'Paras Tierea, Noida',
      expectedSubLabel: 'Gautam Buddha Nagar, Uttar Pradesh 201305',
    },
    {
      name: 'Plus Code with Raw Address Only',
      raw: '7JVW+8X, Knowledge Park III, Greater Noida, Uttar Pradesh 201310',
      components: {
        rawFormatted: '7JVW+8X, Knowledge Park III, Greater Noida, Uttar Pradesh 201310',
      },
      expectedLabel: 'Knowledge Park III, Greater Noida',
      expectedSubLabel: 'Uttar Pradesh 201310',
    },
  ];

  testCases.forEach((tc) => {
    it(`builds clean locality label for ${tc.name}`, () => {
      const res = buildLocalityLabel(tc.components, tc.raw);
      expect(res.label).toBe(tc.expectedLabel);
      expect(res.subLabel).toBe(tc.expectedSubLabel);
      expect(res.label).not.toMatch(/tower|flat|room|plot|house|villa|#|flr|floor/i);
    });
  });
});

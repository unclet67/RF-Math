export interface HamBand {
  id: string;
  name: string;
  category: 'HF' | 'VHF' | 'UHF';
  minMHz: number;
  maxMHz: number;
  defaultMHz: number;
  cwMHz: number;
  ft8MHz?: number;
  ssbMHz: number;
  notes: string;
}

export const HAM_BANDS: HamBand[] = [
  { id: '160m', name: '160m', category: 'HF', minMHz: 1.8, maxMHz: 2.0, defaultMHz: 1.900, cwMHz: 1.810, ft8MHz: 1.840, ssbMHz: 1.900, notes: 'Top Band — Nighttime regional & DX' },
  { id: '80m', name: '80m / 75m', category: 'HF', minMHz: 3.5, maxMHz: 4.0, defaultMHz: 3.850, cwMHz: 3.550, ft8MHz: 3.573, ssbMHz: 3.850, notes: 'Nighttime ragchew & NVIS regional' },
  { id: '60m', name: '60m', category: 'HF', minMHz: 5.3305, maxMHz: 5.405, defaultMHz: 5.357, cwMHz: 5.332, ft8MHz: 5.357, ssbMHz: 5.3715, notes: '5 Channelized USB/CW allocations (100W ERP max)' },
  { id: '40m', name: '40m', category: 'HF', minMHz: 7.0, maxMHz: 7.3, defaultMHz: 7.185, cwMHz: 7.030, ft8MHz: 7.074, ssbMHz: 7.185, notes: 'Workhorse 24-hour band — Day regional, Night DX' },
  { id: '30m', name: '30m', category: 'HF', minMHz: 10.1, maxMHz: 10.15, defaultMHz: 10.136, cwMHz: 10.115, ft8MHz: 10.136, ssbMHz: 10.136, notes: 'WARC band — CW & Data only (200W PEP max in US)' },
  { id: '20m', name: '20m', category: 'HF', minMHz: 14.0, maxMHz: 14.35, defaultMHz: 14.225, cwMHz: 14.060, ft8MHz: 14.074, ssbMHz: 14.225, notes: 'Premier daytime global DX band' },
  { id: '17m', name: '17m', category: 'HF', minMHz: 18.068, maxMHz: 18.168, defaultMHz: 18.130, cwMHz: 18.080, ft8MHz: 18.100, ssbMHz: 18.130, notes: 'WARC band — Quiet, contest-free daytime DX' },
  { id: '15m', name: '15m', category: 'HF', minMHz: 21.0, maxMHz: 21.45, defaultMHz: 21.300, cwMHz: 21.060, ft8MHz: 21.074, ssbMHz: 21.300, notes: 'Solar cycle daytime DX powerhouse' },
  { id: '12m', name: '12m', category: 'HF', minMHz: 24.89, maxMHz: 24.99, defaultMHz: 24.950, cwMHz: 24.905, ft8MHz: 24.915, ssbMHz: 24.950, notes: 'WARC band — High solar activity daytime DX' },
  { id: '10m', name: '10m', category: 'HF', minMHz: 28.0, maxMHz: 29.7, defaultMHz: 28.400, cwMHz: 28.060, ft8MHz: 28.074, ssbMHz: 28.400, notes: 'Technician HF SSB privileges (28.3–28.5 MHz)' },
  { id: '6m', name: '6m', category: 'VHF', minMHz: 50.0, maxMHz: 54.0, defaultMHz: 50.125, cwMHz: 50.090, ft8MHz: 50.313, ssbMHz: 50.125, notes: 'The Magic Band — Sporadic-E & tropospheric openings' },
  { id: '2m', name: '2m', category: 'VHF', minMHz: 144.0, maxMHz: 148.0, defaultMHz: 146.520, cwMHz: 144.100, ft8MHz: 144.174, ssbMHz: 144.200, notes: '146.520 MHz National FM Simplex & local repeaters' },
  { id: '1.25m', name: '1.25m', category: 'VHF', minMHz: 222.0, maxMHz: 225.0, defaultMHz: 223.500, cwMHz: 222.050, ssbMHz: 222.100, notes: '223.500 MHz FM Simplex — Low noise urban VHF' },
  { id: '70cm', name: '70cm', category: 'UHF', minMHz: 420.0, maxMHz: 450.0, defaultMHz: 446.000, cwMHz: 432.090, ft8MHz: 432.174, ssbMHz: 432.100, notes: '446.000 MHz FM Simplex, satellites & DMR/D-STAR' },
  { id: '33cm', name: '33cm', category: 'UHF', minMHz: 902.0, maxMHz: 928.0, defaultMHz: 906.500, cwMHz: 902.100, ssbMHz: 902.100, notes: 'UHF experimenters & weak-signal band' },
  { id: '23cm', name: '23cm', category: 'UHF', minMHz: 1240.0, maxMHz: 1300.0, defaultMHz: 1296.100, cwMHz: 1296.100, ssbMHz: 1296.100, notes: 'EME (Moonbounce), ATV, and microwave entry' },
];

export interface CoaxCableSpec {
  id: string;
  name: string;
  type: 'Coax' | 'Hardline' | 'Balanced';
  z0: number; // Nominal impedance in Ohms
  vf: number; // Velocity Factor (0 to 1)
  /**
   * Attenuation model per 100 ft:
   * Loss(dB/100ft) = k1 * sqrt(f_MHz) + k2 * f_MHz
   */
  k1: number;
  k2: number;
  diameterIn: number;
  jacket: string;
  notes: string;
}

export const COAX_CABLES: CoaxCableSpec[] = [
  {
    id: 'rg174',
    name: 'RG-174/U (Miniature)',
    type: 'Coax',
    z0: 50,
    vf: 0.66,
    k1: 0.84,
    k2: 0.0025,
    diameterIn: 0.11,
    jacket: 'PVC',
    notes: 'Ultra-thin portable/SOTA jumpers only; high loss on VHF/UHF',
  },
  {
    id: 'rg58',
    name: 'RG-58A/U (Standard)',
    type: 'Coax',
    z0: 50,
    vf: 0.66,
    k1: 0.41,
    k2: 0.0018,
    diameterIn: 0.195,
    jacket: 'PVC',
    notes: 'Common mobile & QRP HF jumpers (<50 ft)',
  },
  {
    id: 'rg8x',
    name: 'RG-8X (Mini-8 Foam)',
    type: 'Coax',
    z0: 50,
    vf: 0.78,
    k1: 0.275,
    k2: 0.0012,
    diameterIn: 0.242,
    jacket: 'PVC',
    notes: 'Popular flexible HF dipole feedline with good handling',
  },
  {
    id: 'lmr240',
    name: 'Times Microwave LMR-240',
    type: 'Coax',
    z0: 50,
    vf: 0.84,
    k1: 0.202,
    k2: 0.00033,
    diameterIn: 0.240,
    jacket: 'PE',
    notes: 'Low-loss RG-8X size upgrade for HF/VHF/UHF runs',
  },
  {
    id: 'rg213',
    name: 'RG-213/U (Mil-Spec Solid PE)',
    type: 'Coax',
    z0: 50,
    vf: 0.66,
    k1: 0.182,
    k2: 0.0015,
    diameterIn: 0.405,
    jacket: 'PVC (UV)',
    notes: 'Rugged classic HF high-power cable; heavy & durable',
  },
  {
    id: 'belden9913',
    name: 'Belden 9913 (Semi-Rigid Air/PE)',
    type: 'Coax',
    z0: 50,
    vf: 0.84,
    k1: 0.128,
    k2: 0.00045,
    diameterIn: 0.405,
    jacket: 'PVC',
    notes: 'Low loss VHF/UHF cable; requires waterproofing at connectors',
  },
  {
    id: 'lmr400',
    name: 'Times Microwave LMR-400',
    type: 'Coax',
    z0: 50,
    vf: 0.85,
    k1: 0.12229,
    k2: 0.00026,
    diameterIn: 0.405,
    jacket: 'PE (UV)',
    notes: 'Gold standard for VHF/UHF & long HF base station runs',
  },
  {
    id: 'lmr600',
    name: 'Times Microwave LMR-600',
    type: 'Coax',
    z0: 50,
    vf: 0.87,
    k1: 0.0755,
    k2: 0.00026,
    diameterIn: 0.590,
    jacket: 'PE (UV)',
    notes: 'Heavy-duty low-loss feedline for long tower runs & UHF',
  },
  {
    id: 'heliax12',
    name: 'Andrew Heliax LDF4-50A (1/2" Foam)',
    type: 'Hardline',
    z0: 50,
    vf: 0.88,
    k1: 0.064,
    k2: 0.00018,
    diameterIn: 0.630,
    jacket: 'PE Corrugated Copper',
    notes: 'Repeater & weak-signal VHF/UHF/Microwave hardline',
  },
  {
    id: 'rg6',
    name: 'RG-6/U (75Ω Quad-Shield CATV)',
    type: 'Coax',
    z0: 75,
    vf: 0.82,
    k1: 0.195,
    k2: 0.0005,
    diameterIn: 0.270,
    jacket: 'PVC/PE',
    notes: 'Great match for single-band dipoles (~72Ω) & Beverage RX antennas',
  },
  {
    id: 'rg11',
    name: 'RG-11/U (75Ω Foam)',
    type: 'Coax',
    z0: 75,
    vf: 0.84,
    k1: 0.135,
    k2: 0.00045,
    diameterIn: 0.405,
    jacket: 'PE',
    notes: 'Used for 1/4λ 75Ω matching sections and low-loss RX runs',
  },
  {
    id: 'window450',
    name: '450Ω Slotted Window Line',
    type: 'Balanced',
    z0: 450,
    vf: 0.91,
    k1: 0.028,
    k2: 0.00015,
    diameterIn: 0.95,
    jacket: 'PE Web',
    notes: 'Ultra-low loss balanced line for multi-band Doublets / G5RV',
  },
  {
    id: 'openwire600',
    name: '600Ω Open-Wire Ladder Line',
    type: 'Balanced',
    z0: 600,
    vf: 0.97,
    k1: 0.016,
    k2: 0.00008,
    diameterIn: 2.0,
    jacket: 'Air / Spreaders',
    notes: 'Lowest possible HF loss; tolerates high SWR (10:1+) with minimal heating',
  },
];

export function calculateCableLossPer100Ft(cable: CoaxCableSpec, freqMHz: number): number {
  if (freqMHz <= 0) return 0;
  return cable.k1 * Math.sqrt(freqMHz) + cable.k2 * freqMHz;
}

export interface ToroidCoreSpec {
  id: string;
  name: string;
  material: string;
  type: 'Powdered Iron' | 'Ferrite';
  alValue: number; // Note: Powdered Iron AL is typically uH/100 turns, normalized here to nH/N^2 (so L_uH = AL_nH * N^2 / 1000)
  alPer100TurnsUH: number; // uH per 100 turns (so L_uH = alPer100TurnsUH * (N/100)^2)
  freqRange: string;
  color: string;
  odInch: number;
  notes: string;
}

export const TOROID_CORES: ToroidCoreSpec[] = [
  { id: 't37-2', name: 'T37-2', material: 'Mix 2 (Carbonyl E)', type: 'Powdered Iron', alValue: 4.0, alPer100TurnsUH: 40, freqRange: '2 – 30 MHz', color: 'Red', odInch: 0.375, notes: 'QRP low-pass filters & resonant tank circuits (80m–10m)' },
  { id: 't50-2', name: 'T50-2', material: 'Mix 2 (Carbonyl E)', type: 'Powdered Iron', alValue: 4.9, alPer100TurnsUH: 49, freqRange: '2 – 30 MHz', color: 'Red', odInch: 0.500, notes: 'Standard QRP/20W HF filters & inductors' },
  { id: 't68-2', name: 'T68-2', material: 'Mix 2 (Carbonyl E)', type: 'Powdered Iron', alValue: 5.7, alPer100TurnsUH: 57, freqRange: '2 – 30 MHz', color: 'Red', odInch: 0.690, notes: 'Medium power (50–100W) HF filters & L-networks' },
  { id: 't106-2', name: 'T106-2', material: 'Mix 2 (Carbonyl E)', type: 'Powdered Iron', alValue: 13.5, alPer100TurnsUH: 135, freqRange: '2 – 30 MHz', color: 'Red', odInch: 1.060, notes: '100W+ HF antenna tuners & high-Q tank coils' },
  { id: 't130-2', name: 'T130-2', material: 'Mix 2 (Carbonyl E)', type: 'Powdered Iron', alValue: 11.0, alPer100TurnsUH: 110, freqRange: '2 – 30 MHz', color: 'Red', odInch: 1.300, notes: 'High power HF tuner inductors & loading coils' },
  { id: 't200-2', name: 'T200-2', material: 'Mix 2 (Carbonyl E)', type: 'Powdered Iron', alValue: 12.0, alPer100TurnsUH: 120, freqRange: '2 – 30 MHz', color: 'Red', odInch: 2.000, notes: 'Legal limit (1.5kW) HF ATUs and matching networks' },
  { id: 't37-6', name: 'T37-6', material: 'Mix 6 (Carbonyl SF)', type: 'Powdered Iron', alValue: 3.0, alPer100TurnsUH: 30, freqRange: '10 – 50 MHz', color: 'Yellow', odInch: 0.375, notes: 'Upper HF & 6m high-stability QRP inductors' },
  { id: 't50-6', name: 'T50-6', material: 'Mix 6 (Carbonyl SF)', type: 'Powdered Iron', alValue: 4.0, alPer100TurnsUH: 40, freqRange: '10 – 50 MHz', color: 'Yellow', odInch: 0.500, notes: '20m–6m filters and VFO coils' },
  { id: 't68-6', name: 'T68-6', material: 'Mix 6 (Carbonyl SF)', type: 'Powdered Iron', alValue: 4.7, alPer100TurnsUH: 47, freqRange: '10 – 50 MHz', color: 'Yellow', odInch: 0.690, notes: '100W upper HF & 6m low-pass filters' },
  { id: 'ft50-43', name: 'FT50-43', material: 'Mix 43 (NiZn μ=800)', type: 'Ferrite', alValue: 440, alPer100TurnsUH: 4400, freqRange: '1 – 50 MHz (Wideband)', color: 'Dark Gray', odInch: 0.500, notes: 'Small broadband RF transformers & RX baluns' },
  { id: 'ft114-43', name: 'FT114-43', material: 'Mix 43 (NiZn μ=800)', type: 'Ferrite', alValue: 510, alPer100TurnsUH: 5100, freqRange: '1 – 50 MHz (Wideband)', color: 'Dark Gray', odInch: 1.140, notes: '100W portable EFHW 49:1 transformers & 1:1 chokes' },
  { id: 'ft140-43', name: 'FT140-43', material: 'Mix 43 (NiZn μ=800)', type: 'Ferrite', alValue: 885, alPer100TurnsUH: 8850, freqRange: '1 – 50 MHz (Wideband)', color: 'Dark Gray', odInch: 1.400, notes: 'Popular 100W EFHW 49:1 unun & 1:1 Guanella current balun' },
  { id: 'ft240-43', name: 'FT240-43', material: 'Mix 43 (NiZn μ=800)', type: 'Ferrite', alValue: 1075, alPer100TurnsUH: 10750, freqRange: '1 – 50 MHz (Wideband)', color: 'Dark Gray', odInch: 2.400, notes: 'High-power HF 49:1 EFHW, 4:1, 9:1 ununs & common-mode chokes' },
  { id: 'ft240-31', name: 'FT240-31', material: 'Mix 31 (MnZn μ=1500)', type: 'Ferrite', alValue: 1900, alPer100TurnsUH: 19000, freqRange: '1 – 30 MHz (Choking)', color: 'Dark Gray', odInch: 2.400, notes: 'Superior 160m–10m common-mode RFI choke / line isolator' },
  { id: 'ft240-61', name: 'FT240-61', material: 'Mix 61 (NiZn μ=125)', type: 'Ferrite', alValue: 170, alPer100TurnsUH: 1700, freqRange: '10 – 200 MHz', color: 'Dark Gray', odInch: 2.400, notes: 'Low-loss voltage baluns & high-power upper HF/VHF transformers' },
];

export interface DutyCyclePreset {
  id: string;
  name: string;
  dutyFactor: number; // 0 to 1
  description: string;
}

export const DUTY_CYCLE_PRESETS: DutyCyclePreset[] = [
  { id: 'cw', name: 'CW (Conversational Morse)', dutyFactor: 0.40, description: '40% key-down duty factor during sending' },
  { id: 'ssb_norm', name: 'SSB Voice (Unprocessed)', dutyFactor: 0.20, description: '20% average power to PEP ratio without speech compressor' },
  { id: 'ssb_proc', name: 'SSB Voice (Heavy Compression)', dutyFactor: 0.50, description: '50% average power to PEP ratio with heavy speech processing' },
  { id: 'fm', name: 'FM / Repeater / Simplex', dutyFactor: 1.00, description: '100% constant carrier envelope while PTT is pressed' },
  { id: 'ft8', name: 'FT8 / FT4 / JS8 / WSPR / RTTY', dutyFactor: 1.00, description: '100% continuous carrier during transmit cycle' },
  { id: 'am', name: 'AM (100% Modulation)', dutyFactor: 0.50, description: '50% average to PEP ratio (carrier is 25% of PEP)' },
];

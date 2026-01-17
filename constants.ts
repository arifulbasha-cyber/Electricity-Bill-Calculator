
import { MeterReading, TariffConfig, FirebaseConfigJson } from "./types";

export const INITIAL_CONFIG = {
  month: new Date().toLocaleString('default', { month: 'long' }),
  dateGenerated: new Date().toISOString().split('T')[0],
  totalBillPayable: 1497,
  bkashFee: 0,
  includeLateFee: false,
  includeBkashFee: false,
};

export const INITIAL_MAIN_METER: MeterReading = {
  id: 'main',
  name: 'Main Meter',
  meterNo: '0',
  previous: 2145,
  current: 2280,
};

export const INITIAL_METERS: MeterReading[] = [
  { id: '1', name: 'Uttom', meterNo: '1', previous: 0, current: 30 },
  { id: '2', name: 'Anayet', meterNo: '2', previous: 0, current: 100 },
  { id: '3', name: 'Arif', meterNo: '3', previous: 0, current: 75 },
];

export const DEFAULT_TARIFF_CONFIG: TariffConfig = {
  demandCharge: 84,
  meterRent: 10,
  vatRate: 0.05,
  bkashCharge: 10,
  slabs: [
    { limit: 75, rate: 5.26 },
    { limit: 200, rate: 7.20 },
    { limit: 300, rate: 7.59 },
    { limit: 400, rate: 8.02 },
  ]
};

// Added missing DEFAULT_FIREBASE_CONFIG used by firebase service fallback
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfigJson = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

export type JumpEvent = {
  start: number; // seconds
  land: number; // seconds
  airtime: number; // seconds
  peakG: number;
  rotInAir: number; // rad integrated during airtime
  size: 'petit' | 'normal' | 'gros';
};

export type TurnEvent = {
  start: number; // seconds
  end: number; // seconds
  deltaYawDeg: number; // |∫gz dt| converted to deg
  meanGz: number; // rad/s
  latG?: number; // optional proxy of lateral accel if available
  tightness: 'S' | 'M' | 'L';
};

export type SlopeSeg = {
  startIdx: number; // start index in GPS array
  endIdx: number; // end index in GPS array
  lengthM: number;
  gradePct: number;
  level: 'moderee' | 'raide' | 'tres_raide';
};

export type DifficultyBreakdown = {
  jumps: number;
  turns: number;
  slopes: number;
  roughness: number;
};

export type Analysis = {
  jumps: JumpEvent[];
  turns: TurnEvent[];
  slopes: SlopeSeg[];
  summary: {
    jumpCount: number;
    airtimeTotalSec: number;
    maxPeakG: number;
    steepLenM: number;
    turnsTight: number;
  };
  difficulty: { score: number; breakdown: DifficultyBreakdown };
};

export type Session = {
  _id: string; // MongoDB ObjectId as string
  name: string; // Name of the session
  startTime: Date; // Start time of the session
  endTime: Date | null; // End time of the session, can be null if ongoing
  notes?: string; // Additional notes for the session
  sensors: {
    accelerometer: AccelerometerData[]; // Array of accelerometer data
    gyroscope: GyroscopeData[]; // Array of gyroscope data
    gps: GPSData[]; // Array of GPS data
    barometer: BarometerData[]; // Array of barometer data
  };
  startTrack: {
    latitude: number; // Latitude of the starting point
    longitude: number; // Longitude of the starting point
  } | null; // Starting point of the session, can be null if not set
  userId: string; // User ID associated with the session
  totalDistance: number; // Total distance covered during the session in kilometers
  analysis?: Analysis; // Computed analysis (jumps/turns/slopes + score)
};

export type AccelerometerData = {
  timestamp: number; // Unix timestamp in milliseconds
  x: number; // Acceleration in the x-axis
  y: number; // Acceleration in the y-axis
  z: number; // Acceleration in the z-axis
};

export type GyroscopeData = {
  timestamp: number; // Unix timestamp in milliseconds
  x: number; // Angular velocity around the x-axis
  y: number; // Angular velocity around the y-axis
  z: number; // Angular velocity around the z-axis
};

export type GPSData = {
  timestamp: number;
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    speed?: number;
    heading?: number;
    altitudeAccuracy?: number;
  };
};

export type BarometerData = {
  timestamp: number; // Unix timestamp in milliseconds
  pressure: number; // Atmospheric pressure in hPa
  relativeAltitude?: number; // Relative altitude in meters, optional
};

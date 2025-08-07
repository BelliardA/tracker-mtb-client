export type Session = {
  _id: string;
  name: string;
  startTime: Date;
  endTime: Date | null;
  notes?: string;
  sensors: {
    accelerometer: AccelerometerData[];
    gyroscope: GyroscopeData[];
    gps: GPSData[];
    barometer: BarometerData[];
  };
  startTrack: {
    latitude: number;
    longitude: number;
  } | null;
  userId: string;
  totalDistance: number;
};

export type AccelerometerData = {
  timestamp: number;
  x: number;
  y: number;
  z: number;
};

export type GyroscopeData = {
  timestamp: number;
  x: number;
  y: number;
  z: number;
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
  timestamp: number;
  pressure: number;
  relativeAltitude?: number;
};

// app/types/user.ts
export type BestTrackTime = {
  sessionId: string; // côté front, les ObjectId sont des strings
  time: number;
};

export type User = {
  _id: string;
  email: string;

  firstName: string;
  lastName: string;
  nickname?: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';

  profilePictureUrl?: string;

  bikeBrand?: string;
  bikeModel?: string;
  bikeType?: 'trail' | 'enduro' | 'mtb' | 'dh';
  ridingStyle?: 'fun' | 'race' | 'exploration';

  totalRides?: number;
  totalDistance?: number;
  bestTrackTime?: BestTrackTime;

  createdAt?: string;
};

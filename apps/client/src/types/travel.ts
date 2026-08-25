export type TravelTag = {
  id: number;
  name: string;
  category: string;
};

export type Destination = {
  id: number;
  cityId: number | null;
  name: string;
  province: string | null;
  summary: string;
  coverImageUri: string | null;
  rating: number;
  popularity: number;
  isHot: boolean;
};

export type DestinationDetail = Destination & {
  city?: string | null;
  description?: string | null;
  category?: string | null;
  type?: string | null;
  tags?: string[];
  duration?: number | string | null;
  suitableDays?: number | string | null;
  bestSeason?: string | null;
  tips?: string[];
  difficulty?: number | null;
  relaxation?: number | null;
};

export type Attraction = {
  id: number;
  destinationId: number;
  activityId: number | null;
  name: string;
  summary: string;
  coverImageUri: string | null;
  ticketPriceMax: number;
  rating: number;
  suggestedDuration: number;
  popularity: number;
  destinationName: string;
};

export type RecommendItem = {
  attractionId: number;
  name: string;
  coverImageUri: string | null;
  score: number;
  matchTags: string[];
  aiReason: string;
  recStrategy: string[];
  rating: number;
  priceRange: string;
};

export type RecommendResponse = {
  recommendations: RecommendItem[];
  total: number;
  page: number;
};

export type SemanticSearchHit = {
  id: number;
  type: 'attraction' | 'destination';
  name: string;
  summary: string;
  score: number;
  tags: string[];
};

export type AiRecommendParams = {
  destination?: string;
  days?: number;
  budget?: number;
  travelers?: number;
  tripType?: string;
  preferences: string[];
  season?: string;
};

export type TripGenerateParams = {
  destination: string;
  days: number;
  travelers: number;
  budget: number;
  preferences: string[];
  tripType?: string;
};

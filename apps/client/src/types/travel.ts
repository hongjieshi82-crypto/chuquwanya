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

export type ComposedTripItem = {
  type: 'transport' | 'activity' | 'meal' | 'hotel' | 'nightlife';
  activityId: number | null;
  name: string;
  summary: string;
  timeSlot: '上午' | '中午' | '下午' | '晚上';
  startTime?: string;
  durationMinutes: number;
  budgetYuan: number;
  district: string;
  address: string;
  coverImageUri: string | null;
  sourceUrl?: string | null;
  transportNote?: string | null;
  tips: string[];
};

export type ComposedTrip = {
  destinationCityId: number;
  destination: string;
  originName?: string | null;
  daysCount: number;
  travelers: number;
  budgetTier?: 'budget' | 'standard' | 'premium' | 'luxury';
  totalBudgetEstimate: number;
  budgetBreakdown?: { intercityTransport: number; hotel: number; meals: number; localTransport: number; activities: number; reserve: number };
  stayRecommendation?: { name: string; address: string; tier: string; estimatedNightlyPrice: number; sourceUrl: string | null; note: string } | null;
  summary: string;
  days: { day: number; theme: string; dailyBudgetEstimate?: number; items: ComposedTripItem[] }[];
};

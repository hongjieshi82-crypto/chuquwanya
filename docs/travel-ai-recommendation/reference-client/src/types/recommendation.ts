export interface RecommendRequest {
  destination?: string;
  days?: number;
  budget?: number;
  travelers?: number;
  tripType?: string;
  preferences: string[];
  season?: string;
  page?: number;
  pageSize?: number;
}

export interface RecommendItem {
  attractionId: number;
  name: string;
  score: number;
  matchTags: string[];
  aiReason: string;
  recStrategy: string[];
  rating: number;
  priceRange: string;
}

export interface RecommendResponse {
  recommendations: RecommendItem[];
  total: number;
  page: number;
}

export type ApiResponse<T> = {
  data: T;
};

export type City = {
  id: number;
  name: string;
  code: string;
  province: string;
};

export type AccountGender = 'male' | 'female' | 'private';

export type UserMembership = {
  isVip: boolean;
  tier: 'free' | 'vip';
  status: 'inactive' | 'active';
  startsAt: string | null;
  expiresAt: string | null;
  weeklyTodoLimit: number;
  label: string;
};

export type GuestUser = {
  id: number;
  deviceId: string | null;
  nickname: string;
  phone: string | null;
  email: string | null;
  authType: 'guest' | 'registered';
  avatarUri?: string | null;
  gender?: AccountGender | null;
  membership?: UserMembership;
};

export type AuthSession = {
  token: string;
  user: GuestUser;
};

export type CheckinStatus = 'signed' | 'failed' | 'idle';

export type WeekCheckinDay = {
  date: string;
  weekday: string;
  status: CheckinStatus;
  isToday: boolean;
};

export type WeekCheckinSummary = {
  today: string;
  weekStart: string;
  signedDays: number;
  failedDays: number;
  rewardThreshold: number;
  remainingDaysForReward: number;
  rewardEarned: boolean;
  rewardType?: 'next_week_points';
  rewardPoints?: number;
  rewardLabel?: string;
  days: WeekCheckinDay[];
};

export type ProfileProgress = {
  level: number;
  levelName: string;
  totalXp: number;
  levelProgressXp: number;
  nextLevelXp: number;
  xpToNextLevel: number;
  levelProgressPercent: number;
  completedTodoCount: number;
  approvedDiaryCount: number;
  checkinCount: number;
  weekCheckinDays: number;
  nextLevelName: string;
};

export type RegisterInput = {
  email: string;
  code: string;
  nickname?: string;
  deviceId?: string;
};

export type LoginInput = {
  email: string;
  code: string;
  deviceId?: string;
};

export type AuthCodeTicket = {
  expiresInSeconds: number;
  retryAfterSeconds: number;
  devCode?: string;
};

export type VipPaymentCreateResponse = {
  orderNo: string;
  paymentUrl: string;
  amountYuan: string;
  provider: 'alipay';
  env: 'sandbox' | 'production';
};

export type PaymentOrderStatus = 'pending' | 'paid' | 'closed' | 'failed';

export type PaymentOrder = {
  orderNo: string;
  productCode: string;
  provider: 'alipay';
  providerTradeNo: string | null;
  amountYuan: string;
  currency: string;
  status: PaymentOrderStatus;
  paidAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SelectOption<T extends string | number | null> = {
  label: string;
  value: T;
};

export type PreferenceOptions = {
  partySizes: SelectOption<number>[];
  durations: SelectOption<number>[];
  budgets: SelectOption<number | null>[];
  moods: string[];
  categories: string[];
  environments: SelectOption<Preferences['environment']>[];
  radiuses: SelectOption<number | null>[];
};

export type Preferences = {
  partySize: number;
  durationMinutes: number | null;
  budgetMax: number | null;
  mood: string;
  randomLevel: number;
  category: string;
  environment: 'indoor' | 'outdoor' | 'either';
  radiusKm: number | null;
  originName?: string | null;
  originLatitude?: number | null;
  originLongitude?: number | null;
  originAccuracyMeters?: number | null;
  originSource?: 'device' | 'manual' | null;
  destinationScope?: 'nearby' | 'province' | 'nationwide';
  travelDuration?: '1-3days' | '3-5days' | '5-7days';
  clientSource?: 'mobile' | 'pc';
  destinationScopeLabel?: string | null;
  travelDurationLabel?: string | null;
  budgetLabel?: string | null;
  surpriseLevelLabel?: string | null;
};

export type Activity = {
  id: number;
  cityId: number;
  cityName: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  mood: string;
  moodTags: string[];
  environment: Preferences['environment'];
  minPartySize: number;
  maxPartySize: number;
  durationMinutes: number;
  budgetYuan: number;
  distanceKm: number;
  district: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  navigationUrl: string | null;
  coverImageUri?: string | null;
  steps: string[];
  tips: string[];
  accentColor: string;
};

export type DrawRequest = {
  userId: number;
  cityId: number;
  drawSessionId?: string;
  preferences: Preferences;
};

export type DrawRecommendation = {
  status: 'selected';
  cardId: number;
  poiId: number;
  reason: string;
  constraintSummary: {
    distance: string;
    budget: string;
    time: string;
    random: string;
  };
  display: {
    badge: string;
    cardPage: string;
    detailPage: string;
    schedulePage: string;
    executableLabel: string;
  };
};

export type DrawResult = {
  drawSessionId: string;
  attemptsUsed: number;
  attemptsRemaining: number;
  activity: Activity;
  recommendation?: DrawRecommendation;
};

export type DrawRestorePayload = {
  draw: DrawResult;
  input: {
    cityId: number;
    preferences: Preferences;
  };
};

export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export type Todo = {
  id: number;
  status: TodoStatus;
  startedAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  scheduledDate: string;
  weekStartDate?: string;
  activityId: number;
  title: string;
  summary: string;
  durationMinutes: number;
  budgetYuan: number;
  district: string;
  address: string;
  navigationUrl: string | null;
  accentColor: string;
  cityName: string;
};

export type CompletionVisibility = 'private' | 'public_requested';

export type CompletionAttachmentInput = {
  objectKey: string;
  mimeType: string;
  sizeBytes: number;
  checksum?: string;
};

export type CompletionSubmissionRequest = {
  feelingText: string;
  visibility: CompletionVisibility;
  attachments: CompletionAttachmentInput[];
};

export type CompletionSubmissionResult = {
  id: number;
  todoId: number;
  reviewStatus: 'pending' | 'approved' | 'rejected';
  visibility: CompletionVisibility;
  attachmentCount: number;
};

export type DiaryReviewStatus = 'pending' | 'approved' | 'rejected';

export type DiaryVisibility = CompletionVisibility | 'public';

export type DiaryAttachmentItem = {
  uri: string;
  mimeType: string;
};

export type MyDiaryItem = {
  id: number;
  todoId: number;
  title: string;
  summary: string;
  district: string;
  authorId?: number;
  authorName?: string;
  authorAvatarUri?: string | null;
  cityName: string;
  scheduledDate: string;
  submittedAt: string;
  feelingText: string;
  mood?: string;
  moodTags?: string[];
  visibility: DiaryVisibility;
  reviewStatus: DiaryReviewStatus;
  attachmentCount: number;
  attachments?: DiaryAttachmentItem[];
  commentCount?: number;
  likes?: number;
  isLikedByMe?: boolean;
  isFavoritedByMe?: boolean;
};

export type DiaryCommentItem = {
  id: number;
  diaryId: number;
  parentCommentId: number | null;
  replyToCommentId: number | null;
  replyToAuthor: string | null;
  userId: number;
  author: string;
  authorAvatarUri: string | null;
  body: string;
  createdAt: string;
  likes: number;
  replyCount: number;
  isLikedByMe: boolean;
  replies: DiaryCommentItem[];
};

export type DiaryCommentListResponse = {
  items: DiaryCommentItem[];
  total: number;
  topLevelTotal: number;
  limit: number;
  offset: number;
};

export type DiaryCommentCreateRequest = {
  body: string;
  parentCommentId?: number;
};

export type DiaryCommentLikeRequest = {
  action: "like" | "unlike";
};

export type DiaryCommentLikeResponse = {
  id: number;
  likes: number;
  isLikedByMe: boolean;
};

export type DiaryLikeRequest = {
  action: "like" | "unlike";
};

export type DiaryLikeResponse = {
  id: number;
  likes: number;
  isLikedByMe: boolean;
};

export type DiaryFavoriteRequest = {
  action: "favorite" | "unfavorite";
};

export type DiaryFavoriteResponse = {
  id: number;
  isFavoritedByMe: boolean;
};

export type DiaryHiddenRequest = {
  action: "hide" | "unhide";
};

export type DiaryHiddenResponse = {
  id: number;
  isHiddenByMe: boolean;
};

export type DiaryReportReason = "spam" | "harassment" | "false_information" | "inappropriate" | "other";

export type DiaryReportRequest = {
  reason: DiaryReportReason;
  detail?: string;
};

export type DiaryReportResponse = {
  id: number;
  reported: boolean;
};

export type CommunityTopicItem = {
  mood: string;
  name: string;
  count: number;
};

export type CommunityActiveUserItem = {
  id: number;
  name: string;
  avatarUri: string | null;
  diaryCount: number;
  followerCount: number;
  isFollowedByMe: boolean;
};

export type CommunityOverviewResponse = {
  topics: CommunityTopicItem[];
  activeUsers: CommunityActiveUserItem[];
};

export type CommunityFollowRequest = {
  action: "follow" | "unfollow";
};

export type CommunityFollowResponse = {
  id: number;
  followerCount: number;
  isFollowedByMe: boolean;
};

export type HistoryTodoStatus = 'completed' | 'expired' | 'abandoned';

export type HistoryItem = {
  id: number;
  title: string;
  summary: string;
  date: string;
  status: HistoryTodoStatus;
};

export type DiaryListResponse = {
  items: MyDiaryItem[];
  total: number;
  limit: number;
  offset: number;
};

export type HistoryListResponse = {
  items: HistoryItem[];
  total: number;
  limit: number;
  offset: number;
};

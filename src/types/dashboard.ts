export interface MonthlyTrend {
  month: string; // "2024-01"
  label: string; // "Jan 2024"
  attendances: number;
  feedbacks: number;
}

export interface TypeDistribution {
  type: "FORMATION" | "SERVICE";
  count: number;
}

export interface ServiceActivity {
  service: string;
  attendances: number;
  feedbacks: number;
}

export interface ServiceSatisfaction {
  service: string;
  avgRating: number;
}

export interface TopProgram {
  id: string;
  name: string;
  serviceName: string;
  participants: number;
  avgRating: number | null;
}

export interface TopIntervenant {
  id: string;
  name: string;
  activitiesCount: number;
  avgRating: number | null;
}

export interface TopActivity {
  id: string;
  title: string;
  serviceName: string;
  type: "FORMATION" | "SERVICE";
  avgRating: number;
  feedbacksCount: number;
}

export interface RatingDistribution {
  rating: number; // 1-5
  count: number;
}

export interface ClarityRate {
  yes: number;
  no: number;
  total: number;
}

export interface RecommendationRate {
  yes: number;
  no: number;
  total: number;
}

export interface DashboardStats {
  monthlyTrends: MonthlyTrend[];
  typeDistribution: TypeDistribution[];
  serviceActivity: ServiceActivity[];
  serviceSatisfaction: ServiceSatisfaction[];
  topPrograms: TopProgram[];
  topIntervenants: TopIntervenant[];
  topActivities: TopActivity[];
  ratingDistribution: RatingDistribution[];
  clarityRate: ClarityRate;
  recommendationRate: RecommendationRate;
}

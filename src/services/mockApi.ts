import { Course, EarningDataPoint, EarningSummary, Transaction, KycDetails } from '../types';

// Let's create complete static mock data sets to serve
const mockEarningChartData: EarningDataPoint[] = [
  { date: 'June 11', earnings: 25.50, referrals: 0 },
  { date: 'June 12', earnings: 50.50, referrals: 25.00 },
  { date: 'June 13', earnings: 18.20, referrals: 0 },
  { date: 'June 14', earnings: 30.60, referrals: 0 },
  { date: 'June 15', earnings: -195.00, referrals: 0 }, // payout event
  { date: 'June 16', earnings: 45.00, referrals: 25.00 },
  { date: 'June 17', earnings: 62.10, referrals: 25.00 },
  { date: 'June 18', earnings: 102.10, referrals: 50.00 },
  { date: 'June 19', earnings: 107.30, referrals: 5.20 },
  { date: 'June 20', earnings: 122.30, referrals: 15.00 },
  { date: 'June 21', earnings: 147.30, referrals: 25.00 },
  { date: 'June 22', earnings: 192.50, referrals: 0 }, // Current day Peak
];

// Reusable timer promise
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApiService = {
  // Fetch earning overall stats
  getEarningOverview: async (summary: EarningSummary): Promise<EarningSummary> => {
    await sleep(600); // Trigger skeleton loader
    return { ...summary };
  },

  // Fetch earnings history for the chart
  getEarningHistory: async (filterRange: '7days' | '30days' | 'all'): Promise<EarningDataPoint[]> => {
    await sleep(500);
    if (filterRange === '7days') {
      return mockEarningChartData.slice(-7);
    }
    if (filterRange === '30days') {
      return mockEarningChartData; // mock default full
    }
    return mockEarningChartData;
  },

  // Fetch transactions with filters
  getTransactions: async (
    transactions: Transaction[],
    filters: { category?: string; status?: string; search?: string }
  ): Promise<Transaction[]> => {
    await sleep(400);
    let result = [...transactions];

    if (filters.category && filters.category !== 'all') {
      result = result.filter(t => t.category.toLowerCase() === filters.category?.toLowerCase());
    }

    if (filters.status && filters.status !== 'all') {
      result = result.filter(t => t.status.toLowerCase() === filters.status?.toLowerCase());
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        t => t.description.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)
      );
    }

    return result;
  },

  // Fetch educational courses list
  getCourses: async (
    courses: Course[],
    filters: { category?: string; search?: string }
  ): Promise<Course[]> => {
    await sleep(500);
    let result = [...courses];

    if (filters.category && filters.category !== 'all') {
      result = result.filter(c => c.category.toLowerCase() === filters.category?.toLowerCase());
    }

    if (filters.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        c => c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q) || c.instructor.toLowerCase().includes(q)
      );
    }

    return result;
  },

  // Fetch KYC state
  getKycState: async (kycDetails: KycDetails): Promise<KycDetails> => {
    await sleep(300);
    return { ...kycDetails };
  },
};

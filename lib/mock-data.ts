import {
  getPolicy,
  getProviderHealth,
  getQuery,
  getQueryReport,
  getSummary,
  listKnowledgeSources,
} from '@/lib/server/knowledge-base';

export const mockSources = listKnowledgeSources();
export const mockQueryReport = getQueryReport('query-20260324-001');
export const mockQuery = getQuery('query-20260324-001');
export const mockCreateResponse = {
  query: {
    ...mockQuery,
    id: 'query-20260324-099',
    status: 'answered',
    updatedAt: '2026-03-24T10:20:00.000Z',
  },
  message: 'Query paid and answered successfully',
  estimatedCharge: 0.024,
};
export const mockProviderHealth = getProviderHealth();
export const mockPolicy = getPolicy();
export const mockSummaryStats = getSummary();

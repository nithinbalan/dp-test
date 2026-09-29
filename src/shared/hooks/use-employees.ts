/**
 * TanStack Query hooks for the Employees ("People & Awareness") page.
 * Talks to `/api/employees` — see docs/TANSTACK_QUERY.md.
 */
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/lib/api-client';

export const employeesKeys = {
  all: ['employees'] as const,
  list: () => [...employeesKeys.all, 'list'] as const,
};

export type AgentConnectionStatus = 'active' | 'outdated' | 'no-agent';
export type AwarenessStatus = 'certified' | 'in-progress' | 'overdue';

export type EmployeeRow = {
  id: string;
  code: string;
  fullName: string;
  workEmail: string | null;
  departmentName: string | null;
  designation: string | null;
  deviceCode: string | null;
  agentStatus: AgentConnectionStatus;
  awarenessPercent: number;
  awarenessStatus: AwarenessStatus;
};

export type EmployeesData = {
  employees: EmployeeRow[];
  withAgentCount: number;
  avgAwarenessPercent: number;
  overdueCount: number;
};

export type NewEmployeeParams = {
  fullName: string;
  workEmail?: string | undefined;
  department?: string | undefined;
  designation?: string | undefined;
};

export function useEmployees() {
  return useQuery({
    queryKey: employeesKeys.list(),
    queryFn: () => apiClient<EmployeesData>('/api/employees'),
    staleTime: 60 * 1000,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: NewEmployeeParams) =>
      apiClient<EmployeeRow>('/api/employees', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: employeesKeys.list() });
    },
  });
}

export type ImportRowSkipReason = 'VALIDATION_FAILED' | 'DUPLICATE_EMAIL';
export type ImportRowSkip = { row: number; reason: ImportRowSkipReason };
export type ImportEmployeesSummary = { insertedCount: number; skipped: ImportRowSkip[] };

/** Uploads a CSV to `/api/employees/import` — see the route for the bulk-create rules. */
export function useImportEmployeesCsv() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.set('file', file);
      return apiClient<ImportEmployeesSummary>('/api/employees/import', {
        method: 'POST',
        body: form,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: employeesKeys.list() });
    },
  });
}

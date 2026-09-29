'use client';

/**
 * TanStack Query hooks for the Departments list — shared by the Configuration
 * Studio "Department" panel and the Employees "Add employee" form, since both
 * read the same `/api/departments` list. See docs/TANSTACK_QUERY.md.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@shared/lib/api-client';

export const departmentKeys = {
  all: ['departments'] as const,
  list: () => [...departmentKeys.all, 'list'] as const,
};

export type DepartmentRow = { id: string; name: string; isActive: boolean };

export function useDepartments() {
  return useQuery({
    queryKey: departmentKeys.list(),
    queryFn: () => apiClient<DepartmentRow[]>('/api/departments'),
    staleTime: 60 * 1000,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) =>
      apiClient<DepartmentRow>('/api/departments', {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.list() });
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name, isActive }: { id: string; name: string; isActive: boolean }) =>
      apiClient<DepartmentRow>(`/api/departments/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name, isActive }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.list() });
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiClient<true>(`/api/departments/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: departmentKeys.list() });
    },
  });
}

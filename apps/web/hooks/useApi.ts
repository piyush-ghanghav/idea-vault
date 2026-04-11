import apiClient from '@/lib/api';
import { useAuth } from '@clerk/nextjs';


// This hook attaches clerk token to all API requests and provides a simple interface for making authenticated requests to the backend API.
// It abstracts away the details of token management and allows components to focus on their specific data needs.
export function useApi() {

    const { getToken, isLoaded, isSignedIn } = useAuth();


    const authRequest = async (fn: (token: string) => Promise<any>) => {
        if (!isLoaded || !isSignedIn) throw new Error('Not authenticated');
        const token = await getToken();
        if (!token) throw new Error('Not authenticated');
        return fn(token);
    }

    return {
        isLoaded,
        isSignedIn,
        // Ideas

        getIdeas: (params?: { cursor?: string, domain?: string }) =>
            authRequest(token =>
                apiClient.get('/api/ideas', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    params,
                }).then(res => res.data)
            ),
        createIdea: (data: { title: string, rawDump: string, domain: string }) =>
            authRequest(token =>
                apiClient.post('/api/ideas', data, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }).then(res => res.data)
            ),
        getIdea: (id: string) =>
            authRequest(token =>
                apiClient.get(`/api/ideas/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }).then(res => res.data)
            ),

        updateIdea: (id: string, data: { title?: string, status?: string }) =>
            authRequest(token =>
                apiClient.patch(`/api/ideas/${id}`, data, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }).then(res => res.data)
            ),

        deleteIdea: (id: string) =>
            authRequest(token =>
                apiClient.delete(`/api/ideas/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }).then(res => res.data)
            ),

        getCheckin: () =>
            authRequest(token =>
                apiClient.get('/api/focus/checkin', {
                    headers: { Authorization: `Bearer ${token}` },
                }).then(res => res.data)
            ),

        submitCheckin: (data: { availableHours: number; energyLevel: number; domainLeaning?: string }) =>
            authRequest(token =>
                apiClient.post('/api/focus/checkin', data, {
                    headers: { Authorization: `Bearer ${token}` },
                }).then(res => res.data)
            ),
        
        getGoals: () =>
            authRequest(token =>
                apiClient.get('/api/goals', {
                    headers: { Authorization: `Bearer ${token}` },
                }).then(res => res.data)
            ),

        createGoal: (data: { title: string; why?: string; estimatedHours?: number }) =>
            authRequest(token =>
                apiClient.post('/api/goals', data, {
                    headers: { Authorization: `Bearer ${token}` },
                }).then(res => res.data)
            ),

        reviewGoal: (id: string, quality: number) =>
            authRequest(token =>
                apiClient.post(`/api/goals/${id}/review`, { quality }, {
                    headers: { Authorization: `Bearer ${token}` },
                }).then(res => res.data)
            ),

        deleteGoal: (id: string) =>
            authRequest(token =>
                apiClient.delete(`/api/goals/${id}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }).then(res => res.data)
            ),
    }
}

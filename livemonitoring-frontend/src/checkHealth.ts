import apiClient from "./apiclient";

export type HealthResponse = {
    ok: boolean;
};

export async function getHealth(): Promise<boolean> {
    const response =
        await apiClient.get<HealthResponse>("/health");
    return response.data.ok ?? false;
}
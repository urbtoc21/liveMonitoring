export type WelcomeMessage = {
    type: "welcome";
    clientId: string;
};

export type SubscribedMetricsUpdate = {
    type: "subscribed-metrics-update";
    data: {
        cpu?: number;
        memory?: {
            used: number;
            total: number;
            percentage: number;
        };
    };
}

export type ServerMessage =
    WelcomeMessage | SubscribedMetricsUpdate;



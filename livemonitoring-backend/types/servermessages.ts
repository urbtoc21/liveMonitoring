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
        disk?: {
            name: string; // Neu: Name der Partition (z.B. "C:")
            used: number;
            total: number;
            percentage: number;
        }[];
    };
}

export type AlertTriggeredMessage = {
    type: "alert-triggered";
    metric: "cpu" | "memory";
    value: number;
}

export type ServerMessage =
    WelcomeMessage | SubscribedMetricsUpdate | AlertTriggeredMessage;



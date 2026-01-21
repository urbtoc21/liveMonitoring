export type subscribeCPU = {
    type: "subscribe-cpu";
    enabled: boolean;
}

export type subscribeMemory = {
    type: "subscribe-memory";
    enabled: boolean;
}

export type subscribeDisk = {
    type: "subscribe-disk";
    enabled: boolean;
}

export type subscribeAlert = {
    type: "subscribe-alert";
    cpuThreshold?: number;
    memoryThreshold?: number;
}

export type ClientMessage = subscribeCPU | subscribeMemory | subscribeDisk | subscribeAlert;
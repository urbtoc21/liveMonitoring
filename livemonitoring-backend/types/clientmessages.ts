export type subscribeCPU = {
    type: "subscribe-cpu";
    enabled: boolean;
}

export type subscribeMemory = {
    type: "subscribe-memory";
    enabled: boolean;
}

export type ClientMessage = subscribeCPU | subscribeMemory;
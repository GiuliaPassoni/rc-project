import { setup } from "xstate";

export const machine = setup({
    types: {
        context: {} as {},
        events: {} as
            | { type: "cycle_start" }
            | { type: "cycle_end" }
            | { type: "fault" }
            | { type: "maintenance_start" }
            | { type: "maintenance_end" }
            | { type: "power_on" }
            | { type: "power_off" }
            | { type: "unknown" },
    },
}).createMachine({
    context: {},
    id: "RoboticCell",
    initial: "IDLE",
    states: {
        IDLE: {
            on: {
                cycle_start: {
                    target: "RUNNING",
                },
                fault: {
                    target: "FAULT",
                },
                unknown: {
                    target: "UNKNOWN",
                },
                power_off: {
                    target: "OFFLINE"
                }
            },
            description:
                "The robotic cell is currently idle and not performing any operations.",
        },
        RUNNING: {
            on: {
                cycle_end: {
                    target: "IDLE",
                },
                fault: {
                    target: "FAULT",
                },
                unknown: {
                    target: "UNKNOWN",
                },
                power_off: {
                    target: "OFFLINE"
                }
            },
            description: "The robotic cell is actively performing its tasks.",
        },
        FAULT: {
            on: {
                maintenance_start: {
                    target: "MAINTENANCE",
                },
                unknown: {
                    target: "UNKNOWN",
                },
                power_off: {
                    target: "OFFLINE"
                }
            },
            description:
                "The robotic cell has encountered a fault and is unable to continue operations.",
        },
        UNKNOWN: {
            on: {
                cycle_start: {
                    target: "RUNNING",
                },
                cycle_end: {
                    target: "IDLE",
                },
                fault: {
                    target: "FAULT",
                },
                maintenance_start: {
                    target: "MAINTENANCE",
                },
                maintenance_end: {
                    target: "IDLE",
                },
                power_off: {
                    target: "OFFLINE"
                }
            },
            description:
                "The state of the robotic cell is unknown due to a gap in data or missing events.",
        },
        MAINTENANCE: {
            on: {
                maintenance_end: {
                    target: "IDLE",
                },
                unknown: {
                    target: "UNKNOWN",
                },
                power_off: {
                    target: "OFFLINE"
                }
            },
            description:
                "The robotic cell is undergoing maintenance to resolve issues or perform routine checks.",
        },
        OFFLINE: {
            on: {
                power_on: {
                    target: "IDLE"
                }
            },
            description:
                "The robotic cell is offline.",
        }
    },
});

import arcjet, { tokenBucket } from "@arcjet/next";

const aj = arcjet({
    key: process.env.ARCJET_KEY,
    characteristics:["userId"],
    rules:[
        tokenBucket({
            interval: "1m",
            mode: "LIVE",
            refillRate: 10,
            capacity: 10,
        }),
    ],
});

export default aj;
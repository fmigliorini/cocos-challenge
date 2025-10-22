import { Params } from "nestjs-pino";

const isProduction = process.env.NODE_ENV === 'PROD';

export const pinoHttpOptions: Params['pinoHttp'] = {
    level: process.env.LOG_LEVEL ?? (isProduction ? 'info' : 'debug'),
    redact: ['email', 'name'], // Hide sensitive data
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: !isProduction,
            singleLine: isProduction,
        },
    },
    serializers: {
        req: (req: any) => {
            return {
                method: req.method,
                url: req.url,
            };
        },
    },
};
import { Global, Module } from "@nestjs/common";
import { pinoHttpOptions } from "./pino.options";
import { LoggerModule, PinoLogger } from "nestjs-pino";

@Module({
    imports: [
        LoggerModule.forRoot({
            pinoHttp: pinoHttpOptions,
        }),
    ],
    exports: [LoggerModule],
})
export class LoggingModule {}
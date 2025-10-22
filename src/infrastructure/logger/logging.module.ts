import { Global, Module } from "@nestjs/common";
import { pinoHttpOptions } from "./pino.options";
import { LoggerModule } from "nestjs-pino";

@Global()
@Module({
    imports: [
        LoggerModule.forRoot({
            pinoHttp: pinoHttpOptions,
        }),
    ],
    exports: [LoggerModule],
})
export class LoggingModule {}
import { Prisma } from "../generated/prisma/client";

export interface IApprovedApplicationResponse {
    message: string, 
    application: Prisma.CourierApplicationGetPayload<{}>,
    profile: Prisma.CourierProfileGetPayload<{}>
}
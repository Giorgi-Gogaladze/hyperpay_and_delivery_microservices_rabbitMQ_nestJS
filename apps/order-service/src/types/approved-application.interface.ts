import { Prisma } from "../generated/prisma/client";

export interface IApprovedApplicationResponse {
    application: Prisma.CourierApplicationGetPayload<{}>,
    profile: Prisma.CourierProfileGetPayload<{}>
}
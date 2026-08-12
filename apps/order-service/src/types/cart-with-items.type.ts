import { Cart, CartItem, Prisma} from '../generated/prisma/client'

export type CartWithItems = Prisma.CartGetPayload<{
    include: {cartItems: true}
}>
import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
    interface Session {
        user: {
            id: string
            role: string
            phone: string | null
            restrictedAccess: boolean
            city?: string | null
            country?: string | null
            address?: string | null
            house?: string | null
            floor?: string | null
            darkMode?: boolean
        } & DefaultSession["user"]
    }

    interface User extends DefaultUser {
        role: string
        phone: string | null
        restrictedAccess: boolean
        city?: string | null
        country?: string | null
        address?: string | null
        house?: string | null
        floor?: string | null
        darkMode?: boolean
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id: string
        role: string
        phone: string | null
        restrictedAccess: boolean
        city?: string | null
        country?: string | null
        address?: string | null
        house?: string | null
        floor?: string | null
        darkMode?: boolean
    }
}

import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh'){
    constructor(){
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.JWT_REFRESH_SECRET,
            passReqToCallback: true
        });
    }

    validate(req: Request, payload: {sub: string; email: string; role: string}){
        const refreshToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);

        return {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            refreshToken,
        };
    }
}
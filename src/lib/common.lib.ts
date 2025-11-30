import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
    id: string;
    username: string
    email: string
}

export interface AuthRequest extends Request{
    user?: {id: string; username: string, email: string};
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction)=> {
    try{
        const authHeader = req.headers.authorization;
        const tokenFromHeader = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
        const token = tokenFromHeader || (req.cookies && req.cookies.token) || null;

        if (!token) {
            return res.status(401).json({ message: "No token provided, authorization denied" });
        }

        const secret = process.env.JWT_SECRET!;
        const decoded = jwt.verify(token, secret) as JwtPayload;
        req.user = { id: decoded.id, username: decoded.username, email: decoded.email };
        next();
    }catch(err){
        console.log(err);
        return res.status(401).json({ message: "Token is not valid" });
    }
}







// export async function verifyToken(
//   accessToken: string
// ): Promise<Record<string, any>> {
//   return new Promise((resolve, reject) => {
//     jwtToken.verify(accessToken, JWT_SECRET, (error, decoded) => {
//       if (error) {
//         reject(error)
//       }
//       resolve(decoded as Record<string, any>)
//     })
//   })
// }

// export const generateOtp = () => Math.floor(1000 + Math.random() * 9000)

// export const generateBase64Url = () =>
//   crypto.randomBytes(32).toString('base64url')
// export const generateCoupon = () => crypto.randomBytes(3).toString('hex')
// export const generatePassword = () => crypto.randomBytes(16).toString('hex')

// export const getHtml = async (
//   templateName: string,
//   data: ejs.Data,
//   options?: ejs.Options
// ) => {
//   try {
//     return await ejs.renderFile(
//       path.join(process.cwd(), 'assets', templateName),
//       data,
//       options
//     )
//   } catch (error) {
//     console.error('Email Lib getHtml:- ', error)
//     throw error
//   }
// }

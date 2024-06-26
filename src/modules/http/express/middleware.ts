import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

class ExpressMiddleware {
  public verifyToken(secretToken: string) {
    return (req: Request, res: Response, next: NextFunction) => {
      const token = req.headers.authorization;

      if (!token)
        return res.status(401).json({ message: "Token not provided" });

      const tokenParts = token.split(" ");

      if (tokenParts.length !== 2 || tokenParts[0] !== "Bearer")
        return res.status(401).json({ message: "Invalid token format" });

      try {
        jwt.verify(tokenParts[1], secretToken);

        next();
      } catch (error) {
        return res.status(401).json({ message: "Invalid token" });
      }
    };
  }
}

export { ExpressMiddleware };

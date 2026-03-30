import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Interface pour étendre le type Request d'Express et y ajouter l'utilisateur
export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    isAdmin: boolean;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  // 1. Récupérer le token dans le header "Authorization"
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ message: "Accès refusé. Token manquant." });
  }

  try {
    // 2. Vérifier la validité du token avec ta clé secrète
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    
    // 3. Ajouter les infos de l'utilisateur à l'objet Request
    req.user = decoded;
    
    // 4. Passer à la fonction suivante (le contrôleur)
    next();
  } catch (error) {
    return res.status(403).json({ message: "Token invalide ou expiré." });
  }
};
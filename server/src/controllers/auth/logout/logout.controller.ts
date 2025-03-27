import { Request, Response } from 'express';
import { clearTokens } from '../../../utils/auth/auth.js';

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    // Clear tokens
    await clearTokens(req, res);
    
    // Send success response
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
};

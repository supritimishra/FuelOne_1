import { Router } from 'express';

export const userManagementRouter = Router();

userManagementRouter.get('/', (req, res) => {
  res.json({ message: "User management stub" });
});

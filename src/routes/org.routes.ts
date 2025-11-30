import { Router } from 'express';
import { requireAuth } from '../lib';
import { createOrg, getOrg } from '../controllers';

const router = Router();

router.post("/", requireAuth, createOrg);
router.get("/:id", requireAuth, getOrg);

export default router;
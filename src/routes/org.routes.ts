import { Router } from 'express';
import { requireAuth } from '../lib';
import { createOrg, getAllMembers, getOrg, getUserOrgs } from '../controllers';

const router = Router();

router.post("/createOrg", requireAuth, createOrg);
router.get("/:id", requireAuth, getOrg);
router.get("/:orgId/members", requireAuth, getAllMembers)
router.get("/user/:userId", requireAuth, getUserOrgs)
export default router;
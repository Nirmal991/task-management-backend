import { Router } from "express";
import { requireAuth } from "../lib";
import { inviteMembers } from "../controllers";

const router = Router();

router.post("/organizations/:orgId/invite", requireAuth, inviteMembers)

export default router;

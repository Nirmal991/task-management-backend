import { Router } from "express";
import { requireAuth } from "../lib";
import { acceptOrgInvite, inviteMembers } from "../controllers";

const router = Router();

router.post("/organizations/:orgId/invite", requireAuth, inviteMembers)
router.post("/invitations/accept",requireAuth,acceptOrgInvite)

export default router;

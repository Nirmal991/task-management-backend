import { Router } from "express";
import { getAllUser, getUserById, login, signUp } from "../controllers";

const router = Router();

router.post("/signup", signUp); 

router.post('/login',login);

router.get('/users', getAllUser)
router.get('/users/:id', getUserById)


export default router;
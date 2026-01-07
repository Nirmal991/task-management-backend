import { Router } from "express";
import { getAllUser, getUserById, login, signUp } from "../controllers";
import { transporter } from "../lib";

const router = Router();

router.post("/signup", signUp);

router.post("/login", login);

router.get("/users", getAllUser);
router.get("/users/:id", getUserById);

router.post("/test-send-email", async (req, res) => {
  await transporter.sendMail({
    to: "foreverabhi@mailinator.com",
    subject: `Invitation to join `,
    html: `<h3>You have been invited to join</h3>`,
  });
  res.send("Email sent!");
});

export default router;

import { Router } from "express";

import { createData, deleteData, getAllData, updateData } from "../controllers";

const router = Router();

router.route("/").get(getAllData);

router.route("/add").post(createData);

router.route("/:id").put(updateData).delete(deleteData);

export default router;

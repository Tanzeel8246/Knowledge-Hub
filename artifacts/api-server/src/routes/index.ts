import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import quranRouter from "./quran";
import hadithRouter from "./hadith";
import booksRouter from "./books";
import learningRouter from "./learning";
import workspaceRouter from "./workspace";
import progressRouter from "./progress";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(usersRouter);
router.use(quranRouter);
router.use(hadithRouter);
router.use(booksRouter);
router.use(learningRouter);
router.use(workspaceRouter);
router.use(progressRouter);
router.use(adminRouter);

export default router;

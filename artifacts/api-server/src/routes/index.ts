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
import trackersRouter from "./trackers";
import duasRouter from "./duas";
import fiqhRouter from "./fiqh";
import researchRouter from "./research";
import spiritualRouter from "./spiritual";
import communityRouter from "./community";

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
router.use(trackersRouter);
router.use(duasRouter);
router.use(fiqhRouter);
router.use(researchRouter);
router.use(spiritualRouter);
router.use(communityRouter);

export default router;





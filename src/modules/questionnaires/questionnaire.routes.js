import { Router } from "express";
import { authenticate, optionalAuth } from "../../middleware/auth.js";
import { authorize } from "../../middleware/rbac.js";
import prisma from "../../config/prisma.js";
import { successResponse, paginatedResponse, buildPaginationResponse, parsePaginationParams } from "../../utils/helpers.js";
import { NotFoundError } from "../../utils/errors.js";
import { HTTP_STATUS } from "../../config/constants.js";

const router = Router();

/**
 * @swagger
 * /api/v1/questionnaires/categories:
 *   get:
 *     summary: Get questionnaire categories
 *     tags: [Questionnaires]
 */
router.get("/categories", async (req, res, next) => {
  try {
    const categories = await prisma.questionnaireCategory.findMany({
      where: { is_active: true },
      orderBy: { display_order: "asc" },
    });
    res.json(successResponse(categories));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/questionnaires/questions:
 *   get:
 *     summary: Get questions
 *     tags: [Questionnaires]
 */
router.get("/questions", async (req, res, next) => {
  try {
    const { category_id } = req.query;
    const where = { is_active: true };
    if (category_id) where.category_id = category_id;

    const questions = await prisma.question.findMany({
      where,
      orderBy: { display_order: "asc" },
    });

    // Get options for each question
    const questionIds = questions.map(q => q.id);
    const options = await prisma.questionOption.findMany({
      where: { question_id: { in: questionIds }, is_active: true },
      orderBy: { display_order: "asc" },
    });

    const questionsWithOptions = questions.map(q => ({
      ...q,
      options: options.filter(o => o.question_id === q.id),
    }));

    res.json(successResponse(questionsWithOptions));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/questionnaires/answers:
 *   post:
 *     summary: Submit questionnaire answers
 *     tags: [Questionnaires]
 *     security:
 *       - BearerAuth: []
 */
router.post("/answers", authenticate, async (req, res, next) => {
  try {
    const { answers } = req.body; // Array of { question_id, answer_text?, answer_scale?, selected_option_ids? }

    const createdAnswers = await Promise.all(
      answers.map(async (answer) => {
        const question = await prisma.question.findUnique({ where: { id: answer.question_id } });
        return prisma.questionnaireAnswer.create({
          data: {
            user_id: req.user.id,
            question_id: answer.question_id,
            answer_text: answer.answer_text,
            answer_scale: answer.answer_scale,
            selected_option_ids: answer.selected_option_ids || [],
            question_snapshot: question,
          },
        });
      })
    );

    res.status(HTTP_STATUS.CREATED).json(successResponse(createdAnswers, "Answers submitted successfully"));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/questionnaires/categories:
 *   post:
 *     summary: Create questionnaire category (Admin)
 *     tags: [Questionnaires]
 *     security:
 *       - BearerAuth: []
 */
router.post("/categories", authenticate, authorize("questionnaires:create"), async (req, res, next) => {
  try {
    const { name, description, display_order } = req.body;
    const category = await prisma.questionnaireCategory.create({
      data: { name, description, display_order, is_active: true, created_by: req.user.id },
    });
    res.status(HTTP_STATUS.CREATED).json(successResponse(category));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/questionnaires/questions:
 *   post:
 *     summary: Create question (Admin)
 *     tags: [Questionnaires]
 *     security:
 *       - BearerAuth: []
 */
router.post("/questions", authenticate, authorize("questionnaires:create"), async (req, res, next) => {
  try {
    const { category_id, question_text, question_type, is_required, display_order, scale_min, scale_max, scale_min_label, scale_max_label, options } = req.body;

    const question = await prisma.question.create({
      data: {
        category_id,
        question_text,
        question_type,
        is_required: is_required ?? true,
        display_order,
        scale_min,
        scale_max,
        scale_min_label,
        scale_max_label,
        is_active: true,
        created_by: req.user.id,
      },
    });

    if (options && options.length > 0) {
      await Promise.all(
        options.map((opt, idx) =>
          prisma.questionOption.create({
            data: { question_id: question.id, option_text: opt.option_text, display_order: idx, is_active: true },
          })
        )
      );
    }

    res.status(HTTP_STATUS.CREATED).json(successResponse(question));
  } catch (error) {
    next(error);
  }
});

export default router;

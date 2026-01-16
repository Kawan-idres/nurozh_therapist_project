import { Router } from "express";
import { authenticate, optionalAuth } from "../../middleware/auth.js";
import { authorize } from "../../middleware/rbac.js";
import prisma from "../../config/prisma.js";
import { successResponse, paginatedResponse, buildPaginationResponse, parsePaginationParams } from "../../utils/helpers.js";
import { NotFoundError, ForbiddenError, BadRequestError } from "../../utils/errors.js";
import { HTTP_STATUS, USER_TYPES } from "../../config/constants.js";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     QuestionnaireCategory:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         name:
 *           type: object
 *           description: Multilingual name
 *           example: {"en": "Mental Health Assessment", "ar": "تقييم الصحة النفسية"}
 *         description:
 *           type: object
 *           description: Multilingual description
 *           example: {"en": "Questions to assess your mental health status"}
 *         display_order:
 *           type: integer
 *           example: 1
 *         is_active:
 *           type: boolean
 *           example: true
 *         created_at:
 *           type: string
 *           format: date-time
 *     Question:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         category_id:
 *           type: integer
 *           example: 1
 *         question_text:
 *           type: object
 *           description: Multilingual question text
 *           example: {"en": "How often do you feel anxious?", "ar": "كم مرة تشعر بالقلق؟"}
 *         question_type:
 *           type: string
 *           enum: [single_choice, multiple_choice, scale, text]
 *           example: single_choice
 *         is_required:
 *           type: boolean
 *           example: true
 *         display_order:
 *           type: integer
 *           example: 1
 *         scale_min:
 *           type: integer
 *           description: Minimum value for scale questions
 *           example: 1
 *         scale_max:
 *           type: integer
 *           description: Maximum value for scale questions
 *           example: 10
 *         scale_min_label:
 *           type: object
 *           example: {"en": "Never", "ar": "أبداً"}
 *         scale_max_label:
 *           type: object
 *           example: {"en": "Always", "ar": "دائماً"}
 *         options:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/QuestionOption'
 *     QuestionOption:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         question_id:
 *           type: integer
 *           example: 1
 *         option_text:
 *           type: object
 *           description: Multilingual option text
 *           example: {"en": "Never", "ar": "أبداً"}
 *         display_order:
 *           type: integer
 *           example: 0
 *     QuestionnaireAnswer:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         user_id:
 *           type: integer
 *           example: 1
 *         question_id:
 *           type: integer
 *           example: 1
 *         answer_text:
 *           type: string
 *           description: Free text answer (for text type questions)
 *           example: "I often feel stressed at work"
 *         answer_scale:
 *           type: integer
 *           description: Scale value (for scale type questions)
 *           example: 7
 *         selected_option_ids:
 *           type: array
 *           items:
 *             type: integer
 *           description: Selected option IDs (for choice type questions)
 *           example: [1, 3]
 *         answered_at:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/v1/questionnaires/categories:
 *   get:
 *     summary: Get all questionnaire categories
 *     description: Returns a list of all active questionnaire categories. No authentication required.
 *     tags: [Questionnaires]
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/QuestionnaireCategory'
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   name: {"en": "Mental Health Assessment", "ar": "تقييم الصحة النفسية"}
 *                   description: {"en": "Questions to assess your mental health status"}
 *                   display_order: 1
 *                   is_active: true
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
 *     summary: Get all questions with options
 *     description: Returns a list of all active questions with their options. Optionally filter by category.
 *     tags: [Questionnaires]
 *     parameters:
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
 *         description: Filter questions by category ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Question'
 *             example:
 *               success: true
 *               data:
 *                 - id: 1
 *                   category_id: 1
 *                   question_text: {"en": "How often do you feel anxious?", "ar": "كم مرة تشعر بالقلق؟"}
 *                   question_type: single_choice
 *                   is_required: true
 *                   display_order: 1
 *                   options:
 *                     - id: 1
 *                       question_id: 1
 *                       option_text: {"en": "Never", "ar": "أبداً"}
 *                       display_order: 0
 *                     - id: 2
 *                       question_id: 1
 *                       option_text: {"en": "Sometimes", "ar": "أحياناً"}
 *                       display_order: 1
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
 *     summary: Submit questionnaire answers (User only)
 *     description: Submit answers to questionnaire questions. Users can submit multiple answers at once.
 *     tags: [Questionnaires]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - answers
 *             properties:
 *               answers:
 *                 type: array
 *                 description: Array of answers to submit
 *                 items:
 *                   type: object
 *                   required:
 *                     - question_id
 *                   properties:
 *                     question_id:
 *                       type: integer
 *                       description: ID of the question being answered
 *                       example: 1
 *                     answer_text:
 *                       type: string
 *                       description: Free text answer (for text type questions)
 *                       example: "I feel stressed when dealing with deadlines"
 *                     answer_scale:
 *                       type: integer
 *                       description: Scale value (for scale type questions)
 *                       example: 7
 *                     selected_option_ids:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       description: Selected option IDs (for choice type questions)
 *                       example: [1, 3]
 *           example:
 *             answers:
 *               - question_id: 1
 *                 selected_option_ids: [2]
 *               - question_id: 2
 *                 answer_scale: 7
 *               - question_id: 3
 *                 answer_text: "I feel anxious when meeting new people"
 *     responses:
 *       201:
 *         description: Answers submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Answers submitted successfully"
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/QuestionnaireAnswer'
 *       401:
 *         description: Unauthorized - Authentication required
 */
router.post("/answers", authenticate, async (req, res, next) => {
  try {
    // Only users (patients) can submit questionnaire answers
    if (req.user.type !== USER_TYPES.USER) {
      throw new ForbiddenError("Only patients can submit questionnaire answers");
    }

    const { answers } = req.body; // Array of { question_id, answer_text?, answer_scale?, selected_option_ids? }

    if (!answers || !Array.isArray(answers) || answers.length === 0) {
      throw new BadRequestError("Answers array is required and cannot be empty");
    }

    // Validate all question_ids exist
    const questionIds = answers.map(a => a.question_id);
    const existingQuestions = await prisma.question.findMany({
      where: { id: { in: questionIds }, is_active: true },
    });

    if (existingQuestions.length !== questionIds.length) {
      const existingIds = existingQuestions.map(q => q.id);
      const missingIds = questionIds.filter(id => !existingIds.includes(id));
      throw new BadRequestError(`Invalid question IDs: ${missingIds.join(", ")}`);
    }

    // Create a map of questions for snapshot
    const questionsMap = {};
    existingQuestions.forEach(q => { questionsMap[q.id] = q; });

    const createdAnswers = await Promise.all(
      answers.map(async (answer) => {
        return prisma.questionnaireAnswer.create({
          data: {
            user_id: req.user.id,
            question_id: answer.question_id,
            answer_text: answer.answer_text,
            answer_scale: answer.answer_scale,
            selected_option_ids: answer.selected_option_ids || [],
            question_snapshot: questionsMap[answer.question_id],
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
 * /api/v1/questionnaires/answers/user/{userId}:
 *   get:
 *     summary: Get questionnaire answers for a specific user (Therapist only)
 *     description: Therapists can view questionnaire answers for their clients. Must have an existing booking relationship with the user.
 *     tags: [Questionnaires]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to get answers for
 *         example: 1
 *     responses:
 *       200:
 *         description: Answers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         first_name:
 *                           type: string
 *                         last_name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         gender:
 *                           type: string
 *                         date_of_birth:
 *                           type: string
 *                     answers:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           question_id:
 *                             type: integer
 *                           answer_text:
 *                             type: string
 *                           answer_scale:
 *                             type: integer
 *                           selected_option_ids:
 *                             type: array
 *                             items:
 *                               type: integer
 *                           question:
 *                             $ref: '#/components/schemas/Question'
 *                           selected_options:
 *                             type: array
 *                             items:
 *                               $ref: '#/components/schemas/QuestionOption'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Only therapists can view client answers, or no booking relationship exists
 *       404:
 *         description: User not found
 */
router.get("/answers/user/:userId", authenticate, async (req, res, next) => {
  try {
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(userId)) {
      throw new BadRequestError("Invalid user ID");
    }

    // Only therapists can view client answers
    if (req.user.type !== USER_TYPES.THERAPIST) {
      throw new ForbiddenError("Only therapists can view client questionnaire answers");
    }

    // Verify that the therapist has a booking relationship with this user
    const hasBooking = await prisma.booking.findFirst({
      where: {
        therapist_id: req.user.id,
        user_id: userId,
      },
    });

    if (!hasBooking) {
      throw new ForbiddenError("You can only view questionnaire answers for your clients");
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        gender: true,
        date_of_birth: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Get questionnaire answers
    const answers = await prisma.questionnaireAnswer.findMany({
      where: { user_id: userId },
      orderBy: { answered_at: "desc" },
    });

    // Get question details for each answer
    const questionIds = [...new Set(answers.map(a => a.question_id))];
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
    });

    // Get options for questions
    const options = await prisma.questionOption.findMany({
      where: { question_id: { in: questionIds } },
    });

    const questionsMap = {};
    questions.forEach(q => { questionsMap[q.id] = q; });

    const optionsMap = {};
    options.forEach(o => {
      if (!optionsMap[o.question_id]) optionsMap[o.question_id] = [];
      optionsMap[o.question_id].push(o);
    });

    // Build response with question details
    const answersWithDetails = answers.map(answer => {
      const question = questionsMap[answer.question_id] || answer.question_snapshot;
      const questionOptions = optionsMap[answer.question_id] || [];

      // Get selected option texts
      let selectedOptions = [];
      if (answer.selected_option_ids && Array.isArray(answer.selected_option_ids)) {
        selectedOptions = questionOptions.filter(o => answer.selected_option_ids.includes(o.id));
      }

      return {
        ...answer,
        question,
        selected_options: selectedOptions,
      };
    });

    res.json(successResponse({
      user,
      answers: answersWithDetails,
    }));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/questionnaires/my-answers:
 *   get:
 *     summary: Get current user's own questionnaire answers (User only)
 *     description: Users can view their own submitted questionnaire answers.
 *     tags: [Questionnaires]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Answers retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/QuestionnaireAnswer'
 *       400:
 *         description: Only patients can view their own answers
 *       401:
 *         description: Unauthorized
 */
router.get("/my-answers", authenticate, async (req, res, next) => {
  try {
    if (req.user.type !== USER_TYPES.USER) {
      throw new BadRequestError("Only patients can view their own questionnaire answers");
    }

    const answers = await prisma.questionnaireAnswer.findMany({
      where: { user_id: req.user.id },
      orderBy: { answered_at: "desc" },
    });

    // Get all question IDs and fetch their options
    const questionIds = [...new Set(answers.map(a => a.question_id))];

    const options = await prisma.questionOption.findMany({
      where: { question_id: { in: questionIds } },
    });

    // Build options map by question_id
    const optionsMap = {};
    options.forEach(o => {
      if (!optionsMap[o.question_id]) optionsMap[o.question_id] = [];
      optionsMap[o.question_id].push(o);
    });

    // Enrich answers with selected option details
    const enrichedAnswers = answers.map(answer => {
      const questionOptions = optionsMap[answer.question_id] || [];

      // Get selected option texts
      let selected_options = [];
      if (answer.selected_option_ids && Array.isArray(answer.selected_option_ids)) {
        selected_options = questionOptions.filter(o =>
          answer.selected_option_ids.includes(o.id)
        );
      }

      return {
        ...answer,
        selected_options,
      };
    });

    res.json(successResponse(enrichedAnswers));
  } catch (error) {
    next(error);
  }
});

/**
 * @swagger
 * /api/v1/questionnaires/categories:
 *   post:
 *     summary: Create questionnaire category (Admin only)
 *     description: Creates a new questionnaire category. Requires admin authentication with questionnaires:create permission.
 *     tags: [Questionnaires]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: object
 *                 description: Multilingual category name
 *                 example: {"en": "Anxiety Assessment", "ar": "تقييم القلق", "ku": "هەڵسەنگاندنی نیگەرانی"}
 *               description:
 *                 type: object
 *                 description: Multilingual category description
 *                 example: {"en": "Questions to assess anxiety levels", "ar": "أسئلة لتقييم مستويات القلق"}
 *               display_order:
 *                 type: integer
 *                 description: Order in which to display the category
 *                 example: 1
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/QuestionnaireCategory'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - questionnaires:create permission required
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
 *     summary: Create question (Admin only)
 *     description: Creates a new question with optional answer options. Requires admin authentication with questionnaires:create permission.
 *     tags: [Questionnaires]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question_text
 *               - question_type
 *             properties:
 *               category_id:
 *                 type: integer
 *                 description: Category ID this question belongs to
 *                 example: 1
 *               question_text:
 *                 type: object
 *                 description: Multilingual question text
 *                 example: {"en": "How often do you feel anxious?", "ar": "كم مرة تشعر بالقلق؟"}
 *               question_type:
 *                 type: string
 *                 enum: [single_choice, multiple_choice, scale, text]
 *                 description: Type of question
 *                 example: single_choice
 *               is_required:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *               display_order:
 *                 type: integer
 *                 example: 1
 *               scale_min:
 *                 type: integer
 *                 description: Minimum value (for scale type)
 *                 example: 1
 *               scale_max:
 *                 type: integer
 *                 description: Maximum value (for scale type)
 *                 example: 10
 *               scale_min_label:
 *                 type: object
 *                 description: Label for minimum value
 *                 example: {"en": "Never", "ar": "أبداً"}
 *               scale_max_label:
 *                 type: object
 *                 description: Label for maximum value
 *                 example: {"en": "Always", "ar": "دائماً"}
 *               options:
 *                 type: array
 *                 description: Answer options (for choice type questions)
 *                 items:
 *                   type: object
 *                   properties:
 *                     option_text:
 *                       type: object
 *                       example: {"en": "Never", "ar": "أبداً"}
 *           example:
 *             category_id: 1
 *             question_text: {"en": "How often do you feel anxious?", "ar": "كم مرة تشعر بالقلق؟"}
 *             question_type: single_choice
 *             is_required: true
 *             display_order: 1
 *             options:
 *               - option_text: {"en": "Never", "ar": "أبداً"}
 *               - option_text: {"en": "Rarely", "ar": "نادراً"}
 *               - option_text: {"en": "Sometimes", "ar": "أحياناً"}
 *               - option_text: {"en": "Often", "ar": "غالباً"}
 *               - option_text: {"en": "Always", "ar": "دائماً"}
 *     responses:
 *       201:
 *         description: Question created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Question'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - questionnaires:create permission required
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

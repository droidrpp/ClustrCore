// routes/chatbotRoutes.js
const express  = require('express');
const router   = express.Router();
const mongoose = require('mongoose');

/* ── SCHEMA ──────────────────────────────────────────────── */
const chatQuestionSchema = new mongoose.Schema({
  question:    { type: String, required: true },
  studentId:   { type: String, default: 'anonymous' }, // browser fingerprint / session
  studentName: { type: String, default: 'Student' },
  status:      { type: String, enum: ['pending','answered'], default: 'pending' },
  answer:      { type: String, default: null },
  answeredBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  answeredAt:  { type: Date, default: null },
}, { timestamps: true });

const ChatQuestion = mongoose.models.ChatQuestion ||
  mongoose.model('ChatQuestion', chatQuestionSchema);

/* ── MIDDLEWARE: any logged-in team lead can answer ───────── */
function requireTeamLead(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  req.userId = userId;
  next();
}

/* ══════════════════════════════════════════════════════════
   PUBLIC ROUTES (student / chatbot widget)
══════════════════════════════════════════════════════════ */

// POST /api/chatbot/question — student submits unanswered question
router.post('/question', async (req, res) => {
  try {
    const { question, studentId, studentName } = req.body;
    if (!question?.trim()) return res.status(400).json({ message: 'Question required' });

    const q = await ChatQuestion.create({
      question: question.trim(),
      studentId:   studentId   || 'anon_' + Date.now(),
      studentName: studentName || 'Student',
    });

    res.json({ success: true, questionId: q._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/chatbot/answer/:questionId — chatbot polls for answer
router.get('/answer/:questionId', async (req, res) => {
  try {
    const q = await ChatQuestion.findById(req.params.questionId)
      .populate('answeredBy', 'name team');
    if (!q) return res.status(404).json({ message: 'Not found' });

    res.json({
      status:     q.status,
      answer:     q.answer,
      answeredBy: q.answeredBy?.name || null,
      answeredAt: q.answeredAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/chatbot/answers/bulk — chatbot polls multiple questions at once
router.post('/answers/bulk', async (req, res) => {
  try {
    const { questionIds } = req.body; // array of ids
    if (!Array.isArray(questionIds) || !questionIds.length) return res.json([]);

    const questions = await ChatQuestion.find({
      _id: { $in: questionIds },
      status: 'answered',
    }).populate('answeredBy', 'name');

    res.json(questions.map(q => ({
      questionId: q._id,
      answer:     q.answer,
      answeredBy: q.answeredBy?.name || 'ClustrCore Team',
      answeredAt: q.answeredAt,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ══════════════════════════════════════════════════════════
   TEAM PORTAL ROUTES (requires login)
══════════════════════════════════════════════════════════ */

// GET /api/chatbot/questions — all pending + answered questions
router.get('/questions', requireTeamLead, async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 30 } = req.query;
    const filter = status === 'all' ? {} : { status };

    const [questions, total] = await Promise.all([
      ChatQuestion.find(filter)
        .populate('answeredBy', 'name team')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit)),
      ChatQuestion.countDocuments(filter),
    ]);

    res.json({ questions, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/chatbot/stats — counts for badge
router.get('/stats', requireTeamLead, async (req, res) => {
  try {
    const [pending, answered] = await Promise.all([
      ChatQuestion.countDocuments({ status: 'pending' }),
      ChatQuestion.countDocuments({ status: 'answered' }),
    ]);
    res.json({ pending, answered, total: pending + answered });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/chatbot/answer/:questionId — team lead answers
router.post('/answer/:questionId', requireTeamLead, async (req, res) => {
  try {
    const { answer } = req.body;
    if (!answer?.trim()) return res.status(400).json({ message: 'Answer required' });

    const q = await ChatQuestion.findByIdAndUpdate(
      req.params.questionId,
      {
        answer:     answer.trim(),
        status:     'answered',
        answeredBy: req.userId,
        answeredAt: new Date(),
      },
      { new: true }
    ).populate('answeredBy', 'name');

    if (!q) return res.status(404).json({ message: 'Question not found' });

    res.json({ success: true, question: q });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/chatbot/question/:id
router.delete('/question/:id', requireTeamLead, async (req, res) => {
  try {
    await ChatQuestion.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = { router, ChatQuestion };
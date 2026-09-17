const { User, Pathway, Lesson, UserLessonProgress } = require("../models");

class ControllerPathways {
  // GET /api/pathways
  static async read(req, res, next) {
    try {
      const pathways = await Pathway.findAll({
        attributes: ["id", "name", "level", "cefr_level"],
      });

      res.status(200).json(pathways);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/pathways/:id/lessons
  static async readStatus(req, res, next) {
    try {
      const pathwayId = req.params.id;

      const pathway = await Pathway.findByPk(pathwayId);
      if (!pathway) throw { name: "NotFound" };

      const lessons = await Lesson.findAll({
        where: { pathway_id: pathwayId },
        order: [["order", "ASC"]],
      });

      const userId = req.loginInfo.userId;
      const progresses = lessons.length
        ? await UserLessonProgress.findAll({
            where: { user_id: userId, lesson_id: lessons.map((l) => l.id) },
          })
        : [];

      const progressMap = {};
      progresses.forEach((progress) => {
        progressMap[progress.lesson_id] = progress;
      });

      let prevCompleted = true;
      const result = lessons.map((lesson) => {
        const progress = progressMap[lesson.id];
        let status;
        let score = null;

        if (progress && progress.status === "completed") {
          status = "completed";
          score = progress.score;
        } else if (progress && progress.status === "in_progress") {
          status = "unlocked";
        } else if (prevCompleted) {
          status = "unlocked";
        } else {
          status = "locked";
        }

        prevCompleted = !!(progress && progress.status === "completed");

        return {
          id: lesson.id,
          title: lesson.title,
          status,
          score,
        };
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  // GET /api/pathways/progress
  static async getProgress(req, res, next) {
    try {
      const userId = req.loginInfo.userId;

      const pathways = await Pathway.findAll({
        attributes: ["id"],
      });

      const pathwayIds = pathways.map((p) => p.id);

      const lessons = await Lesson.findAll({
        where: { pathway_id: pathwayIds },
      });

      const lessonIdsByPathway = {};
      lessons.forEach((lesson) => {
        if (!lessonIdsByPathway[lesson.pathway_id]) {
          lessonIdsByPathway[lesson.pathway_id] = [];
        }
        lessonIdsByPathway[lesson.pathway_id].push(lesson.id);
      });

      const progresses = await UserLessonProgress.findAll({
        where: { user_id: userId, lesson_id: lessons.map((l) => l.id) },
      });

      const progressMap = {};
      progresses.forEach((progress) => {
        progressMap[progress.lesson_id] = progress;
      });

      const result = pathways.map((pathway) => {
        const lessonIds = lessonIdsByPathway[pathway.id] || [];
        const totalLessons = lessonIds.length;

        let completedLessons = 0;
        let firstUnlockedLessonId = null;

        let prevCompleted = true;
        for (const lessonId of lessonIds) {
          const progress = progressMap[lessonId];
          let status;

          if (progress && progress.status === "completed") {
            status = "completed";
            completedLessons += 1;
          } else if (progress && progress.status === "in_progress") {
            status = "unlocked";
          } else if (prevCompleted) {
            status = "unlocked";
          } else {
            status = "locked";
          }

          prevCompleted = !!(progress && progress.status === "completed");

          if (status === "unlocked" && firstUnlockedLessonId === null) {
            firstUnlockedLessonId = lessonId;
          }
        }

        return {
          pathway_id: pathway.id,
          total_lessons: totalLessons,
          completed_lessons: completedLessons,
          unlocked_lesson_id: firstUnlockedLessonId,
        };
      });

      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ControllerPathways;

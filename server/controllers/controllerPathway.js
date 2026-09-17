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

  // GET /api/pathways/progress
  // Agregat progres user login per pathway. Dipakai kartu di halaman Pathways
  // supaya "x dari y lesson selesai", progress bar, dan label CTA
  // ("Mulai" / "Lanjutkan" / "Ulangi") dihitung dari data nyata — bukan dummy.
  // Semua pathway ikut dikembalikan walau user belum punya progres sama sekali,
  // supaya client tidak jatuh ke angka presentasi lokal.
  static async readProgress(req, res, next) {
    try {
      const userId = req.loginInfo.userId;

      const pathways = await Pathway.findAll({
        attributes: ["id", "name", "level", "cefr_level"],
        order: [
          ["level", "ASC"],
          ["id", "ASC"],
        ],
      });

      const lessons = await Lesson.findAll({
        attributes: ["id", "pathway_id", "order"],
        order: [
          ["pathway_id", "ASC"],
          ["order", "ASC"],
          ["id", "ASC"],
        ],
      });

      const progresses = await UserLessonProgress.findAll({
        where: { user_id: userId },
        attributes: ["lesson_id", "status", "completed_at", "updated_at"],
      });

      const progressByLesson = new Map();
      progresses.forEach((progress) => {
        progressByLesson.set(progress.lesson_id, progress);
      });

      const lessonsByPathway = new Map();
      lessons.forEach((lesson) => {
        const list = lessonsByPathway.get(lesson.pathway_id) ?? [];
        list.push(lesson);
        lessonsByPathway.set(lesson.pathway_id, list);
      });

      const result = pathways.map((pathway) => {
        const pathwayLessons = lessonsByPathway.get(pathway.id) ?? [];

        let completedLessons = 0;
        let unlockedLessonId = null;
        let lastAttempt = null;

        pathwayLessons.forEach((lesson) => {
          const progress = progressByLesson.get(lesson.id);
          const isCompleted = progress?.status === "completed";

          if (isCompleted) {
            completedLessons += 1;
          } else if (unlockedLessonId === null) {
            // Lesson pertama yang belum selesai = kandidat "lanjutkan di sini".
            unlockedLessonId = lesson.id;
          }

          const stamp = progress?.completed_at ?? progress?.updated_at;
          if (stamp && (!lastAttempt || new Date(stamp) > new Date(lastAttempt))) {
            lastAttempt = stamp;
          }
        });

        const totalLessons = pathwayLessons.length;

        return {
          pathway_id: pathway.id,
          name: pathway.name,
          level: pathway.level,
          cefr_level: pathway.cefr_level,
          total_lessons: totalLessons,
          completed_lessons: completedLessons,
          progress_rate:
            totalLessons > 0
              ? Math.round((completedLessons / totalLessons) * 100) / 100
              : 0,
          unlocked_lesson_id: unlockedLessonId,
          last_attempt: lastAttempt,
        };
      });

      res.status(200).json(result);
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
}

module.exports = ControllerPathways;

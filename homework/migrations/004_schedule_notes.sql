-- 材料备注独立于原始课表保存，同一学习工作台的登录账号共享。
CREATE TABLE IF NOT EXISTS schedule_notes (
    scope TEXT NOT NULL,
    lesson TEXT NOT NULL,
    day INTEGER NOT NULL CHECK(day BETWEEN 1 AND 5),
    subject TEXT NOT NULL,
    note TEXT NOT NULL CHECK(length(note) <= 1000),
    PRIMARY KEY (scope, lesson, day, subject)
);

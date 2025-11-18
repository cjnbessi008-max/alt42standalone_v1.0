"""Moodle database models (MySQL 5.7 compatible)"""
from sqlalchemy import Column, Integer, String, Text, BigInteger, Float, SmallInteger
from database import MoodleBase
from config import settings

prefix = settings.MOODLE_DB_PREFIX


class User(MoodleBase):
    """Moodle user table"""
    __tablename__ = f"{prefix}user"

    id = Column(BigInteger, primary_key=True)
    username = Column(String(100))
    firstname = Column(String(100))
    lastname = Column(String(100))
    email = Column(String(100))
    timecreated = Column(BigInteger)
    timemodified = Column(BigInteger)


class Course(MoodleBase):
    """Moodle course table"""
    __tablename__ = f"{prefix}course"

    id = Column(BigInteger, primary_key=True)
    category = Column(BigInteger)
    fullname = Column(String(254))
    shortname = Column(String(255))
    timecreated = Column(BigInteger)
    timemodified = Column(BigInteger)


class LogStandardLog(MoodleBase):
    """Moodle standard log table"""
    __tablename__ = f"{prefix}logstore_standard_log"

    id = Column(BigInteger, primary_key=True)
    eventname = Column(String(255))
    component = Column(String(100))
    action = Column(String(100))
    target = Column(String(100))
    objecttable = Column(String(50))
    objectid = Column(BigInteger)
    crud = Column(String(1))
    edulevel = Column(SmallInteger)
    contextid = Column(BigInteger)
    contextlevel = Column(BigInteger)
    contextinstanceid = Column(BigInteger)
    userid = Column(BigInteger)
    courseid = Column(BigInteger)
    relateduserid = Column(BigInteger)
    anonymous = Column(SmallInteger)
    timecreated = Column(BigInteger)


class Quiz(MoodleBase):
    """Moodle quiz table"""
    __tablename__ = f"{prefix}quiz"

    id = Column(BigInteger, primary_key=True)
    course = Column(BigInteger)
    name = Column(String(255))
    intro = Column(Text)
    timeopen = Column(BigInteger)
    timeclose = Column(BigInteger)
    timelimit = Column(BigInteger)
    grade = Column(Float)
    sumgrades = Column(Float)


class QuizAttempt(MoodleBase):
    """Moodle quiz attempts table"""
    __tablename__ = f"{prefix}quiz_attempts"

    id = Column(BigInteger, primary_key=True)
    quiz = Column(BigInteger)
    userid = Column(BigInteger)
    attempt = Column(Integer)
    uniqueid = Column(BigInteger)
    layout = Column(Text)
    currentpage = Column(BigInteger)
    preview = Column(SmallInteger)
    state = Column(String(16))
    timestart = Column(BigInteger)
    timefinish = Column(BigInteger)
    timemodified = Column(BigInteger)
    sumgrades = Column(Float)


class QuizGrade(MoodleBase):
    """Moodle quiz grades table"""
    __tablename__ = f"{prefix}quiz_grades"

    id = Column(BigInteger, primary_key=True)
    quiz = Column(BigInteger)
    userid = Column(BigInteger)
    grade = Column(Float)
    timemodified = Column(BigInteger)


class GradeGrade(MoodleBase):
    """Moodle grade_grades table"""
    __tablename__ = f"{prefix}grade_grades"

    id = Column(BigInteger, primary_key=True)
    itemid = Column(BigInteger)
    userid = Column(BigInteger)
    rawgrade = Column(Float)
    rawgrademax = Column(Float)
    rawgrademin = Column(Float)
    finalgrade = Column(Float)
    timecreated = Column(BigInteger)
    timemodified = Column(BigInteger)


class GradeItem(MoodleBase):
    """Moodle grade_items table"""
    __tablename__ = f"{prefix}grade_items"

    id = Column(BigInteger, primary_key=True)
    courseid = Column(BigInteger)
    categoryid = Column(BigInteger)
    itemname = Column(String(255))
    itemtype = Column(String(30))
    itemmodule = Column(String(30))
    iteminstance = Column(BigInteger)
    grademax = Column(Float)
    grademin = Column(Float)


class Forum(MoodleBase):
    """Moodle forum table"""
    __tablename__ = f"{prefix}forum"

    id = Column(BigInteger, primary_key=True)
    course = Column(BigInteger)
    type = Column(String(20))
    name = Column(String(255))
    intro = Column(Text)


class ForumDiscussion(MoodleBase):
    """Moodle forum discussions table"""
    __tablename__ = f"{prefix}forum_discussions"

    id = Column(BigInteger, primary_key=True)
    course = Column(BigInteger)
    forum = Column(BigInteger)
    name = Column(String(255))
    userid = Column(BigInteger)
    timemodified = Column(BigInteger)


class ForumPost(MoodleBase):
    """Moodle forum posts table"""
    __tablename__ = f"{prefix}forum_posts"

    id = Column(BigInteger, primary_key=True)
    discussion = Column(BigInteger)
    parent = Column(BigInteger)
    userid = Column(BigInteger)
    created = Column(BigInteger)
    modified = Column(BigInteger)
    subject = Column(String(255))
    message = Column(Text)


class CourseModule(MoodleBase):
    """Moodle course modules table"""
    __tablename__ = f"{prefix}course_modules"

    id = Column(BigInteger, primary_key=True)
    course = Column(BigInteger)
    module = Column(BigInteger)
    instance = Column(BigInteger)
    section = Column(BigInteger)
    visible = Column(SmallInteger)
    completion = Column(SmallInteger)
    completionexpected = Column(BigInteger)


class CourseModuleCompletion(MoodleBase):
    """Moodle course module completion table"""
    __tablename__ = f"{prefix}course_modules_completion"

    id = Column(BigInteger, primary_key=True)
    coursemoduleid = Column(BigInteger)
    userid = Column(BigInteger)
    completionstate = Column(SmallInteger)
    viewed = Column(SmallInteger)
    timemodified = Column(BigInteger)

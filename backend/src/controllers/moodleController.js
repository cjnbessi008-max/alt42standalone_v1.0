import { getMoodleConnector } from '../integrations/moodleConnector.js';
import { query } from '../config/database.js';

export const handleLTILaunch = async (req, res, next) => {
  try {
    const ltiParams = req.body;
    const instanceUrl = ltiParams.tool_consumer_instance_url || req.body.custom_moodle_url;

    if (!instanceUrl) {
      return res.status(400).json({ error: { message: 'Missing Moodle instance URL' } });
    }

    const connector = await getMoodleConnector(instanceUrl);

    // Verify LTI signature
    const isValid = connector.verifyLTISignature(ltiParams);

    if (!isValid) {
      return res.status(401).json({ error: { message: 'Invalid LTI signature' } });
    }

    // Extract user and context information
    const userInfo = {
      id: ltiParams.user_id,
      email: ltiParams.lis_person_contact_email_primary,
      name: ltiParams.lis_person_name_full,
      role: ltiParams.roles
    };

    const contextInfo = {
      courseId: ltiParams.context_id,
      courseTitle: ltiParams.context_title,
      resourceLinkId: ltiParams.resource_link_id
    };

    // Create session or redirect to appropriate module
    res.json({
      success: true,
      message: 'LTI launch successful',
      user: userInfo,
      context: contextInfo
    });
  } catch (error) {
    next(error);
  }
};

export const syncModuleWithMoodle = async (req, res, next) => {
  try {
    const { moduleId } = req.params;
    const { instanceUrl, courseId } = req.body;

    if (!instanceUrl || !courseId) {
      return res.status(400).json({
        error: { message: 'Missing instanceUrl or courseId' }
      });
    }

    const connector = await getMoodleConnector(instanceUrl);
    const result = await connector.syncModule(moduleId, courseId);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getSyncStatus = async (req, res, next) => {
  try {
    const { moduleId } = req.params;

    const result = await query(
      'SELECT * FROM moodle_integration WHERE module_id = $1',
      [moduleId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { message: 'Module not synced with Moodle' }
      });
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

export const sendGradeToMoodle = async (req, res, next) => {
  try {
    const { studentId, moduleId, score, instanceUrl } = req.body;

    if (!studentId || !moduleId || score === undefined || !instanceUrl) {
      return res.status(400).json({
        error: { message: 'Missing required fields' }
      });
    }

    const connector = await getMoodleConnector(instanceUrl);
    const result = await connector.sendGrade(studentId, moduleId, score);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getCourseInfo = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { instanceUrl } = req.query;

    if (!instanceUrl) {
      return res.status(400).json({
        error: { message: 'Missing instanceUrl parameter' }
      });
    }

    const connector = await getMoodleConnector(instanceUrl);
    const course = await connector.getCourse(parseInt(courseId));

    res.json(course);
  } catch (error) {
    next(error);
  }
};

export const getEnrolledStudents = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { instanceUrl } = req.query;

    if (!instanceUrl) {
      return res.status(400).json({
        error: { message: 'Missing instanceUrl parameter' }
      });
    }

    const connector = await getMoodleConnector(instanceUrl);
    const students = await connector.getEnrolledStudents(parseInt(courseId));

    res.json(students);
  } catch (error) {
    next(error);
  }
};

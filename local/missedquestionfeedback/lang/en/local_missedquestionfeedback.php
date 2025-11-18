<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * English language strings
 *
 * @package    local_missedquestionfeedback
 * @copyright  2025 Your Organization
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

// Plugin name
$string['pluginname'] = 'Missed Question Feedback';

// Capabilities
$string['missedquestionfeedback:view'] = 'View missed question feedback';
$string['missedquestionfeedback:manage'] = 'Manage concepts and misconceptions';
$string['missedquestionfeedback:viewreports'] = 'View analytics reports';

// Main feedback strings
$string['whatyoumissed'] = 'What did you miss in this question?';
$string['concepttested'] = 'Concept tested';
$string['yourmisconception'] = 'Your misconception';
$string['correctunderstanding'] = 'Correct understanding';
$string['remediationstrategy'] = 'How to improve';
$string['learnmore'] = 'Learn more';
$string['nofeedbackavailable'] = 'No additional feedback available for this question.';

// Concept management
$string['manageconcepts'] = 'Manage Concepts';
$string['addconcept'] = 'Add New Concept';
$string['editconcept'] = 'Edit Concept';
$string['deleteconcept'] = 'Delete Concept';
$string['conceptname'] = 'Concept Name';
$string['conceptdescription'] = 'Description';
$string['conceptcategory'] = 'Category';
$string['confirmdeleteconcepttitle'] = 'Delete Concept?';
$string['confirmdeleteconcept'] = 'Are you sure you want to delete the concept "{$a}"? This will also delete all associated misconceptions.';

// Misconception management
$string['managemisconceptions'] = 'Manage Misconceptions';
$string['addmisconception'] = 'Add New Misconception';
$string['editmisconception'] = 'Edit Misconception';
$string['deletemisconception'] = 'Delete Misconception';
$string['misconceptionname'] = 'Misconception Name';
$string['misconceptiondescription'] = 'What is the misconception?';
$string['explanation'] = 'Why is this wrong?';
$string['resourceurl'] = 'Resource URL';
$string['resourcetitle'] = 'Resource Title';
$string['severity'] = 'Severity';
$string['severityminor'] = 'Minor';
$string['severitymoderate'] = 'Moderate';
$string['severitycritical'] = 'Critical';
$string['confirmdeletemisconceptiontitle'] = 'Delete Misconception?';
$string['confirmdeletemisconception'] = 'Are you sure you want to delete the misconception "{$a}"?';

// Question mapping
$string['mapquestions'] = 'Map Questions to Misconceptions';
$string['selectquestion'] = 'Select Question';
$string['selectanswer'] = 'Select Answer (optional)';
$string['selectmisconception'] = 'Select Misconception';
$string['mappriority'] = 'Priority';
$string['addmapping'] = 'Add Mapping';
$string['anywronganswer'] = 'Any wrong answer';

// Analytics
$string['analytics'] = 'Misconception Analytics';
$string['viewreports'] = 'View Reports';
$string['mostcommonmisconceptions'] = 'Most Common Misconceptions';
$string['misconceptiontrends'] = 'Misconception Trends';
$string['studentengagement'] = 'Student Engagement';
$string['feedbackviewed'] = 'Feedback Viewed';
$string['resourcesclicked'] = 'Resources Clicked';
$string['averagetimespent'] = 'Average Time Spent';

// Errors
$string['error:conceptnotfound'] = 'Concept not found';
$string['error:misconceptionnotfound'] = 'Misconception not found';
$string['error:invaliddata'] = 'Invalid data provided';
$string['error:nopermission'] = 'You do not have permission to perform this action';

// Success messages
$string['success:conceptcreated'] = 'Concept created successfully';
$string['success:conceptupdated'] = 'Concept updated successfully';
$string['success:conceptdeleted'] = 'Concept deleted successfully';
$string['success:misconceptioncreated'] = 'Misconception created successfully';
$string['success:misconceptionupdated'] = 'Misconception updated successfully';
$string['success:misconceptiondeleted'] = 'Misconception deleted successfully';
$string['success:mappingcreated'] = 'Question mapping created successfully';

// Settings
$string['settings'] = 'Missed Question Feedback Settings';
$string['enableplugin'] = 'Enable plugin';
$string['enableplugin_desc'] = 'Enable or disable the missed question feedback feature globally';
$string['defaultseverity'] = 'Default severity';
$string['defaultseverity_desc'] = 'Default severity level for new misconceptions';

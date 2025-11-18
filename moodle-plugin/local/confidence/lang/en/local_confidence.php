<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

defined('MOODLE_INTERNAL') || die();

// Plugin info
$string['pluginname'] = 'Learning Confidence Scoring';
$string['confidence'] = 'Confidence';

// Capabilities
$string['confidence:submitconfidence'] = 'Submit confidence score';
$string['confidence:view'] = 'View confidence scores';
$string['confidence:viewreports'] = 'View confidence reports';
$string['confidence:manageconcepts'] = 'Manage concepts';
$string['confidence:managealerts'] = 'Manage alerts';

// Student view
$string['myconfidence'] = 'My Learning Confidence';
$string['conceptname'] = 'Concept';
$string['yourconfidence'] = 'Your Confidence';
$string['score'] = 'Score';
$string['comment'] = 'Comment';
$string['optional'] = 'Optional';
$string['saveconfidence'] = 'Save';
$string['confidencesaved'] = 'Your confidence score has been saved.';
$string['previousscore'] = 'Last Assessment';
$string['noscore'] = 'Not yet assessed';

// Score labels
$string['score_verylow'] = 'Very Low';
$string['score_low'] = 'Low';
$string['score_medium'] = 'Medium';
$string['score_high'] = 'High';
$string['score_veryhigh'] = 'Very High';

// Teacher dashboard
$string['dashboard'] = 'Dashboard';
$string['classdashboard'] = 'Class Confidence Monitoring';
$string['summary'] = 'Summary';
$string['avgconfidence'] = 'Average Confidence';
$string['totalstudents'] = 'Total Students';
$string['totalconcepts'] = 'Total Concepts';
$string['participationrate'] = 'Participation Rate';
$string['studentsatrisk'] = 'Students Needing Help';
$string['needsattention'] = 'Students Requiring Attention';
$string['conceptdistribution'] = 'Concept Score Distribution';
$string['scoredistribution'] = 'Score Distribution';
$string['studentname'] = 'Student Name';
$string['avgconfidencescore'] = 'Avg Confidence';
$string['lowconfidenceconcepts'] = 'Low Confidence Concepts';
$string['viewdetail'] = 'View Detail';

// Concept management
$string['manageconcepts'] = 'Manage Concepts';
$string['addconcept'] = 'Add New Concept';
$string['editconcept'] = 'Edit Concept';
$string['deleteconcept'] = 'Delete Concept';
$string['conceptadded'] = 'Concept has been added.';
$string['conceptupdated'] = 'Concept has been updated.';
$string['conceptdeleted'] = 'Concept has been deleted.';
$string['description'] = 'Description';
$string['category'] = 'Category';
$string['displayorder'] = 'Display Order';

// Reports
$string['reports'] = 'Reports';
$string['conceptreport'] = 'Concept Report';
$string['studentreport'] = 'Student Report';
$string['exportdata'] = 'Export Data';
$string['export_csv'] = 'Export to CSV';
$string['export_excel'] = 'Export to Excel';

// History
$string['history'] = 'History';
$string['scorehistory'] = 'Score Change History';
$string['nohistory'] = 'No history available.';
$string['timestamp'] = 'Time';
$string['previousvalue'] = 'Previous Value';
$string['newvalue'] = 'New Value';

// Alerts
$string['alerts'] = 'Alerts';
$string['alertsettings'] = 'Alert Settings';
$string['threshold'] = 'Threshold';
$string['alerttype'] = 'Alert Type';
$string['enabled'] = 'Enabled';
$string['disabled'] = 'Disabled';
$string['lowconfidencealert'] = 'Low Confidence Alert';
$string['alertthreshold'] = 'Alert Threshold (or below)';

// Errors
$string['error:invalidcourseid'] = 'Invalid course ID.';
$string['error:invalidconceptid'] = 'Invalid concept ID.';
$string['error:invalidscore'] = 'Score must be between 1 and 5.';
$string['error:nopermission'] = 'You do not have permission.';
$string['error:savefailed'] = 'Save failed.';
$string['error:conceptnotfound'] = 'Concept not found.';

// Validation
$string['commenttoolong'] = 'Comment is too long (max 500 characters).';
$string['pleaseselectscore'] = 'Please select a confidence score.';
$string['required'] = 'Required';

// Help
$string['help:confidence'] = 'Please rate your understanding and confidence for each learning concept.';
$string['help:score'] = 'You can choose from 1 (Very Low) to 5 (Very High).';
$string['help:comment'] = 'Feel free to describe what parts are difficult or easy for you.';

// Privacy
$string['privacy:metadata:local_confidence_scores'] = 'Student confidence score information';
$string['privacy:metadata:local_confidence_scores:userid'] = 'User ID';
$string['privacy:metadata:local_confidence_scores:score'] = 'Confidence score (1-5)';
$string['privacy:metadata:local_confidence_scores:comment'] = 'Student comment';
$string['privacy:metadata:local_confidence_scores:timecreated'] = 'Creation time';
$string['privacy:metadata:local_confidence_scores:timemodified'] = 'Modification time';

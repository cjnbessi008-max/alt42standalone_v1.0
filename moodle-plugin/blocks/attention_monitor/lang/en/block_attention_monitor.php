<?php
/**
 * English language strings for Attention Monitor block
 *
 * @package    block_attention_monitor
 * @copyright  2025 Your Name
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

$string['pluginname'] = 'Attention Monitor';
$string['attention_monitor'] = 'Attention Monitor';
$string['attention_monitor:addinstance'] = 'Add a new Attention Monitor block';
$string['attention_monitor:myaddinstance'] = 'Add a new Attention Monitor block to Dashboard';

// Consent
$string['notloggedin'] = 'You must be logged in to use the Attention Monitor.';
$string['consenttitle'] = 'Consent for Attention Monitoring';
$string['consentdesc'] = 'We would like to monitor your attention during learning activities using eye tracking technology. Please read the following:';
$string['consentpoint1'] = 'Your webcam will be used only for eye tracking (no video is recorded or stored)';
$string['consentpoint2'] = 'Only anonymized attention metrics will be stored';
$string['consentpoint3'] = 'You can revoke consent at any time';
$string['consentpoint4'] = 'This data will help improve your learning experience';
$string['giveconsent'] = 'I Consent';
$string['revokeconsent'] = 'Revoke Consent';

// Tracking interface
$string['status'] = 'Status';
$string['active'] = 'Active';
$string['inactive'] = 'Inactive';
$string['attentionscore'] = 'Attention Score';
$string['starttracking'] = 'Start Tracking';
$string['stoptracking'] = 'Stop Tracking';
$string['viewreport'] = 'View Report';

// Alerts
$string['alert_excessive_blinking'] = 'Excessive blinking detected - You may be tired or stressed';
$string['alert_insufficient_blinking'] = 'Insufficient blinking - Remember to blink to avoid dry eyes';
$string['alert_gaze_away'] = 'Your gaze is away from the screen';
$string['alert_face_away'] = 'You are not facing the screen';
$string['alert_no_face_detected'] = 'Face not detected - Are you still there?';
$string['alert_low_attention'] = 'Low attention detected - Take a break if needed';

// Settings
$string['api_endpoint'] = 'API Endpoint';
$string['api_endpoint_desc'] = 'URL for the eye tracking API backend';
$string['sampling_rate'] = 'Sampling Rate (ms)';
$string['sampling_rate_desc'] = 'How often to capture eye tracking data (in milliseconds)';
$string['window_size'] = 'Analysis Window Size (ms)';
$string['window_size_desc'] = 'Time window for attention analysis (in milliseconds)';
$string['show_video'] = 'Show Video Preview';
$string['show_video_desc'] = 'Show webcam video preview to users';
$string['show_prediction'] = 'Show Gaze Prediction';
$string['show_prediction_desc'] = 'Show gaze prediction dot on screen';

// Privacy
$string['privacy:metadata:eye_tracking_events'] = 'Eye tracking event data';
$string['privacy:metadata:eye_tracking_events:userid'] = 'User ID';
$string['privacy:metadata:eye_tracking_events:timestamp'] = 'Event timestamp';
$string['privacy:metadata:eye_tracking_events:gaze_data'] = 'Gaze position data (anonymized)';
$string['privacy:metadata:attention_metrics'] = 'Attention analysis metrics';
$string['privacy:metadata:attention_metrics:userid'] = 'User ID';
$string['privacy:metadata:attention_metrics:attention_score'] = 'Calculated attention score';

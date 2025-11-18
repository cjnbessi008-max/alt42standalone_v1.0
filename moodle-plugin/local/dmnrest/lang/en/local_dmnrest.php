<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

$string['pluginname'] = 'DMN Rest Routines';
$string['privacy:metadata'] = 'The DMN Rest Routines plugin does not store any personal data locally. It sends anonymized usage data to an external API for rest routine suggestions.';

// Settings
$string['setting_enabled'] = 'Enable DMN rest routines';
$string['setting_enabled_desc'] = 'Enable or disable automatic rest routine suggestions';

$string['setting_api_endpoint'] = 'API endpoint';
$string['setting_api_endpoint_desc'] = 'URL of the DMN Rest Routine API (e.g., http://localhost:3000/api/dmn)';

$string['setting_api_key'] = 'API key';
$string['setting_api_key_desc'] = 'API key for authentication with the DMN API';

$string['setting_trigger_strategy'] = 'Trigger strategy';
$string['setting_trigger_strategy_desc'] = 'When should rest routines be suggested?';

$string['setting_complexity_threshold'] = 'Complexity threshold';
$string['setting_complexity_threshold_desc'] = 'Minimum problem complexity (1-5) to trigger rest routines (for complex_only strategy)';

$string['setting_allow_skip'] = 'Allow students to skip';
$string['setting_allow_skip_desc'] = 'Allow students to skip rest routines';

$string['setting_min_rest_interval'] = 'Minimum rest interval (minutes)';
$string['setting_min_rest_interval_desc'] = 'Minimum time between rest routine suggestions';

$string['setting_problems_per_interval'] = 'Problems per interval';
$string['setting_problems_per_interval_desc'] = 'Number of problems between rest suggestions (for every_n_problems strategy)';

// Strategies
$string['strategy_every_problem'] = 'Before every problem';
$string['strategy_complex_only'] = 'Before complex problems only';
$string['strategy_every_n_problems'] = 'Every N problems';
$string['strategy_fatigue_based'] = 'Fatigue-based (recommended)';

// UI strings
$string['rest_routine_title'] = 'Time for a brain break!';
$string['rest_routine_subtitle'] = 'Let\'s take a moment to refresh your mind';
$string['button_start'] = 'Start rest routine';
$string['button_skip'] = 'Skip for now';
$string['button_complete'] = 'I\'m done!';
$string['timer_label'] = 'Estimated time:';
$string['feedback_prompt'] = 'How helpful was this rest routine?';
$string['feedback_submit'] = 'Submit feedback';

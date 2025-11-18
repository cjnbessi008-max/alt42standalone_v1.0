<?php
// This file is part of Moodle - http://moodle.org/

defined('MOODLE_INTERNAL') || die();

$capabilities = [
    'block/3dinsight:addinstance' => [
        'riskbitmask' => RISK_SPAM | RISK_XSS,
        'captype' => 'write',
        'contextlevel' => CONTEXT_BLOCK,
        'archetypes' => [
            'editingteacher' => CAP_ALLOW,
            'manager' => CAP_ALLOW
        ],
        'clonepermissionsfrom' => 'moodle/site:manageblocks'
    ],
    'block/3dinsight:myaddinstance' => [
        'captype' => 'write',
        'contextlevel' => CONTEXT_SYSTEM,
        'archetypes' => [
            'user' => CAP_ALLOW
        ],
        'clonepermissionsfrom' => 'moodle/my:manageblocks'
    ],
    'block/3dinsight:view' => [
        'captype' => 'read',
        'contextlevel' => CONTEXT_BLOCK,
        'archetypes' => [
            'student' => CAP_ALLOW,
            'teacher' => CAP_ALLOW,
            'editingteacher' => CAP_ALLOW,
            'manager' => CAP_ALLOW
        ]
    ],
    'block/3dinsight:managecontent' => [
        'riskbitmask' => RISK_SPAM,
        'captype' => 'write',
        'contextlevel' => CONTEXT_BLOCK,
        'archetypes' => [
            'editingteacher' => CAP_ALLOW,
            'manager' => CAP_ALLOW
        ]
    ]
];

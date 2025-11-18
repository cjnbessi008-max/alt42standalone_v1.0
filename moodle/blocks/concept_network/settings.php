<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

defined('MOODLE_INTERNAL') || die;

if ($ADMIN->fulltree) {

    // Settings heading
    $settings->add(new admin_setting_heading(
        'block_concept_network/settings_heading',
        get_string('settings_heading', 'block_concept_network'),
        ''
    ));

    // Co-occurrence weight
    $settings->add(new admin_setting_configtext(
        'block_concept_network/weight_cooccurrence',
        get_string('weight_cooccurrence', 'block_concept_network'),
        get_string('weight_cooccurrence_desc', 'block_concept_network'),
        0.4,
        PARAM_FLOAT
    ));

    // Temporal proximity weight
    $settings->add(new admin_setting_configtext(
        'block_concept_network/weight_temporal',
        get_string('weight_temporal', 'block_concept_network'),
        get_string('weight_temporal_desc', 'block_concept_network'),
        0.3,
        PARAM_FLOAT
    ));

    // Performance correlation weight
    $settings->add(new admin_setting_configtext(
        'block_concept_network/weight_performance',
        get_string('weight_performance', 'block_concept_network'),
        get_string('weight_performance_desc', 'block_concept_network'),
        0.3,
        PARAM_FLOAT
    ));

    // Minimum relationship strength
    $settings->add(new admin_setting_configtext(
        'block_concept_network/min_relationship_strength',
        get_string('min_relationship_strength', 'block_concept_network'),
        get_string('min_relationship_strength_desc', 'block_concept_network'),
        0.1,
        PARAM_FLOAT
    ));

    // Cache TTL
    $settings->add(new admin_setting_configtext(
        'block_concept_network/cache_ttl',
        get_string('cache_ttl', 'block_concept_network'),
        get_string('cache_ttl_desc', 'block_concept_network'),
        3600,
        PARAM_INT
    ));
}

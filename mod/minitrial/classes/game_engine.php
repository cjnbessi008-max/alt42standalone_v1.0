<?php
// This file is part of Moodle - http://moodle.org/
//
// Mini Trial Game - Game Engine
//
// @package    mod_minitrial
// @copyright  2025 KAIST Touch Math Academy
// @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later

namespace mod_minitrial;

defined('MOODLE_INTERNAL') || die();

/**
 * Game engine class for probability experiments
 */
class game_engine {

    /** @var string Game type */
    private $gametype;

    /**
     * Constructor
     *
     * @param string $gametype Type of game (dice, coin, card, spinner)
     */
    public function __construct($gametype) {
        $this->gametype = $gametype;
    }

    /**
     * Run a single trial
     *
     * @return string Result of the trial
     */
    public function run_trial() {
        switch ($this->gametype) {
            case 'dice':
                return $this->roll_dice();
            case 'coin':
                return $this->flip_coin();
            case 'card':
                return $this->draw_card();
            case 'spinner':
                return $this->spin_spinner();
            default:
                return null;
        }
    }

    /**
     * Roll a six-sided die
     *
     * @return int Number from 1 to 6
     */
    private function roll_dice() {
        return (string)mt_rand(1, 6);
    }

    /**
     * Flip a coin
     *
     * @return string 'heads' or 'tails'
     */
    private function flip_coin() {
        return mt_rand(0, 1) === 0 ? 'heads' : 'tails';
    }

    /**
     * Draw a card from a standard 52-card deck
     *
     * @return string Card name (e.g., 'ace_of_hearts', '2_of_spades')
     */
    private function draw_card() {
        $suits = array('hearts', 'diamonds', 'clubs', 'spades');
        $ranks = array('ace', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'jack', 'queen', 'king');

        $suit = $suits[mt_rand(0, 3)];
        $rank = $ranks[mt_rand(0, 12)];

        return $rank . '_of_' . $suit;
    }

    /**
     * Spin a spinner (8 sections by default)
     *
     * @return int Section number from 1 to 8
     */
    private function spin_spinner() {
        return (string)mt_rand(1, 8);
    }

    /**
     * Get theoretical probability for each outcome
     *
     * @return array Associative array of outcome => probability
     */
    public function get_theoretical_probabilities() {
        switch ($this->gametype) {
            case 'dice':
                return array(
                    '1' => 1/6,
                    '2' => 1/6,
                    '3' => 1/6,
                    '4' => 1/6,
                    '5' => 1/6,
                    '6' => 1/6
                );
            case 'coin':
                return array(
                    'heads' => 0.5,
                    'tails' => 0.5
                );
            case 'card':
                // Simplified - just suits
                return array(
                    'hearts' => 0.25,
                    'diamonds' => 0.25,
                    'clubs' => 0.25,
                    'spades' => 0.25
                );
            case 'spinner':
                return array(
                    '1' => 0.125,
                    '2' => 0.125,
                    '3' => 0.125,
                    '4' => 0.125,
                    '5' => 0.125,
                    '6' => 0.125,
                    '7' => 0.125,
                    '8' => 0.125
                );
            default:
                return array();
        }
    }

    /**
     * Calculate experimental probabilities from attempts
     *
     * @param array $attempts Array of attempt results
     * @return array Associative array of outcome => probability
     */
    public function calculate_experimental_probabilities($attempts) {
        if (empty($attempts)) {
            return array();
        }

        $total = count($attempts);
        $frequencies = array();

        // Count frequencies
        foreach ($attempts as $attempt) {
            $result = $attempt->result;

            // For cards, group by suit
            if ($this->gametype === 'card' && strpos($result, '_of_') !== false) {
                $parts = explode('_of_', $result);
                $result = $parts[1]; // Just the suit
            }

            if (!isset($frequencies[$result])) {
                $frequencies[$result] = 0;
            }
            $frequencies[$result]++;
        }

        // Convert to probabilities
        $probabilities = array();
        foreach ($frequencies as $outcome => $count) {
            $probabilities[$outcome] = $count / $total;
        }

        return $probabilities;
    }

    /**
     * Get all possible outcomes for the game type
     *
     * @return array Array of possible outcomes
     */
    public function get_possible_outcomes() {
        switch ($this->gametype) {
            case 'dice':
                return array('1', '2', '3', '4', '5', '6');
            case 'coin':
                return array('heads', 'tails');
            case 'card':
                return array('hearts', 'diamonds', 'clubs', 'spades');
            case 'spinner':
                return array('1', '2', '3', '4', '5', '6', '7', '8');
            default:
                return array();
        }
    }
}

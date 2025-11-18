"""
Loop Inefficiency Analyzer
"""
import re
from typing import List, Dict, Any
from dataclasses import dataclass
import logging

from app.services.php_parser import PHPParser, Loop
from app.models.inefficiency import InefficientType, Severity

logger = logging.getLogger(__name__)


@dataclass
class InefficientPattern:
    """Represents an inefficient pattern detected"""
    type: InefficientType
    severity: Severity
    line_number: int
    end_line_number: int
    message: str
    suggestion: str
    code_snippet: str
    estimated_complexity_before: str
    estimated_complexity_after: str
    context: Dict[str, Any]


class LoopAnalyzer:
    """Analyze loops for inefficiencies"""

    def __init__(self):
        self.parser = PHPParser()
        self.inefficiencies: List[InefficientPattern] = []

    def analyze(self, code: str) -> Dict[str, Any]:
        """
        Analyze code for loop inefficiencies

        Args:
            code: PHP source code

        Returns:
            Analysis results
        """
        self.inefficiencies = []

        # Parse code
        parse_result = self.parser.parse(code)
        loops = parse_result['loops']

        # Analyze each loop
        for loop in loops:
            self._analyze_loop(loop)

        # Calculate metrics
        total_loops = len(loops)
        inefficient_loops = len(set(ineff.line_number for ineff in self.inefficiencies))

        efficiency_score = 100.0
        if total_loops > 0:
            efficiency_score = max(0, 100 - (inefficient_loops / total_loops * 50))
            # Reduce score based on severity
            critical_count = sum(1 for i in self.inefficiencies if i.severity == Severity.CRITICAL)
            warning_count = sum(1 for i in self.inefficiencies if i.severity == Severity.WARNING)
            efficiency_score -= critical_count * 10
            efficiency_score -= warning_count * 5
            efficiency_score = max(0, efficiency_score)

        return {
            'total_loops': total_loops,
            'inefficient_loops': inefficient_loops,
            'efficiency_score': round(efficiency_score, 2),
            'inefficiencies': self.inefficiencies,
            'total_issues': len(self.inefficiencies),
            'critical_issues': sum(1 for i in self.inefficiencies if i.severity == Severity.CRITICAL),
            'warning_issues': sum(1 for i in self.inefficiencies if i.severity == Severity.WARNING),
            'info_issues': sum(1 for i in self.inefficiencies if i.severity == Severity.INFO),
        }

    def _analyze_loop(self, loop: Loop) -> None:
        """Analyze a single loop for inefficiencies"""
        loop_body = loop.code

        # Check for various inefficiency patterns
        self._check_loop_invariant(loop, loop_body)
        self._check_nested_loops(loop, loop_body)
        self._check_db_queries(loop, loop_body)
        self._check_redundant_function_calls(loop, loop_body)
        self._check_string_concatenation(loop, loop_body)
        self._check_array_operations(loop, loop_body)
        self._check_inefficient_search(loop, loop_body)

    def _check_loop_invariant(self, loop: Loop, loop_body: str) -> None:
        """Check for calculations that don't change in loop"""
        loop_var = self.parser.extract_loop_variable(loop)
        if not loop_var:
            return

        lines = loop_body.split('\n')

        # Find calculations inside loop
        for i, line in enumerate(lines[1:], start=loop.start_line + 1):  # Skip first line (loop declaration)
            # Look for calculations that don't involve loop variable
            if '=' in line and '$' in line:
                # Check if assignment doesn't use loop variable
                assignment_match = re.search(r'\$(\w+)\s*=\s*(.+);', line)
                if assignment_match:
                    var_name = assignment_match.group(1)
                    expression = assignment_match.group(2)

                    # Skip if it's the loop variable itself
                    if var_name == loop_var:
                        continue

                    # Check if expression uses loop variable
                    if f'${loop_var}' not in expression and f'${loop_var}' not in line:
                        # Check if it's a function call or calculation
                        if re.search(r'\w+\s*\(.*?\)', expression) or any(op in expression for op in ['+', '-', '*', '/', '%']):
                            self.inefficiencies.append(InefficientPattern(
                                type=InefficientType.LOOP_INVARIANT,
                                severity=Severity.WARNING,
                                line_number=i,
                                end_line_number=i,
                                message=f"Loop-invariant calculation: Variable '${var_name}' is calculated inside loop but doesn't depend on loop variable",
                                suggestion=f"Move the calculation of '${var_name}' outside the loop to avoid redundant computation",
                                code_snippet=line.strip(),
                                estimated_complexity_before="O(n) redundant calculations",
                                estimated_complexity_after="O(1) - single calculation",
                                context={'loop_variable': loop_var, 'invariant_variable': var_name}
                            ))

    def _check_nested_loops(self, loop: Loop, loop_body: str) -> None:
        """Check for deeply nested loops"""
        if loop.nesting_level >= 2:  # 3 or more levels (0-indexed)
            self.inefficiencies.append(InefficientPattern(
                type=InefficientType.NESTED_LOOP,
                severity=Severity.CRITICAL if loop.nesting_level >= 3 else Severity.WARNING,
                line_number=loop.start_line,
                end_line_number=loop.end_line,
                message=f"Deeply nested loop detected (nesting level: {loop.nesting_level + 1})",
                suggestion="Consider refactoring with better data structures (hash maps, sets) or breaking into separate functions",
                code_snippet=loop_body.split('\n')[0].strip(),
                estimated_complexity_before=f"O(n^{loop.nesting_level + 1})",
                estimated_complexity_after="O(n) or O(n log n) with optimization",
                context={'nesting_level': loop.nesting_level + 1}
            ))

    def _check_db_queries(self, loop: Loop, loop_body: str) -> None:
        """Check for database queries inside loops"""
        queries = self.parser.find_database_queries(loop_body)

        for query_type, line_num in queries:
            # Adjust line number relative to loop start
            actual_line = loop.start_line + line_num - 1

            self.inefficiencies.append(InefficientPattern(
                type=InefficientType.DB_QUERY_IN_LOOP,
                severity=Severity.CRITICAL,
                line_number=actual_line,
                end_line_number=actual_line,
                message="Database query inside loop (N+1 query problem)",
                suggestion="Use JOIN, WHERE IN clause, or fetch all data before the loop to reduce database round-trips",
                code_snippet=loop_body.split('\n')[line_num - 1].strip() if line_num <= len(loop_body.split('\n')) else "",
                estimated_complexity_before="O(n) database queries",
                estimated_complexity_after="O(1) database query",
                context={'query_type': query_type}
            ))

    def _check_redundant_function_calls(self, loop: Loop, loop_body: str) -> None:
        """Check for redundant function calls with same arguments"""
        function_calls = self.parser.find_function_calls(loop_body)
        call_counts: Dict[str, List[int]] = {}

        for func_name, line_num, args in function_calls:
            # Skip certain functions that are expected to be called multiple times
            skip_functions = ['echo', 'print', 'var_dump', 'isset', 'empty', 'count']
            if func_name.lower() in skip_functions:
                continue

            call_signature = f"{func_name}({args})"
            if call_signature not in call_counts:
                call_counts[call_signature] = []
            call_counts[call_signature].append(line_num)

        # Check for functions called multiple times with same arguments
        for call_sig, line_nums in call_counts.items():
            if len(line_nums) > 1:
                actual_line = loop.start_line + line_nums[0] - 1
                self.inefficiencies.append(InefficientPattern(
                    type=InefficientType.REDUNDANT_FUNCTION_CALL,
                    severity=Severity.WARNING,
                    line_number=actual_line,
                    end_line_number=actual_line,
                    message=f"Function called multiple times with same arguments: {call_sig}",
                    suggestion="Store the function result in a variable before the loop and reuse it",
                    code_snippet=call_sig,
                    estimated_complexity_before=f"O(n) function calls",
                    estimated_complexity_after="O(1) function call",
                    context={'function_call': call_sig, 'occurrences': len(line_nums)}
                ))

    def _check_string_concatenation(self, loop: Loop, loop_body: str) -> None:
        """Check for inefficient string concatenation in loops"""
        lines = loop_body.split('\n')

        for i, line in enumerate(lines, start=loop.start_line):
            # Check for string concatenation with .= or $str = $str .
            if re.search(r'\$\w+\s*\.=', line) or re.search(r'\$(\w+)\s*=\s*\$\1\s*\.', line):
                self.inefficiencies.append(InefficientPattern(
                    type=InefficientType.STRING_CONCAT_IN_LOOP,
                    severity=Severity.WARNING,
                    line_number=i,
                    end_line_number=i,
                    message="String concatenation inside loop can be inefficient",
                    suggestion="Use an array to collect strings and implode() after the loop, or use output buffering",
                    code_snippet=line.strip(),
                    estimated_complexity_before="O(n^2) due to string reallocation",
                    estimated_complexity_after="O(n) with array collection",
                    context={}
                ))

    def _check_array_operations(self, loop: Loop, loop_body: str) -> None:
        """Check for inefficient array operations"""
        operations = self.parser.find_array_operations(loop_body)

        for op_type, line_num in operations:
            actual_line = loop.start_line + line_num - 1

            if op_type == 'array_push':
                self.inefficiencies.append(InefficientPattern(
                    type=InefficientType.ARRAY_PUSH_IN_LOOP,
                    severity=Severity.INFO,
                    line_number=actual_line,
                    end_line_number=actual_line,
                    message="array_push() in loop - consider using [] operator",
                    suggestion="Use $array[] = $value instead of array_push($array, $value) for better performance",
                    code_snippet=loop_body.split('\n')[line_num - 1].strip() if line_num <= len(loop_body.split('\n')) else "",
                    estimated_complexity_before="O(n) with function call overhead",
                    estimated_complexity_after="O(n) with reduced overhead",
                    context={'operation': op_type}
                ))
            elif op_type == 'in_array':
                self.inefficiencies.append(InefficientPattern(
                    type=InefficientType.INEFFICIENT_SEARCH,
                    severity=Severity.WARNING,
                    line_number=actual_line,
                    end_line_number=actual_line,
                    message="in_array() in loop is inefficient for large arrays",
                    suggestion="Convert array to associative array (hash map) and use isset() or array_key_exists() for O(1) lookup",
                    code_snippet=loop_body.split('\n')[line_num - 1].strip() if line_num <= len(loop_body.split('\n')) else "",
                    estimated_complexity_before="O(n*m) where m is array size",
                    estimated_complexity_after="O(n) with hash map",
                    context={'operation': op_type}
                ))

    def _check_inefficient_search(self, loop: Loop, loop_body: str) -> None:
        """Check for inefficient linear search patterns"""
        loop_var = self.parser.extract_loop_variable(loop)
        if not loop_var:
            return

        # Check for nested loop doing linear search
        if loop.nesting_level > 0:
            # This is already covered by nested loop check
            pass

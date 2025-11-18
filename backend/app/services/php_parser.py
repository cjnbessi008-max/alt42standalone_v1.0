"""
PHP Code Parser and Analyzer
"""
import re
from typing import List, Dict, Any, Tuple, Optional
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class Loop:
    """Represents a loop in code"""
    type: str  # for, foreach, while, do-while
    start_line: int
    end_line: int
    nesting_level: int
    code: str
    parent_loop: Optional['Loop'] = None


@dataclass
class CodeBlock:
    """Represents a code block"""
    content: str
    start_line: int
    end_line: int


class PHPParser:
    """Parse and analyze PHP code"""

    def __init__(self):
        self.loops: List[Loop] = []
        self.code_lines: List[str] = []

    def parse(self, code: str) -> Dict[str, Any]:
        """
        Parse PHP code and extract structure

        Args:
            code: PHP source code

        Returns:
            Dictionary containing parsed information
        """
        self.code_lines = code.split('\n')
        self.loops = []

        # Remove comments
        code_no_comments = self._remove_comments(code)

        # Find all loops
        self._find_loops(code_no_comments)

        return {
            'loops': self.loops,
            'total_lines': len(self.code_lines),
            'code_no_comments': code_no_comments
        }

    def _remove_comments(self, code: str) -> str:
        """Remove PHP comments from code"""
        # Remove single-line comments
        code = re.sub(r'//.*?$', '', code, flags=re.MULTILINE)
        # Remove multi-line comments
        code = re.sub(r'/\*.*?\*/', '', code, flags=re.DOTALL)
        return code

    def _find_loops(self, code: str) -> None:
        """Find all loops in code"""
        lines = code.split('\n')
        loop_stack: List[Dict[str, Any]] = []

        for line_num, line in enumerate(lines, start=1):
            line_stripped = line.strip()

            # Detect loop start
            for_match = re.match(r'\s*for\s*\(', line_stripped)
            foreach_match = re.match(r'\s*foreach\s*\(', line_stripped)
            while_match = re.match(r'\s*while\s*\(', line_stripped)
            do_match = re.match(r'\s*do\s*\{', line_stripped)

            if for_match or foreach_match or while_match or do_match:
                loop_type = 'for' if for_match else 'foreach' if foreach_match else 'while' if while_match else 'do-while'
                loop_stack.append({
                    'type': loop_type,
                    'start_line': line_num,
                    'nesting_level': len(loop_stack),
                    'brace_count': 0,
                    'code_lines': [line]
                })

            # Count braces for loop tracking
            if loop_stack:
                current_loop = loop_stack[-1]
                current_loop['code_lines'].append(line)
                current_loop['brace_count'] += line.count('{') - line.count('}')

                # Loop ended
                if current_loop['brace_count'] == 0 and '{' in ''.join(current_loop['code_lines']):
                    loop_info = loop_stack.pop()
                    parent_loop = loop_stack[-1] if loop_stack else None

                    loop = Loop(
                        type=loop_info['type'],
                        start_line=loop_info['start_line'],
                        end_line=line_num,
                        nesting_level=loop_info['nesting_level'],
                        code='\n'.join(loop_info['code_lines']),
                        parent_loop=parent_loop
                    )
                    self.loops.append(loop)

    def get_loop_body(self, loop: Loop) -> str:
        """Extract loop body code"""
        if loop.start_line > 0 and loop.end_line <= len(self.code_lines):
            return '\n'.join(self.code_lines[loop.start_line - 1:loop.end_line])
        return loop.code

    def find_variable_assignments(self, code: str) -> List[Tuple[str, int]]:
        """
        Find variable assignments in code

        Returns:
            List of (variable_name, line_number) tuples
        """
        assignments = []
        lines = code.split('\n')

        for line_num, line in enumerate(lines, start=1):
            # Match variable assignments: $var = ...
            matches = re.finditer(r'\$(\w+)\s*=(?!=)', line)
            for match in matches:
                var_name = match.group(1)
                assignments.append((var_name, line_num))

        return assignments

    def find_function_calls(self, code: str) -> List[Tuple[str, int, str]]:
        """
        Find function calls in code

        Returns:
            List of (function_name, line_number, arguments) tuples
        """
        calls = []
        lines = code.split('\n')

        for line_num, line in enumerate(lines, start=1):
            # Match function calls
            matches = re.finditer(r'(\w+)\s*\((.*?)\)', line)
            for match in matches:
                func_name = match.group(1)
                args = match.group(2)
                calls.append((func_name, line_num, args))

        return calls

    def find_database_queries(self, code: str) -> List[Tuple[str, int]]:
        """
        Find database query patterns in code

        Returns:
            List of (query_type, line_number) tuples
        """
        queries = []
        lines = code.split('\n')

        db_patterns = [
            r'mysql_query\s*\(',
            r'mysqli_query\s*\(',
            r'->query\s*\(',
            r'DB::',
            r'->select\s*\(',
            r'->insert\s*\(',
            r'->update\s*\(',
            r'->delete\s*\(',
        ]

        for line_num, line in enumerate(lines, start=1):
            for pattern in db_patterns:
                if re.search(pattern, line, re.IGNORECASE):
                    queries.append(('database_query', line_num))
                    break

        return queries

    def find_array_operations(self, code: str) -> List[Tuple[str, int]]:
        """
        Find array operations in code

        Returns:
            List of (operation_type, line_number) tuples
        """
        operations = []
        lines = code.split('\n')

        for line_num, line in enumerate(lines, start=1):
            # array_push
            if re.search(r'array_push\s*\(', line):
                operations.append(('array_push', line_num))
            # $array[] =
            elif re.search(r'\$\w+\[\]\s*=', line):
                operations.append(('array_append', line_num))
            # in_array
            elif re.search(r'in_array\s*\(', line):
                operations.append(('in_array', line_num))

        return operations

    def extract_loop_variable(self, loop: Loop) -> Optional[str]:
        """Extract the loop counter/iterator variable"""
        first_line = loop.code.split('\n')[0]

        # for loop: for ($i = 0; ...)
        for_match = re.search(r'for\s*\(\s*\$(\w+)', first_line)
        if for_match:
            return for_match.group(1)

        # foreach loop: foreach ($array as $item)
        foreach_match = re.search(r'foreach\s*\(.*?\s+as\s+\$(\w+)', first_line)
        if foreach_match:
            return foreach_match.group(1)

        return None

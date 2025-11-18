"""
Database Initialization Script
Populate database with core derivative rules
"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.database import async_session_maker
from app.db.models import DerivativeRule, RuleType


async def init_core_rules():
    """Initialize the 3 core derivative rules"""

    core_rules = [
        {
            "rule_name": "Power Rule",
            "rule_type": RuleType.POWER_RULE,
            "rule_formula": "d/dx[x^n] = n·x^(n-1)",
            "pattern_regex": r"x\s*\^|x\^\{|\^[\d\-]",
            "description": "The power rule: derivative of x to the power n is n times x to the power (n-1)",
            "display_order": 1,
            "is_core_rule": True
        },
        {
            "rule_name": "Chain Rule",
            "rule_type": RuleType.CHAIN_RULE,
            "rule_formula": "d/dx[f(g(x))] = f'(g(x))·g'(x)",
            "pattern_regex": r"\([^\)]+\)\s*\^|sin\(|cos\(|tan\(|ln\(|log\(|e\^|sqrt\(",
            "description": "The chain rule: derivative of composite function f(g(x)) is f'(g(x)) times g'(x)",
            "display_order": 2,
            "is_core_rule": True
        },
        {
            "rule_name": "Product Rule",
            "rule_type": RuleType.PRODUCT_RULE,
            "rule_formula": "d/dx[f·g] = f'·g + f·g'",
            "pattern_regex": r"\([^\)]+\)\s*\*\s*\([^\)]+\)|[a-z]\s*\*\s*[a-z]",
            "description": "The product rule: derivative of f times g is f' times g plus f times g'",
            "display_order": 3,
            "is_core_rule": True
        }
    ]

    additional_rules = [
        {
            "rule_name": "Quotient Rule",
            "rule_type": RuleType.QUOTIENT_RULE,
            "rule_formula": "d/dx[f/g] = (f'·g - f·g')/g²",
            "pattern_regex": r"\([^\)]+\)\s*\/\s*\([^\)]+\)",
            "description": "The quotient rule: derivative of f divided by g",
            "display_order": 4,
            "is_core_rule": False
        },
        {
            "rule_name": "Constant Rule",
            "rule_type": RuleType.CONSTANT_RULE,
            "rule_formula": "d/dx[c] = 0",
            "pattern_regex": r"^[0-9]+$",
            "description": "The derivative of a constant is zero",
            "display_order": 5,
            "is_core_rule": False
        },
        {
            "rule_name": "Sum Rule",
            "rule_type": RuleType.SUM_RULE,
            "rule_formula": "d/dx[f + g] = f' + g'",
            "pattern_regex": r"\+|\-",
            "description": "The derivative of a sum is the sum of derivatives",
            "display_order": 6,
            "is_core_rule": False
        }
    ]

    async with async_session_maker() as session:
        # Check if rules already exist
        result = await session.execute(select(DerivativeRule))
        existing_rules = result.scalars().all()

        if existing_rules:
            print("Rules already initialized. Skipping...")
            return

        # Insert core rules
        for rule_data in core_rules + additional_rules:
            rule = DerivativeRule(**rule_data)
            session.add(rule)

        await session.commit()
        print(f"Successfully initialized {len(core_rules)} core rules and {len(additional_rules)} additional rules")


if __name__ == "__main__":
    print("Initializing derivative rules...")
    asyncio.run(init_core_rules())
    print("Done!")

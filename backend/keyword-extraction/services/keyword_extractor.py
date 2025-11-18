import re
import uuid
from typing import List, Tuple, Dict, Set
from collections import Counter
import logging

# NLP libraries
try:
    from konlpy.tag import Okt
    KONLPY_AVAILABLE = True
except ImportError:
    KONLPY_AVAILABLE = False
    logging.warning("KoNLPy not available. Korean NLP will be limited.")

import nltk
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer

logger = logging.getLogger(__name__)


class KeywordExtractor:
    """
    Extract keywords from LMS content using NLP techniques
    """

    def __init__(self):
        # Download NLTK data if needed
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt', quiet=True)

        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('stopwords', quiet=True)

        # Initialize Korean analyzer if available
        self.okt = Okt() if KONLPY_AVAILABLE else None

        # English stopwords
        self.en_stopwords = set(stopwords.words('english'))

        # Korean stopwords (common particles and conjunctions)
        self.ko_stopwords = {
            '이', '그', '저', '것', '수', '등', '들', '및', '한', '하',
            '있', '없', '되', '도', '를', '을', '가', '이', '에', '의',
            '와', '과', '로', '으로', '에서', '부터', '까지', '에게',
        }

        # Educational keyword types
        self.keyword_types = {
            'concept': ['개념', '원리', '이론', '법칙', '정의', 'concept', 'theory', 'principle'],
            'operation': ['계산', '연산', '풀이', '방법', 'operation', 'calculation', 'method'],
            'entity': ['숫자', '도형', '그래프', '수식', 'number', 'figure', 'graph', 'equation'],
            'attribute': ['성질', '특성', '속성', 'property', 'attribute', 'characteristic'],
        }

    def extract(
        self,
        content: str,
        language: str = "ko",
        min_importance: float = 0.3,
        max_keywords: int = 20,
        include_relationships: bool = True,
    ) -> Tuple[List[Dict], List[Dict]]:
        """
        Extract keywords from content

        Args:
            content: Text content to analyze
            language: Language code ('ko' or 'en')
            min_importance: Minimum importance score (0-1)
            max_keywords: Maximum number of keywords to extract
            include_relationships: Whether to extract relationships

        Returns:
            Tuple of (keywords, relationships)
        """
        # Tokenize and extract terms
        if language == "ko":
            tokens = self._tokenize_korean(content)
        else:
            tokens = self._tokenize_english(content)

        # Calculate TF-IDF scores
        importance_scores = self._calculate_importance(content, tokens, language)

        # Extract keywords with metadata
        keywords = self._build_keywords(
            tokens=tokens,
            importance_scores=importance_scores,
            content=content,
            language=language,
            min_importance=min_importance,
            max_keywords=max_keywords,
        )

        # Extract relationships if requested
        relationships = []
        if include_relationships and keywords:
            relationships = self._extract_relationships(keywords, content)

        return keywords, relationships

    def _tokenize_korean(self, text: str) -> List[str]:
        """Tokenize Korean text"""
        if not self.okt:
            # Fallback: simple whitespace tokenization
            tokens = text.split()
            return [t for t in tokens if len(t) > 1 and t not in self.ko_stopwords]

        # Use KoNLPy for proper Korean tokenization
        # Extract nouns and verbs
        nouns = self.okt.nouns(text)
        pos_tags = self.okt.pos(text)
        verbs = [word for word, pos in pos_tags if pos.startswith('V')]

        # Combine and filter
        tokens = list(set(nouns + verbs))
        tokens = [t for t in tokens if len(t) > 1 and t not in self.ko_stopwords]

        return tokens

    def _tokenize_english(self, text: str) -> List[str]:
        """Tokenize English text"""
        # Convert to lowercase and tokenize
        tokens = word_tokenize(text.lower())

        # Filter: keep only alphabetic tokens, remove stopwords
        tokens = [
            t for t in tokens
            if t.isalpha() and len(t) > 2 and t not in self.en_stopwords
        ]

        return tokens

    def _calculate_importance(
        self,
        content: str,
        tokens: List[str],
        language: str,
    ) -> Dict[str, float]:
        """Calculate importance scores using TF-IDF"""
        if not tokens:
            return {}

        # Count term frequencies
        term_freq = Counter(tokens)

        # Simple importance based on frequency (normalized)
        max_freq = max(term_freq.values()) if term_freq else 1
        importance = {
            term: freq / max_freq
            for term, freq in term_freq.items()
        }

        return importance

    def _classify_keyword_type(self, keyword: str) -> str:
        """Classify keyword into educational types"""
        keyword_lower = keyword.lower()

        for ktype, indicators in self.keyword_types.items():
            for indicator in indicators:
                if indicator in keyword_lower:
                    return ktype

        # Default classification based on characteristics
        if any(char.isdigit() for char in keyword):
            return 'entity'
        elif len(keyword) > 5:
            return 'concept'
        else:
            return 'attribute'

    def _build_keywords(
        self,
        tokens: List[str],
        importance_scores: Dict[str, float],
        content: str,
        language: str,
        min_importance: float,
        max_keywords: int,
    ) -> List[Dict]:
        """Build keyword objects with metadata"""
        keywords = []
        term_freq = Counter(tokens)

        # Sort by importance
        sorted_terms = sorted(
            importance_scores.items(),
            key=lambda x: x[1],
            reverse=True,
        )

        for term, score in sorted_terms[:max_keywords]:
            if score < min_importance:
                continue

            keyword_id = str(uuid.uuid4())
            keyword_type = self._classify_keyword_type(term)

            # Determine category based on content context
            category = self._determine_category(term, content)

            keywords.append({
                'id': keyword_id,
                'keyword': term,
                'normalized_keyword': term.lower(),
                'keyword_type': keyword_type,
                'importance_score': round(score, 3),
                'frequency': term_freq[term],
                'category': category,
                'source_content': content[:100] + '...' if len(content) > 100 else content,
            })

        return keywords

    def _determine_category(self, term: str, content: str) -> str:
        """Determine educational category"""
        categories = {
            '수학': ['수', '식', '계산', '도형', '분수', 'math', 'equation', 'number'],
            '과학': ['실험', '관찰', '과학', 'science', 'experiment'],
            '언어': ['문장', '단어', '문법', 'language', 'grammar', 'word'],
            '논리': ['논리', '추론', '증명', 'logic', 'proof', 'reasoning'],
        }

        term_lower = term.lower()
        for category, keywords in categories.items():
            if any(kw in term_lower for kw in keywords):
                return category

        return '기타'

    def _extract_relationships(
        self,
        keywords: List[Dict],
        content: str,
    ) -> List[Dict]:
        """Extract relationships between keywords"""
        relationships = []

        # Simple co-occurrence based relationships
        for i, kw1 in enumerate(keywords):
            for kw2 in keywords[i + 1:]:
                # Check if keywords appear close to each other in content
                content_lower = content.lower()
                kw1_pos = content_lower.find(kw1['normalized_keyword'])
                kw2_pos = content_lower.find(kw2['normalized_keyword'])

                if kw1_pos != -1 and kw2_pos != -1:
                    distance = abs(kw1_pos - kw2_pos)

                    # If within 50 characters, consider related
                    if distance < 50:
                        strength = 1.0 - (distance / 50.0)

                        # Determine relationship type
                        rel_type = self._determine_relationship_type(kw1, kw2)

                        relationships.append({
                            'id': str(uuid.uuid4()),
                            'source_keyword_id': kw1['id'],
                            'target_keyword_id': kw2['id'],
                            'relationship_type': rel_type,
                            'strength': round(strength, 3),
                        })

        return relationships

    def _determine_relationship_type(self, kw1: Dict, kw2: Dict) -> str:
        """Determine the type of relationship between keywords"""
        # If one is a concept and the other is an attribute
        if {kw1['keyword_type'], kw2['keyword_type']} == {'concept', 'attribute'}:
            return 'has_part'

        # If both are concepts
        if kw1['keyword_type'] == 'concept' and kw2['keyword_type'] == 'concept':
            # Check importance to determine prerequisite
            if kw1['importance_score'] > kw2['importance_score'] * 1.5:
                return 'prerequisite'
            return 'related_to'

        # Default
        return 'related_to'

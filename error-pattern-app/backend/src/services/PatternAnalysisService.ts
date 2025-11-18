import { AppDataSource } from '../config/database';
import { ErrorReason, QuestionError, User, ErrorCategory } from '../models';
import Anthropic from '@anthropic-ai/sdk';
import logger from '../config/logger';

interface PatternAnalysisResult {
  userId: number;
  period: { start: Date; end: Date };
  totalErrors: number;
  categoryDistribution: CategoryDistribution[];
  trends: ErrorTrend[];
  insights: string;
  recommendations: string[];
}

interface CategoryDistribution {
  category: string;
  categoryEn: string;
  count: number;
  percentage: number;
  avgConfidence: number;
}

interface ErrorTrend {
  date: string;
  count: number;
  categories: { [key: string]: number };
}

export class PatternAnalysisService {
  private errorReasonRepo = AppDataSource.getRepository(ErrorReason);
  private questionErrorRepo = AppDataSource.getRepository(QuestionError);
  private userRepo = AppDataSource.getRepository(User);
  private categoryRepo = AppDataSource.getRepository(ErrorCategory);
  private anthropic: Anthropic;

  constructor() {
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  async analyzeStudentPattern(
    userId: number,
    daysBack: number = 30
  ): Promise<PatternAnalysisResult> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    // Get category distribution
    const categoryDist = await this.getCategoryDistribution(
      userId,
      startDate,
      endDate
    );

    // Get error trends over time
    const trends = await this.getErrorTrends(userId, startDate, endDate);

    // Get total error count
    const totalErrors = await this.questionErrorRepo.count({
      where: {
        userId,
        isCorrect: false,
      },
    });

    // Generate AI insights
    const { insights, recommendations } = await this.generateAIInsights(
      userId,
      categoryDist,
      trends
    );

    return {
      userId,
      period: { start: startDate, end: endDate },
      totalErrors,
      categoryDistribution: categoryDist,
      trends,
      insights,
      recommendations,
    };
  }

  private async getCategoryDistribution(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<CategoryDistribution[]> {
    const query = this.errorReasonRepo
      .createQueryBuilder('er')
      .select('ec.nameKo', 'category')
      .addSelect('ec.nameEn', 'categoryEn')
      .addSelect('ec.color', 'color')
      .addSelect('COUNT(er.id)', 'count')
      .addSelect(
        `AVG(CASE
          WHEN er.confidenceLevel = '확실함' THEN 3
          WHEN er.confidenceLevel = '아마도' THEN 2
          ELSE 1
        END)`,
        'avgConfidence'
      )
      .innerJoin('er.category', 'ec')
      .where('er.userId = :userId', { userId })
      .andWhere('er.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('ec.id')
      .addGroupBy('ec.nameKo')
      .addGroupBy('ec.nameEn')
      .addGroupBy('ec.color')
      .orderBy('count', 'DESC');

    const results = await query.getRawMany();

    const total = results.reduce((sum, r) => sum + parseInt(r.count), 0);

    return results.map((r) => ({
      category: r.category,
      categoryEn: r.categoryEn,
      count: parseInt(r.count),
      percentage: total > 0 ? (parseInt(r.count) / total) * 100 : 0,
      avgConfidence: parseFloat(r.avgConfidence || '0'),
    }));
  }

  private async getErrorTrends(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<ErrorTrend[]> {
    const query = this.errorReasonRepo
      .createQueryBuilder('er')
      .select('DATE(er.createdAt)', 'date')
      .addSelect('ec.nameKo', 'category')
      .addSelect('COUNT(er.id)', 'count')
      .innerJoin('er.category', 'ec')
      .where('er.userId = :userId', { userId })
      .andWhere('er.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      })
      .groupBy('DATE(er.createdAt)')
      .addGroupBy('ec.nameKo')
      .orderBy('date', 'ASC');

    const results = await query.getRawMany();

    // Group by date
    const trendMap = new Map<string, ErrorTrend>();

    results.forEach((r) => {
      const date = r.date;
      if (!trendMap.has(date)) {
        trendMap.set(date, {
          date,
          count: 0,
          categories: {},
        });
      }

      const trend = trendMap.get(date)!;
      trend.count += parseInt(r.count);
      trend.categories[r.category] = parseInt(r.count);
    });

    return Array.from(trendMap.values());
  }

  private async generateAIInsights(
    userId: number,
    categoryDist: CategoryDistribution[],
    trends: ErrorTrend[]
  ): Promise<{ insights: string; recommendations: string[] }> {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });

      const prompt = `당신은 교육 전문가입니다. 다음 학생의 오답 패턴 데이터를 분석하여 인사이트와 개선 방안을 제시해주세요.

학생 정보:
- 이름: ${user?.fullName || '학생'}
- 총 오답 수: ${categoryDist.reduce((sum, c) => sum + c.count, 0)}

실수 유형별 분포:
${categoryDist
  .map((c) => `- ${c.category}: ${c.count}회 (${c.percentage.toFixed(1)}%)`)
  .join('\n')}

시간별 추이:
최근 ${trends.length}일 동안의 오답 기록

분석 요청사항:
1. 주요 문제점 파악
2. 학습 패턴 분석
3. 구체적인 개선 방안 3-5가지 제시

응답 형식:
[인사이트]
...

[개선 방안]
1. ...
2. ...
3. ...`;

      const message = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const content =
        message.content[0].type === 'text' ? message.content[0].text : '';

      // Parse response
      const insightsMatch = content.match(/\[인사이트\]([\s\S]*?)\[개선 방안\]/);
      const recommendationsMatch = content.match(/\[개선 방안\]([\s\S]*)/);

      const insights = insightsMatch ? insightsMatch[1].trim() : content;
      const recommendations = recommendationsMatch
        ? recommendationsMatch[1]
            .trim()
            .split('\n')
            .filter((line) => line.match(/^\d+\./))
            .map((line) => line.replace(/^\d+\.\s*/, ''))
        : [];

      logger.info(`AI insights generated for user ${userId}`);

      return { insights, recommendations };
    } catch (error) {
      logger.error('Error generating AI insights:', error);
      return {
        insights: '패턴 분석 중 오류가 발생했습니다.',
        recommendations: [
          '꾸준한 복습을 권장합니다.',
          '오답 노트를 작성해보세요.',
        ],
      };
    }
  }

  async compareStudents(userIds: number[]): Promise<any> {
    const comparisons = await Promise.all(
      userIds.map((id) => this.analyzeStudentPattern(id, 30))
    );

    return {
      students: comparisons,
      commonPatterns: this.findCommonPatterns(comparisons),
    };
  }

  private findCommonPatterns(analyses: PatternAnalysisResult[]): string[] {
    // Find categories that appear frequently across students
    const categoryCount = new Map<string, number>();

    analyses.forEach((analysis) => {
      analysis.categoryDistribution.forEach((cat) => {
        if (cat.percentage > 20) {
          // 20% threshold
          categoryCount.set(cat.category, (categoryCount.get(cat.category) || 0) + 1);
        }
      });
    });

    const common: string[] = [];
    categoryCount.forEach((count, category) => {
      if (count >= analyses.length * 0.5) {
        // 50% of students
        common.push(category);
      }
    });

    return common;
  }
}

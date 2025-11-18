import { Request, Response, NextFunction } from 'express';
import lti from 'ims-lti';
import dotenv from 'dotenv';

dotenv.config();

const LTI_KEY = process.env.LTI_KEY || 'composition_puzzle_key';
const LTI_SECRET = process.env.LTI_SECRET || 'secret';

export interface LTIProvider extends lti.Provider {
  valid_request: (req: Request, callback: (err: Error | null, isValid: boolean) => void) => void;
  body: any;
  userId?: string;
  username?: string;
  contextId?: string;
  resourceLinkId?: string;
  lisOutcomeServiceUrl?: string;
  lisResultSourcedId?: string;
}

// LTI 론치 검증 미들웨어
export function validateLTILaunch(req: Request, res: Response, next: NextFunction) {
  try {
    const provider = new lti.Provider(LTI_KEY, LTI_SECRET) as LTIProvider;

    provider.valid_request(req, (err, isValid) => {
      if (err) {
        console.error('LTI validation error:', err);
        return res.status(400).send('Invalid LTI request');
      }

      if (!isValid) {
        console.error('Invalid LTI signature');
        return res.status(403).send('Forbidden: Invalid LTI signature');
      }

      // LTI 데이터 추출
      const ltiData = {
        userId: provider.body.user_id || provider.userId,
        username: provider.body.lis_person_name_full || provider.username,
        contextId: provider.body.context_id || provider.contextId,
        resourceLinkId: provider.body.resource_link_id || provider.resourceLinkId,
        lisOutcomeServiceUrl: provider.body.lis_outcome_service_url || provider.lisOutcomeServiceUrl,
        lisResultSourcedId: provider.body.lis_result_sourcedid || provider.lisResultSourcedId,
      };

      // 세션에 LTI 정보 저장
      if (req.session) {
        (req.session as any).lti = ltiData;
      }

      // request에 LTI 정보 추가
      (req as any).lti = ltiData;

      next();
    });
  } catch (error) {
    console.error('LTI middleware error:', error);
    res.status(500).send('Internal server error');
  }
}

// 성적 보고 함수
export async function reportScore(
  lisOutcomeServiceUrl: string,
  lisResultSourcedId: string,
  score: number // 0.0 ~ 1.0
): Promise<boolean> {
  try {
    const provider = new lti.Provider(LTI_KEY, LTI_SECRET) as LTIProvider;

    return new Promise((resolve, reject) => {
      const outcomeService = new lti.OutcomeService({
        consumer_key: LTI_KEY,
        consumer_secret: LTI_SECRET,
        service_url: lisOutcomeServiceUrl,
        source_did: lisResultSourcedId,
      });

      outcomeService.send_replace_result(score, (err: Error | null, result: any) => {
        if (err) {
          console.error('Score reporting error:', err);
          reject(err);
        } else {
          console.log('Score reported successfully:', result);
          resolve(true);
        }
      });
    });
  } catch (error) {
    console.error('Report score error:', error);
    return false;
  }
}

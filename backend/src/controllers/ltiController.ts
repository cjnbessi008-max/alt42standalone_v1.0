import { Request, Response } from 'express';

export const ltiController = {
  // LTI 론치 처리
  async launch(req: Request, res: Response) {
    try {
      const ltiData = (req as any).lti;

      if (!ltiData) {
        return res.status(400).send('Invalid LTI request');
      }

      console.log('LTI Launch successful:', {
        userId: ltiData.userId,
        username: ltiData.username,
        contextId: ltiData.contextId,
        resourceLinkId: ltiData.resourceLinkId,
      });

      // 프론트엔드로 리다이렉트 (세션 정보 포함)
      const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:5173');

      // URL 파라미터로 전달
      redirectUrl.searchParams.set('user_id', ltiData.userId);
      redirectUrl.searchParams.set('user_name', ltiData.username || 'Student');
      redirectUrl.searchParams.set('context_id', ltiData.contextId || '');
      redirectUrl.searchParams.set('resource_link_id', ltiData.resourceLinkId || '');

      // 문제 ID가 custom parameter로 전달된 경우
      if (req.body.custom_problem_id) {
        redirectUrl.searchParams.set('problem_id', req.body.custom_problem_id);
      }

      // LTI outcome service URL이 있으면 전달
      if (ltiData.lisOutcomeServiceUrl) {
        redirectUrl.searchParams.set('lis_outcome_service_url', ltiData.lisOutcomeServiceUrl);
      }

      if (ltiData.lisResultSourcedId) {
        redirectUrl.searchParams.set('lis_result_sourcedid', ltiData.lisResultSourcedId);
      }

      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error('LTI launch error:', error);
      res.status(500).send('Internal server error during LTI launch');
    }
  },

  // LTI 설정 XML 제공 (Moodle에서 자동 설정용)
  async config(req: Request, res: Response) {
    const host = req.get('host') || 'localhost:3000';
    const protocol = req.protocol;
    const launchUrl = `${protocol}://${host}/lti/launch`;

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<cartridge_basiclti_link xmlns="http://www.imsglobal.org/xsd/imslticc_v1p0"
    xmlns:blti="http://www.imsglobal.org/xsd/imsbasiclti_v1p0"
    xmlns:lticm="http://www.imsglobal.org/xsd/imslticm_v1p0"
    xmlns:lticp="http://www.imsglobal.org/xsd/imslticp_v1p0"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imslticc_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticc_v1p0.xsd
    http://www.imsglobal.org/xsd/imsbasiclti_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imsbasiclti_v1p0p1.xsd
    http://www.imsglobal.org/xsd/imslticm_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticm_v1p0.xsd
    http://www.imsglobal.org/xsd/imslticp_v1p0 http://www.imsglobal.org/xsd/lti/ltiv1p0/imslticp_v1p0.xsd">
    <blti:title>Composition Puzzle</blti:title>
    <blti:description>Interactive function composition learning tool</blti:description>
    <blti:launch_url>${launchUrl}</blti:launch_url>
    <blti:extensions platform="canvas.instructure.com">
        <lticm:property name="privacy_level">public</lticm:property>
    </blti:extensions>
    <blti:extensions platform="moodle.org">
        <lticm:property name="privacy_level">public</lticm:property>
    </blti:extensions>
    <cartridge_bundle identifierref="BLTI001_Bundle"/>
    <cartridge_icon identifierref="BLTI001_Icon"/>
</cartridge_basiclti_link>`;

    res.set('Content-Type', 'application/xml');
    res.send(xml);
  },
};

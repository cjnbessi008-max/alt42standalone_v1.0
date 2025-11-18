/**
 * 에러 핸들링 미들웨어
 */

function errorHandler(err, req, res, next) {
  console.error('서버 오류:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || '서버 내부 오류가 발생했습니다.';

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

function notFound(req, res, next) {
  res.status(404).json({
    success: false,
    error: '요청한 리소스를 찾을 수 없습니다.'
  });
}

module.exports = {
  errorHandler,
  notFound
};

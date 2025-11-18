#!/usr/bin/env python3
"""
Simple HTTP Server for Linear Stairs Testing
로컬 테스트용 간단한 웹 서버
"""

import http.server
import socketserver
import os
import sys

# 포트 설정
PORT = 8000

# 현재 디렉토리를 linear-stairs로 변경
os.chdir(os.path.dirname(os.path.abspath(__file__)))

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """커스텀 HTTP 요청 핸들러"""

    def end_headers(self):
        # CORS 허용 (Moodle iframe 테스트용)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def log_message(self, format, *args):
        """로그 메시지 커스터마이징"""
        print(f"[{self.log_date_time_string()}] {format % args}")

if __name__ == "__main__":
    # 핸들러 설정
    Handler = MyHTTPRequestHandler

    # 서버 시작
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print("=" * 60)
        print("Linear Stairs 로컬 테스트 서버")
        print("=" * 60)
        print(f"\n✅ 서버 시작: http://localhost:{PORT}\n")
        print("📱 접속 URL:")
        print(f"   - 메인 앱:  http://localhost:{PORT}/index.html")
        print(f"   - 데모 페이지: http://localhost:{PORT}/demo.html")
        print(f"\n🔗 Moodle 연동 테스트 URL 예제:")
        print(f"   http://localhost:{PORT}/index.html?a1=3&d=5&n=7&moodle=1")
        print(f"\n⏹️  종료: Ctrl+C\n")
        print("=" * 60)

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n서버를 종료합니다...")
            sys.exit(0)

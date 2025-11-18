import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import './StatArtView.css';

const ParticleFlow = ({ data }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width = 500;
    const height = canvas.height = 400;

    // 파티클 초기화
    particlesRef.current = data.map((d, i) => ({
      x: (d.x / 100) * width,
      y: (d.y / 100) * height,
      size: d.size,
      velocity: d.velocity,
      opacity: d.opacity,
      angle: Math.random() * Math.PI * 2,
      color: getColorByOpacity(d.opacity)
    }));

    // 애니메이션 루프
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // 배경 그라디언트
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, 'rgba(102, 126, 234, 0.05)');
      gradient.addColorStop(1, 'rgba(118, 75, 162, 0.05)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // 파티클 그리기 및 업데이트
      particlesRef.current.forEach((particle, i) => {
        // 위치 업데이트
        particle.x += Math.cos(particle.angle) * particle.velocity;
        particle.y += Math.sin(particle.angle) * particle.velocity;

        // 화면 경계 체크
        if (particle.x < 0 || particle.x > width) {
          particle.angle = Math.PI - particle.angle;
        }
        if (particle.y < 0 || particle.y > height) {
          particle.angle = -particle.angle;
        }

        // 경계 내로 유지
        particle.x = Math.max(0, Math.min(width, particle.x));
        particle.y = Math.max(0, Math.min(height, particle.y));

        // 다른 파티클과의 연결선 그리기
        particlesRef.current.forEach((other, j) => {
          if (i < j) {
            const dx = other.x - particle.x;
            const dy = other.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
              ctx.strokeStyle = `rgba(102, 126, 234, ${0.2 * (1 - distance / 100)})`;
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(particle.x, particle.y);
              ctx.lineTo(other.x, other.y);
              ctx.stroke();
            }
          }
        });

        // 파티클 그리기
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = particle.color;
        ctx.globalAlpha = particle.opacity;
        ctx.fill();
        ctx.globalAlpha = 1;

        // 외곽선
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data]);

  const getColorByOpacity = (opacity) => {
    if (opacity > 0.8) return 'rgba(16, 185, 129, 0.8)';  // 초록
    if (opacity > 0.5) return 'rgba(245, 158, 11, 0.8)';  // 노랑
    return 'rgba(239, 68, 68, 0.8)';                      // 빨강
  };

  return (
    <motion.div
      className="particle-flow-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <canvas ref={canvasRef}></canvas>
      <div className="particle-info">
        <p>💫 파티클의 크기: 시도 횟수</p>
        <p>⚡ 파티클의 속도: 오답률 (빠를수록 어려움)</p>
        <p>🎨 파티클의 색상: 정답률 (초록 &gt; 노랑 &gt; 빨강)</p>
      </div>
    </motion.div>
  );
};

export default ParticleFlow;

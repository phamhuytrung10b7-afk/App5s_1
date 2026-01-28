import { Particle } from './types';

// Extended particle interface for better physics
interface AdvancedParticle extends Particle {
  tilt: number;
  tiltAngleIncrement: number;
  tiltAngle: number;
  shape: 'square' | 'circle';
}

export const runFireworks = (canvas: HTMLCanvasElement) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set canvas size
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let particles: AdvancedParticle[] = [];
  const colors = ['#ff0000', '#ffd700', '#ffffff', '#fbbf24', '#ef4444', '#10b981'];

  // Create a batch of particles at a specific position
  const createBurst = (x: number, y: number, particleCount: number, spread: number, angleOffset: number = 0) => {
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.random() * spread - spread / 2) + angleOffset;
      const velocity = Math.random() * 30 + 15; // Fast initial velocity
      
      const particle: AdvancedParticle = {
        x: x,
        y: y,
        vx: Math.cos(angle) * velocity,
        vy: Math.sin(angle) * velocity,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        size: Math.random() * 10 + 5,
        tilt: Math.floor(Math.random() * 10) - 10,
        tiltAngleIncrement: Math.random() * 0.07 + 0.05,
        tiltAngle: 0,
        shape: Math.random() > 0.5 ? 'circle' : 'square'
      };
      particles.push(particle);
    }
  };

  let animationFrameId: number;
  let startTime = Date.now();
  const duration = 4000; // Effect lasts 4 seconds

  const animate = () => {
    const timeLeft = duration - (Date.now() - startTime);

    if (timeLeft <= 0 && particles.length === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        return; 
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Keep adding fireworks for the first 2 seconds
    if (timeLeft > 2000) {
        // Random bursts from bottom corners (simulating stage cannons)
        if (Math.random() < 0.1) {
            createBurst(0, window.innerHeight, 30, Math.PI / 4, -Math.PI / 4); // Left corner
        }
        if (Math.random() < 0.1) {
            createBurst(window.innerWidth, window.innerHeight, 30, Math.PI / 4, -Math.PI * 3/4); // Right corner
        }
        // Random mid-air explosions
        if (Math.random() < 0.05) {
             createBurst(Math.random() * window.innerWidth, Math.random() * window.innerHeight * 0.5, 50, Math.PI * 2);
        }
    }

    // Update and draw particles
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      
      p.tiltAngle += p.tiltAngleIncrement;
      p.y += (Math.cos(p.tiltAngle) + 3 + p.size / 2) / 2; // Gravity + flutter
      p.x += Math.sin(p.tiltAngle) * 2;
      p.vx *= 0.95; // Air resistance
      p.vy *= 0.95; // Air resistance (if shooting up)
      p.y += p.vy * 0.5; // Apply initial vertical velocity

      p.alpha -= 0.005; // Fade out slowly

      if (p.y > canvas.height || p.alpha <= 0) {
        particles.splice(i, 1);
        i--;
        continue;
      }

      ctx.beginPath();
      ctx.lineWidth = p.size;
      ctx.strokeStyle = p.color;
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;

      if (p.shape === 'circle') {
          ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
      } else {
          ctx.translate(p.x, p.y);
          ctx.rotate(p.tiltAngle);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.rotate(-p.tiltAngle);
          ctx.translate(-p.x, -p.y);
      }
    }

    if (timeLeft > 0 || particles.length > 0) {
      animationFrameId = requestAnimationFrame(animate);
    }
  };

  // Initial Grand Explosion
  createBurst(canvas.width / 2, canvas.height / 2, 100, Math.PI * 2); // Center
  createBurst(0, canvas.height, 80, Math.PI / 3, -Math.PI / 3); // Left Cannon
  createBurst(canvas.width, canvas.height, 80, Math.PI / 3, -Math.PI * 2 / 3); // Right Cannon

  animate();
};

// Kept for compatibility but redirects to the new one
export const fireConfetti = (canvas: HTMLCanvasElement) => {
    runFireworks(canvas);
};

export const createConfetti = (canvas: HTMLCanvasElement) => {
    // Legacy support wrapper
    return () => {};
};
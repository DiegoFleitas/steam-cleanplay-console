declare global {
  interface Window {
    bubblesCursor?: () => void;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.bubblesCursor = function bubblesCursor() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    const cursor = { x: width / 2, y: width / 2 };
    const particles: Particle[] = [];

    const bindEvents = () => {
      document.addEventListener("mousemove", onMouseMove);
      window.addEventListener("resize", onWindowResize);

      setTimeout(() => {
        document.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("resize", onWindowResize);
      }, 20000);
    };

    const onWindowResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
    };

    const onMouseMove = (e: MouseEvent) => {
      cursor.x = e.clientX;
      cursor.y = e.clientY;
      addParticle(cursor.x, cursor.y);
    };

    const addParticle = (x: number, y: number) => {
      const particle = new Particle();
      particle.init(x, y);
      particles.push(particle);
    };

    const updateParticles = () => {
      particles.forEach((particle) => particle.update());
      for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].lifeSpan < 0) {
          particles[i].die();
          particles.splice(i, 1);
        }
      }
    };

    const loop = () => {
      requestAnimationFrame(loop);
      updateParticles();
    };

    class Particle {
      lifeSpan = 250;
      initialStyles: Record<string, string> = {
        position: "absolute",
        display: "block",
        pointerEvents: "none",
        zIndex: "10000000",
        width: "5px",
        height: "5px",
        willChange: "transform",
        background: "#e6f1f7",
        boxShadow:
          "-1px 0px #6badd3, 0px -1px #6badd3, 1px 0px #3a92c5, 0px 1px #3a92c5",
        borderRadius: "3px",
        overflow: "hidden",
      };
      velocity!: { x: number; y: number };
      position!: { x: number; y: number };
      element!: HTMLSpanElement;

      init(x: number, y: number) {
        this.velocity = {
          x: (Math.random() < 0.5 ? -1 : 1) * (Math.random() / 10),
          y: -0.4 + Math.random() * -1,
        };
        this.position = { x: x - 10, y: y - 10 };
        this.element = document.createElement("span");
        applyProperties(this.element, this.initialStyles);
        this.update();
        const container = document.querySelector(".container");
        container?.appendChild(this.element);
      }

      update() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        this.velocity.x += ((Math.random() < 0.5 ? -1 : 1) * 2) / 75;
        this.velocity.y -= Math.random() / 600;
        this.lifeSpan--;
        this.element.style.transform = `translate3d(${this.position.x}px,${this.position.y}px,0) scale(${0.2 + (250 - this.lifeSpan) / 250})`;
      }

      die() {
        this.element.parentNode?.removeChild(this.element);
      }
    }

    const applyProperties = (
      target: HTMLElement,
      properties: Record<string, string>
    ) => {
      for (const key in properties) {
        (target.style as unknown as Record<string, string>)[key] = properties[key];
      }
    };

    bindEvents();
    loop();
  };
});

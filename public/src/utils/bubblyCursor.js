document.addEventListener("DOMContentLoaded", () => {
  window.bubblesCursor = function bubblesCursor() {
    let width = window.innerWidth;
    let height = window.innerHeight;
    const cursor = { x: width / 2, y: width / 2 };
    const particles = [];

    const init = () => {
      bindEvents();
      loop();
    };

    const bindEvents = () => {
      document.addEventListener("mousemove", onMouseMove);
      window.addEventListener("resize", onWindowResize);

      setTimeout(() => {
        document.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("resize", onWindowResize);
      }, 20000);
    };

    const onWindowResize = (e) => {
      width = window.innerWidth;
      height = window.innerHeight;
    };

    const onTouchMove = (e) => {
      if (e.touches.length > 0) {
        for (let i = 0; i < e.touches.length; i++) {
          addParticle(e.touches[i].clientX, e.touches[i].clientY);
        }
      }
    };

    const onMouseMove = (e) => {
      cursor.x = e.clientX;
      cursor.y = e.clientY;

      addParticle(cursor.x, cursor.y);
    };

    const addParticle = (x, y) => {
      const particle = new Particle();
      particle.init(x, y);
      particles.push(particle);
    };

    const updateParticles = () => {
      particles.forEach((particle) => particle.update());
      particles.filter((particle, i) => {
        if (particle.lifeSpan < 0) {
          particle.die();
          particles.splice(i, 1);
        }
      });
    };

    const loop = () => {
      requestAnimationFrame(loop);
      updateParticles();
    };

    class Particle {
      constructor() {
        this.lifeSpan = 250;
        this.initialStyles = {
          position: "absolute",
          display: "block",
          pointerEvents: "none",
          "z-index": "10000000",
          width: "5px",
          height: "5px",
          "will-change": "transform",
          background: "#e6f1f7",
          "box-shadow":
            "-1px 0px #6badd3, 0px -1px #6badd3, 1px 0px #3a92c5, 0px 1px #3a92c5",
          "border-radius": "3px",
          overflow: "hidden",
        };
      }

      init(x, y) {
        this.velocity = {
          x: (Math.random() < 0.5 ? -1 : 1) * (Math.random() / 10),
          y: -0.4 + Math.random() * -1,
        };

        this.position = { x: x - 10, y: y - 10 };

        this.element = document.createElement("span");
        applyProperties(this.element, this.initialStyles);
        this.update();

        document.querySelector(".container").appendChild(this.element);
      }

      update() {
        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;

        this.velocity.x += ((Math.random() < 0.5 ? -1 : 1) * 2) / 75;
        this.velocity.y -= Math.random() / 600;
        this.lifeSpan--;

        this.element.style.transform = `translate3d(${this.position.x}px,${
          this.position.y
        }px,0) scale(${0.2 + (250 - this.lifeSpan) / 250})`;
      }

      die() {
        this.element.parentNode.removeChild(this.element);
      }
    }

    const applyProperties = (target, properties) => {
      for (let key in properties) {
        target.style[key] = properties[key];
      }
    };

    init();
  };
});

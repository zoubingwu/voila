export interface SpringValueConfig {
  from: number;
  to: number;
  stiffness: number;
  damping: number;
  mass: number;
  velocity: number;
  allowsOverdamping: boolean;
  clamp: boolean;
  restVelocityThreshold: number;
  restDisplacementThreshold: number;
}

const defaultConfig: SpringValueConfig = {
  from: 0,
  to: 1,
  stiffness: 100,
  damping: 10,
  mass: 1,
  velocity: 0,
  allowsOverdamping: false,
  clamp: false,
  restVelocityThreshold: 0.001,
  restDisplacementThreshold: 0.001,
};

interface Observer {
  next: (v: number) => void;
  complete?: () => void;
  error?: () => void;
}

export class SpringValue {
  static MAX_DELTA_TIME_MS = (1 / 60) * 1000 * 4; // advance 4 frames at max
  private _observers: Observer[] = [];
  private _config: SpringValueConfig;
  private _value: number;
  private _velocity: number;
  private _isAnimating: boolean;
  private _springTime: number = 0;
  private _currentTime: number = Date.now();
  private _currentAnimationStep: number = 0;

  constructor(config: Partial<SpringValueConfig>) {
    this._config = Object.assign(defaultConfig, config);
    this._value = this._config.from;
    this._velocity = this._config.velocity;
  }

  private reset() {
    this._value = this._config.from;
    this._velocity = this._config.velocity;
    this._currentTime = Date.now();
    this._springTime = 0.0;
  }

  get value() {
    return this._value;
  }

  set(to: number) {
    this.nextFrame(Date.now());

    const baseConfig = {
      from: this._value,
      velocity: this._velocity,
    };
    this._config = {
      ...this._config,
      ...baseConfig,
      to,
    };

    this.reset();
    this.start();
  }

  hardSet(value: number) {
    this.nextFrame(Date.now());

    const baseConfig = {
      from: value,
      velocity: this._velocity,
    };
    this._config = {
      ...this._config,
      ...baseConfig,
    };

    this.reset();
    this.stop();
    this._observers.forEach((ob) => ob.next.call(null, this._value));
  }

  start() {
    const { from, to, velocity } = this._config;

    if (from !== to || velocity !== 0) {
      this.reset();
      this._isAnimating = true;

      if (!this._currentAnimationStep) {
        this._currentAnimationStep = requestAnimationFrame(() => {
          this.step(Date.now());
        });
      }
    }
  }

  stop() {
    if (!this._isAnimating) return;

    this._isAnimating = false;
    if (this._currentAnimationStep) {
      cancelAnimationFrame(this._currentAnimationStep);
      this._currentAnimationStep = 0;
    }
  }

  step(ts: number) {
    this.nextFrame(ts);

    if (this._isAnimating) {
      this._currentAnimationStep = requestAnimationFrame(() => {
        this.step(Date.now());
      });
    }
  }


  /**
   * The core algorithms is based on https://github.com/Popmotion/popmotion and https://github.com/skevy/wobble
   */
  private nextFrame(ts: number) {
    if (!this._isAnimating) {
      return;
    }

    let deltaTime = ts - this._currentTime;

    if (deltaTime > SpringValue.MAX_DELTA_TIME_MS) {
      deltaTime = SpringValue.MAX_DELTA_TIME_MS;
    }
    this._springTime += deltaTime;

    const c = this._config.damping;
    const m = this._config.mass;
    const k = this._config.stiffness;
    const from = this._config.from;

    const to = this._config.to;

    const v0 = -this._config.velocity;

    let zeta = c / (2 * Math.sqrt(k * m)); // damping ratio (dimensionless)

    const omega0 = Math.sqrt(k / m) / 1000; // undamped angular frequency of the oscillator (rad/ms)
    const omega1 = omega0 * Math.sqrt(1.0 - zeta * zeta); // exponential decay
    const omega2 = omega0 * Math.sqrt(zeta * zeta - 1.0); // frequency of damped oscillation
    const x0 = to - from; // initial displacement of the spring at t = 0

    if (zeta > 1 && !this._config.allowsOverdamping) {
      zeta = 1;
    }

    let oscillation = 0.0;
    let velocity = 0.0;
    const t = this._springTime;

    if (zeta < 1) {
      // Under damped
      const envelope = Math.exp(-zeta * omega0 * t);

      oscillation =
        to -
        envelope *
          (((v0 + zeta * omega0 * x0) / omega1) * Math.sin(omega1 * t) +
            x0 * Math.cos(omega1 * t));

      // This looks crazy -- it's actually just the derivative of the
      // oscillation function
      velocity =
        zeta *
          omega0 *
          envelope *
          ((Math.sin(omega1 * t) * (v0 + zeta * omega0 * x0)) / omega1 +
            x0 * Math.cos(omega1 * t)) -
        envelope *
          (Math.cos(omega1 * t) * (v0 + zeta * omega0 * x0) -
            omega1 * x0 * Math.sin(omega1 * t));
    } else if (zeta === 1) {
      // Critically damped
      const envelope = Math.exp(-omega0 * t);
      oscillation = to - envelope * (x0 + (v0 + omega0 * x0) * t);
      velocity =
        envelope * (v0 * (t * omega0 - 1) + t * x0 * (omega0 * omega0));
    } else {
      // Overdamped
      const envelope = Math.exp(-zeta * omega0 * t);
      oscillation =
        to -
        (envelope *
          ((v0 + zeta * omega0 * x0) * Math.sinh(omega2 * t) +
            omega2 * x0 * Math.cosh(omega2 * t))) /
          omega2;
      velocity =
        (envelope *
          zeta *
          omega0 *
          (Math.sinh(omega2 * t) * (v0 + zeta * omega0 * x0) +
            x0 * omega2 * Math.cosh(omega2 * t))) /
          omega2 -
        (envelope *
          (omega2 * Math.cosh(omega2 * t) * (v0 + zeta * omega0 * x0) +
            omega2 * omega2 * x0 * Math.sinh(omega2 * t))) /
          omega2;
    }

    this._currentTime = ts;
    this._value = oscillation;
    this._velocity = velocity;

    if (!this._isAnimating) {
      this._observers.forEach((ob) => ob.next.call(null, this._value));
      this._observers.forEach((ob) => ob.complete?.());
      return;
    }

    // If the Spring is overshooting (when overshoot clamping is on), or if the
    // spring is at rest (based on the thresholds set in the config), stop the
    // animation.
    if (this.isSpringOvershooting() || this.isSpringAtRest()) {
      if (k !== 0) {
        // Ensure that we end up with a round value
        this._value = to;
        this._velocity = 0;
      }

      this.stop();
      this._observers.forEach((ob) => ob.complete?.());
    }

    this._observers.forEach((ob) => ob.next.call(null, this._value));
  }

  private isSpringOvershooting() {
    const { stiffness, from, to, clamp } = this._config;
    let isOvershooting = false;
    if (clamp && stiffness !== 0) {
      if (from < to) {
        isOvershooting = this._value > to;
      } else {
        isOvershooting = this._value < to;
      }
    }
    return isOvershooting;
  }

  private isSpringAtRest() {
    const {
      stiffness,
      to,
      restDisplacementThreshold,
      restVelocityThreshold,
    } = this._config;

    const isNoVelocity = Math.abs(this._velocity) <= restVelocityThreshold;
    const isNoDisplacement =
      stiffness !== 0 &&
      Math.abs(to - this._value) <= restDisplacementThreshold;
    return isNoDisplacement && isNoVelocity;
  }

  subscribe(observer: Observer | ((v: number) => void)) {
    if (typeof observer === 'function') {
      this._observers.push({
        next: observer,
      });
    } else {
      this._observers.push(observer);
    }

    return () => {
      const index = this._observers.findIndex((c) => c === observer);
      this._observers.splice(index, 1);
    };
  }
}

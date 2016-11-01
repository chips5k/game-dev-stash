export class Vector2d {
    constructor(readonly x: number, readonly y: number) {}
    static add(a: Vector2d, b: Vector2d) {
        return new Vector2d(a.x + b.x, a.y + b.y);
    }

    static subtract(a: Vector2d, b: Vector2d) {
        return new Vector2d(a.x - b.x, a.y - b.y);
    }

    static multiply(v: Vector2d, s: number) {
        return new Vector2d(v.x * s, v.y * s);
    }

    static divide(v: Vector2d, s: number) {
        return new Vector2d(v.x  / s, v.y / s);
    }

    static magnitude(v: Vector2d) {
        return Math.sqrt(Math.pow(v.x, 2) + Math.pow(v.y, 2));
    }

    static normalize(v: Vector2d) {
        return Vector2d.divide(v, Vector2d.magnitude(v));
    }
}



import {Vector2d} from './Vectors';

class RigidBody {
    constructor(readonly particles: Particle[], readonly constraints: Constraint[]) {}
}

class Constraint {
    constructor(readonly particleIndexA: number, readonly particleIndexB: number, readonly length: number) {}
}

class Particle {
    constructor(readonly position: Vector2d, readonly mass: number)  {}
}

class GameState {
    constructor(readonly rigidBodies: RigidBody[]){}
}

function advanceState(timestep: number, state: GameState, previousState: GameState) {
    
    let rigidBodies = state.rigidBodies.map(function(r, i) {

        let particles = r.particles.map(function(p , j) {
            let a = new Vector2d(0, p.mass * 0.00098);
            let currentVelocity = Vector2d.subtract(p.position, previousState.rigidBodies[i].particles[j].position);
            let n = Vector2d.add(p.position, Vector2d.add(currentVelocity, Vector2d.multiply(a, Math.pow(timestep, 2))));

            if(n.y > 500) {
                n = new Vector2d(n.x, 500);
            }

            return new Particle(n, p.mass);
        });

        r.constraints.forEach((c, i) => {
            let nDiffVector = Vector2d.subtract(particles[c.particleIndexB].position, particles[c.particleIndexA].position);
            let diff = Vector2d.magnitude(nDiffVector) - c.length;
            let normal = Vector2d.normalize(nDiffVector);
            particles[c.particleIndexA] = new Particle(Vector2d.add(particles[c.particleIndexA].position, Vector2d.multiply(normal, diff/2)), particles[c.particleIndexB].mass);
            particles[c.particleIndexB] = new Particle(Vector2d.subtract(particles[c.particleIndexB].position, Vector2d.multiply(normal, diff/2)), particles[c.particleIndexB].mass);
        });

        return new RigidBody(particles, r.constraints);

    });
    

    return new GameState(rigidBodies);
}

function renderState(state: GameState, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for(let i = 0; i < state.rigidBodies.length; i++) {
        let points = state.rigidBodies[i].particles;   

        ctx.beginPath();
        ctx.moveTo(points[0].position.x, points[0].position.y);
        for(var j = 0; j < points.length; j++) {
            let p = points[j];
            ctx.lineTo(p.position.x, p.position.y);
        }
        
        ctx.lineTo(points[0].position.x, points[0].position.y);

        ctx.strokeStyle="red";
        ctx.stroke();

    }
   
    
}



function createTriangleRigidBody(width: number, height: number, position: Vector2d, mass: number) {
    
    let particles = [
        new Particle(position, mass / 3), 
        new Particle(new Vector2d(position.x - width / 2, position.y + height), mass / 3), 
        new Particle(new Vector2d(position.x + width / 2, position.y + height), mass / 3)
    ];


    let constraints = [
        new Constraint(0, 1, height),
        new Constraint(1, 2, width),
        new Constraint(0, 2, height)
    ];

    return new RigidBody(particles, constraints);
}   

function createSquareRigidBody(width: number, height: number, position: Vector2d, mass: number) {
    
    let particles = [
        new Particle(position, mass / 4), 
        new Particle(new Vector2d(position.x, position.y + height), mass / 4), 
        new Particle(new Vector2d(position.x + width, position.y + height), mass / 4), 
        new Particle(new Vector2d(position.x + width, position.y), mass / 4)
    ];

    let constraints = [
        new Constraint(0, 1, height),
        new Constraint(1, 2, width),
        new Constraint(2, 3, height),
        new Constraint(3, 0, width),
        new Constraint(1, 3, Vector2d.magnitude(new Vector2d(width, height)))
    ];

    return new RigidBody(particles, constraints);
}   


function main(window: Window, canvas: HTMLCanvasElement) {

    let ctx = canvas.getContext('2d');

    let state = new GameState([
        createTriangleRigidBody(120, 85, new Vector2d(70, 60), 3),
        createSquareRigidBody(40, 60, new Vector2d(250, 30), 2),
        createSquareRigidBody(70, 20, new Vector2d(400, 10), 1)
    ]); 

    let previousState = state;
    let accumulated = 0;
    let step = 1000/60;
    let previousTimestamp = window.performance.now();

    let iterate = (timestamp: number) => {
        accumulated += timestamp - previousTimestamp;
        while(accumulated >= step) {
            let c = state;
            state = advanceState(step, state, previousState);
            renderState(state, canvas, ctx);
            previousState = c;
            accumulated -= step;
        }
        
        previousTimestamp = timestamp;
        window.requestAnimationFrame(iterate);
    };

    iterate(window.performance.now());
}

main(window, <HTMLCanvasElement>document.getElementById('canvas'));


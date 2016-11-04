
import {Vector2d} from './Vectors';

//TODO implement constraint class/objects instead of the hacky edge mapping done further down
class RigidBody {
    constructor(readonly path: Path, readonly constraints: Constraint[], readonly mass: number) {}
}

class Constraint {
    constructor(readonly pathIndexA: number, readonly pathIndexB: number, readonly length: number) {}
}

class Path {
    constructor(readonly points: Vector2d[], readonly closed: boolean) {}
}

class BoundingBox {
    constructor(readonly points: Vector2d[], readonly width: number, readonly height: number) {}
}

class GameState {
    constructor(readonly rigidBodies: RigidBody[]){}
}

function calculateVelocity(positionA: Vector2d, positionB: Vector2d) {
    return Vector2d.subtract(positionA, positionB);
}

function combineForces(forces: Vector2d[]) {
    return forces.reduce(Vector2d.add, new Vector2d(0, 0));
}

function integrateVelocity(velocity: Vector2d, acceleration: Vector2d, timestep: number) {
    return Vector2d.add(velocity, Vector2d.multiply(acceleration, Math.pow(timestep, 2)));
}

function integratePosition(position: Vector2d, velocity: Vector2d, acceleration: Vector2d, timestep: number) {
     return Vector2d.add(position, integrateVelocity(velocity, acceleration, timestep));
}

function advanceState(timestep: number, state: GameState, previousState: GameState) {
    
    let rigidBodies = state.rigidBodies.map((r: RigidBody, i: number) => {

        let acceleration = combineForces([new Vector2d(0, r.mass * 0.00098)]);
        let nPoints = r.path.points.map((p: Vector2d, j: number) => {
            return integratePosition(p, calculateVelocity(p, previousState.rigidBodies[i].path.points[j]), acceleration, timestep);
        }).map((p: Vector2d, j: number) => {
            if(p.y > 500) {
                return new Vector2d(p.x, 500);
            } else {
                return p;
            }
        });

        r.constraints.forEach((c, i) => {
            let nDiffVector = Vector2d.subtract(nPoints[c.pathIndexB], nPoints[c.pathIndexA]);
            let diff = Vector2d.magnitude(nDiffVector) - c.length;
            let normal = Vector2d.normalize(nDiffVector);
            nPoints[c.pathIndexA] = Vector2d.add(nPoints[c.pathIndexA], Vector2d.multiply(normal, diff/2));
            nPoints[c.pathIndexB] = Vector2d.subtract(nPoints[c.pathIndexB], Vector2d.multiply(normal, diff/2));
        });
        
        return new RigidBody(new Path(nPoints, r.path.closed), r.constraints, r.mass);
    }); 

    return new GameState(rigidBodies);
}

function renderState(state: GameState, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for(let i = 0; i < state.rigidBodies.length; i++) {
        let points = state.rigidBodies[i].path.points;   

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for(var j = 0; j < points.length; j++) {
            let p = points[j];
            ctx.lineTo(p.x, p.y);
        }

        if(state.rigidBodies[i].path.closed) {
            ctx.lineTo(points[0].x, points[0].y);
        }

        ctx.strokeStyle="red";
        ctx.stroke();

    }
   
    
}



function createTriangleRigidBody(width: number, height: number, position: Vector2d, mass: number) {
    
    let path = new Path([
            position, 
            new Vector2d(position.x - width / 2, position.y + height), 
            new Vector2d(position.x + width / 2, position.y + height)
        ],
        true
    );

    let constraints = [
        new Constraint(0, 1, height),
        new Constraint(1, 2, width),
        new Constraint(0, 2, height)
    ];

    return new RigidBody(path, constraints, mass);
}   

function createSquareRigidBody(width: number, height: number, position: Vector2d, mass: number) {
    
    let path = new Path([
        position, 
        new Vector2d(position.x, position.y + height), 
        new Vector2d(position.x + width, position.y + height), 
        new Vector2d(position.x + width, position.y)], 
        true
    );

    let constraints = [
        new Constraint(0, 1, height),
        new Constraint(1, 2, width),
        new Constraint(2, 3, height),
        new Constraint(3, 0, width),
        new Constraint(1, 3, Vector2d.magnitude(new Vector2d(width, height)))
    ];

    return new RigidBody(path, constraints, mass);
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


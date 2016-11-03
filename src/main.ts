
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

function advanceState(timestep: number, state: GameState, previousState: GameState) {
    let rigidBodies = state.rigidBodies.map((r: RigidBody, i: number) => {

        //Local forces (gravity)
        let a = new Vector2d(0, r.mass * 0.00098);

        //recreate each point of the bounding box
        let nPoints = r.path.points.map((p: Vector2d, j: number) => {
            
            //By applying position verlet integration

            //Calculate current velocity from previous two positions
            let currentVelocity = Vector2d.subtract(p, previousState.rigidBodies[i].path.points[j]);

            //Incorporate forces/accel over time
            let newVelocity = Vector2d.add(currentVelocity, Vector2d.multiply(Vector2d.multiply(a, timestep), timestep));

            //Update the position from the new velocity
            p = Vector2d.add(p, newVelocity);
            
            //Hack floor collision check
            if(p.y > 500) {
                p = new Vector2d(p.x, p.y - (p.y - 500));
            }

            return p;
        });

        //The following corrects edges and ensures
        //our points/edges are constrained to the correct shape.
        r.constraints.forEach((c, i) => {

            //Create a vector to represent difference between two points in an edge
            let nDiffVector = Vector2d.subtract(nPoints[c.pathIndexA], nPoints[c.pathIndexB]);

            //Depending on which edge we are working with
            //determine the "rest" length of the edge
            //in our case its either the boxes height or width
            

            //Determine how deformed the edge is by calculating the diff from the rest length
            let diff = Vector2d.magnitude(nDiffVector) - c.length;

            //Generate a normalized vector to handle orienting our points
            let normal = Vector2d.normalize(nDiffVector);

            //add/subtract half the difference to each point in the edge, projecting along the normal
            //obtained previously.
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
        ctx.moveTo(points[0].x, points[1].x);
        for(var j = 0; j < points.length; j++) {
            let p = points[j];
            ctx.lineTo(p.x, p.y);
        }

        if(state.rigidBodies[i].path.closed) {
            ctx.lineTo(points[0].x, points[0].y);
        }
    }
    ctx.strokeStyle="red";
    ctx.stroke();
    
}



function main(window: Window, canvas: HTMLCanvasElement) {
    let ctx = canvas.getContext('2d');

    let width = 40;
    let height = 70;

    let path = new Path([new Vector2d(10, 10), new Vector2d(10, 80), new Vector2d(50, 80), new Vector2d(50, 10)], true);
    let dimensions = new Vector2d(width, height);
    let dimensionsLength = Vector2d.magnitude(dimensions);
    let constraints = [
        new Constraint(0, 1, height),
        new Constraint(1, 2, width),
        new Constraint(2, 3, height),
        new Constraint(3, 0, width),
        new Constraint(1, 3, dimensionsLength),
        new Constraint(0, 2, dimensionsLength)
    ];


    let rigidBody = new RigidBody(path, constraints, 1);

    let state = new GameState([rigidBody]); 
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


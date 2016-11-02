
import {Vector2d} from './Vectors';

class RigidBody {
    constructor(readonly boundingBox: BoundingBox, readonly mass: number) {}
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
        let nPoints = r.boundingBox.points.map((p: Vector2d, j: number) => {
            
            //By applying position verlet integration

            //Calculate current velocity from previous two positions
            let currentVelocity = Vector2d.subtract(p, previousState.rigidBodies[i].boundingBox.points[j]);

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

        //Research suggests i only need to constrain the 4 main edges, but in practice
        //the box is able to be squashed whilst still validating the edge constraints.
        //Thus the final two edges - "Diagonals" are required to enforce the distance between opposing points
        //Note this behaviour is probably caused by dodgy collision detection with the floor.
        let edges = [[0, 1], [1, 2], [2, 3], [3, 0], [0, 2], [1, 3]];
        
        //All of this needs to be refactored into something more managable but without relying
        //on mutable state.
        //Note, th
        
        //The following corrects edges and ensures
        //our points/edges are constrained to the correct shape.
        edges.forEach((e, i) => {

            //Create a vector to represent difference between two points in an edge
            let nDiffVector = Vector2d.subtract(nPoints[e[1]], nPoints[e[0]]);

            //Depending on which edge we are working with
            //determine the "rest" length of the edge
            //in our case its either the boxes height or width
            var oLength = 0;
            switch(i) {
                case 0:
                case 2:
                    oLength = r.boundingBox.height;
                break;

                case 1:
                case 3:
                    oLength = r.boundingBox.width;
                break;

                case 4:
                case 5:
                    //For diagonals, we need the distance between two opposing corners
                    let t = new Vector2d(r.boundingBox.width, r.boundingBox.height);
                    oLength = Vector2d.magnitude(t);

                break;

            }

            //Determine how deformed the edge is by calculating the diff from the rest length
            let diff = Vector2d.magnitude(nDiffVector) - oLength;

            //Generate a normalized vector to handle orienting our points
            let normal = Vector2d.normalize(nDiffVector);

            //add/subtract half the difference to each point in the edge, projecting along the normal
            //obtained previously.
            nPoints[e[0]] = Vector2d.add(nPoints[e[0]], Vector2d.multiply(normal, diff/2));
            nPoints[e[1]] = Vector2d.subtract(nPoints[e[1]], Vector2d.multiply(normal, diff/2));
        });
        

        return new RigidBody(new BoundingBox(nPoints, r.boundingBox.width, r.boundingBox.height), r.mass);
    });

    return new GameState(rigidBodies);
}

function renderState(state: GameState, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for(let i = 0; i < state.rigidBodies.length; i++) {
        let points = state.rigidBodies[i].boundingBox.points;   
        ctx.beginPath();
        ctx.moveTo(points[3].x,points[3].y);
        for(var j = 0; j < points.length; j++) {
            let p = points[j];
            ctx.lineTo(p.x, p.y);
        }
    }
    ctx.strokeStyle="red";
    ctx.stroke();
    
}



function main(window: Window, canvas: HTMLCanvasElement) {
    let ctx = canvas.getContext('2d');
    let box = new BoundingBox([new Vector2d(10, 10), new Vector2d(10, 80), new Vector2d(50, 80), new Vector2d(50, 10)], 40, 70);
    let rigidBody = new RigidBody(box,5);
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


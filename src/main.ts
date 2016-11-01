
import {Vector2d} from './Vectors';

class RigidBody {
    constructor(readonly boundingBox: BoundingBox, readonly mass: number) {}
}

class BoundingBox {
    readonly offsetCenter: Vector2d;
    readonly edgeLengths: number[];
    constructor(readonly points: Vector2d[]) {
        let edges = [[0, 1], [1, 2], [2, 3], [3, 0]];
        this.edgeLengths = [];

        for(var i = 0; i < edges.length; i++) {
            let oDiffVector = Vector2d.subtract(points[edges[i][0]], points[edges[i][1]]);
            this.edgeLengths.push(Vector2d.magnitude(oDiffVector));
        }

    }

}

class GameState {
    constructor(readonly rigidBodies: RigidBody[]){}
}



function advanceState(timestep: number, state: GameState, previousState: GameState) {
    let rigidBodies = state.rigidBodies.map((r: RigidBody, i: number) => {

        //Local forces (gravity)
        let a = new Vector2d(0, r.mass * 0.0098);
        let oPoints = r.boundingBox.points;
        let nPoints = r.boundingBox.points.map((p: Vector2d, j: number) => {
          
            let currentVelocity = Vector2d.subtract(p, previousState.rigidBodies[i].boundingBox.points[j]);
            
            let newVelocity = Vector2d.add(currentVelocity, Vector2d.multiply(a, timestep));

            p = Vector2d.add(p, newVelocity);

            if(p.y > 500) {
                p = new Vector2d(p.x, p.y - (p.y - 500));
            }

            return p;
        });

        let edges = [[0, 1], [1, 2], [2, 3], [3, 0]];
        
       
        edges.forEach((e, i) => {
            
            let nDiffVector = Vector2d.subtract(nPoints[e[1]], nPoints[e[0]]);
            let diff = Vector2d.magnitude(nDiffVector) - r.boundingBox.edgeLengths[i];
            
            let normal = Vector2d.normalize(nDiffVector);
            
            nPoints[e[0]] = Vector2d.add(nPoints[e[0]], Vector2d.multiply(normal, diff/2));
            nPoints[e[1]] = Vector2d.subtract(nPoints[e[1]], Vector2d.multiply(normal, diff/2));

        }); 
       
        return new RigidBody(new BoundingBox(nPoints), r.mass);
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
    let box = new BoundingBox([new Vector2d(10, 10), new Vector2d(10, 70), new Vector2d(50, 60), new Vector2d(50, 10)]);
    let rigidBody = new RigidBody(box, 10);
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


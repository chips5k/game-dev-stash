
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



function advanceState(timestep: number, state: GameState, previousState: GameState, inputState: { [id: string]: Boolean; } ) {

   
    

    


    

    let rigidBodies = state.rigidBodies.map(function(r, i) {

         //Add default air resistance
        let globalForces: Vector2d[] = [
            new Vector2d(0, -0.00009)
        ];

        if(i === 0) {
            if(inputState['w']) {
                globalForces.push(new Vector2d(0, -0.0005));
            }

            if(inputState['a']) {
                globalForces.push(new Vector2d(-0.0005, 0));
                
            }

            if(inputState['d']) {
                globalForces.push(new Vector2d(0.0005, 0));
            }

            if(inputState[' ']) {
                globalForces.push(new Vector2d(0, -0.005));
            }


        }
        
        let particles = r.particles.map(function(p , j) {



            
            //Calculate gravitational accelleration
            let g = 9.81 * Math.pow(10, -4);
            //and the force created by the particles mass
            let gravitationalForce = new Vector2d(0, g * p.mass);

            //Combine all our forces, and append the gravitional force
            let f = globalForces.reduce((v1, v2) => {
                return Vector2d.add(v1, v2);
            }, gravitationalForce);

            
            //Calculate the current velocity from the previous two states
            let currentVelocity = Vector2d.subtract(p.position, previousState.rigidBodies[i].particles[j].position);

            //Add negative frictionional forces (if moving right)
            if(currentVelocity.x > 0) {
                f = Vector2d.add(new Vector2d(-0.0001, 0), f);
            }

            //Add positive frictionional forces (if moving left)
            if(currentVelocity.x < 0) {
                f = Vector2d.add(new Vector2d(0.0001, 0), f);
            }

            //Calculate the acceleration from the combined forces and the particles mass
            let a = Vector2d.divide(f, p.mass); 


            //and integrate the particles position using the position verlet method 
            let n = Vector2d.add(p.position, Vector2d.add(currentVelocity, Vector2d.multiply(a, Math.pow(timestep, 2))));

            //Crappy collision detection, ideally we should model this using
            //an opposing force 
            if(n.y > 500) {
                n = new Vector2d(n.x, 500);
            }

            if(n.y < 0) {
                n = new Vector2d(n.x, 0);
            }

            if(n.x < 0) {
                n = new Vector2d(0, n.y);
            }

            if(n.x > 800) {
                n = new Vector2d(800, n.y);
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
        new Constraint(1, 3, Vector2d.magnitude(new Vector2d(width, height))),
        new Constraint(0, 2, Vector2d.magnitude(new Vector2d(width, height)))
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

    // let state = new GameState([
    //     createSquareRigidBody(40, 40, new Vector2d(20, 0), 1),
    //     createSquareRigidBody(40, 40, new Vector2d(80, 0), 2),
    //     createSquareRigidBody(40, 40, new Vector2d(140, 0), 3)
    // ]); 

    let previousState = state;
    let accumulated = 0;
    let step = 1000/60;
    let previousTimestamp = window.performance.now();

    let inputState: { [id: string]: Boolean; } = {};

    window.addEventListener('keydown', (e) => {
        inputState[e.key] = true;
    }, true);
    window.addEventListener('keyup', (e) => {
        inputState[e.key] = false;
    }, true);

    
    let iterate = (timestamp: number) => {
        
        accumulated += timestamp - previousTimestamp;
        while(accumulated >= step) {
            let c = state;
            state = advanceState(step, state, previousState, Object.assign({}, inputState));
            
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



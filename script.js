
 //create bunbuff
function createBunbuff(id, minAggression, maxAggression) {
//return
    return {
        id: id,
        age: 0,
        //used the math.floor/random functions to give us a random number
        //for the aggression of each bunbuff.
        aggression: Math.floor(
            Math.random() * (maxAggression - minAggression + 1) +
            minAggression,
        ),
        row: 0,
        col: 0,

    }
}

//POPULATION


    //create a function for the bunbuff population
    function BunbuffPop(rows,cols,popSize,minAggression,maxAggression){

        let maxCapacity = rows * cols * 2
        //multiplied by 2 so the cell can have a max of 2
        popSize = Math.min(popSize, maxCapacity);

        //making an array we can fill later it will hold the bunbuffs spot
        let bunbuffs = [];

        //create a for loop which will create the bunbuff
        for (let i = 0; i < popSize; i++) {
            let bunbuff = createBunbuff(i +1, minAggression, maxAggression);

            //give the bunbuff a random spot to populate in
            let placed = false;

            //using a while loop to keep trying to place the bunbuff until it finds an empty spot
            while (!placed) {
                let randomRow = Math.floor(Math.random() * rows);
                let randomCol = Math.floor(Math.random() * cols);

                //verify if the spot is actually available
                let occupant = bunbuffs.filter(
                    bunbuff => bunbuff.row === randomRow && bunbuff.col === randomCol
                );

                //put a bunbuff in the spor if there are less than 2
                if (occupant.length < 2) {
                    bunbuff.row = randomRow;
                    bunbuff.col = randomCol;
                    bunbuffs.push(bunbuff);
                    placed = true;
                }
            }
        }

        return bunbuffs;
    }


//MOVEMENT


function moveBunbuff(bunbuffs, rows, cols){

    //make a for loop to iterate through bunbuffs
    for (let bunbuff of bunbuffs) {
        let directions = [
            //do 8 directions like we did for tictactoe
            [-1,-1],
            [-1,0],
            [-1,1],
            [0,-1],
            [0,1],
            [1,-1],
            [1,0],
            [1,1]

        ];

        //create empty array for available cells, will iterate through it with a for loop
        let availableCells = [];

        for(let direction of directions) {
            let newRow = bunbuff.row + direction[0];
            let newCol = bunbuff.col + direction[1];

            //check if the new row and col are within the bounds of the grid
            if (newRow >= 0 && newRow < rows && newCol >= 0 && newCol < cols) {

                //check if the cell is occupied by another bunbuff
                let occupant = bunbuffs.filter(
                    bunbuff => bunbuff.row === newRow && bunbuff.col === newCol
                );

                if (occupant.length < 2) {
                    availableCells.push([newRow, newCol]);
                }
            }
        }

        if (availableCells.length > 0) {
            let randomIndex = Math.floor(Math.random() * availableCells.length);
            let newSpot = availableCells[randomIndex];

            bunbuff.row = newSpot[0];
            bunbuff.col = newSpot[1];
        }
    }

    return bunbuffs;
}

// SIMULATION


let currentStep = 0;
let nextId = 1;
let totalBirths = 0;
let totalDeaths = 0;
let totalDeceasedAge = 0;
let totalBorn = 0;
let eventLog = [];
let lastStepSummary = { step: 0, births: 0, deaths: 0, events: [] };

//start or restart the simulation
function startSimulation(rows, cols, popSize, minAggression, maxAggression) {
    if (![rows, cols, popSize, minAggression, maxAggression].every(Number.isInteger) ||
        rows < 1 || cols < 1 || popSize < 1 ||
        minAggression < 1 || maxAggression > 99 || minAggression > maxAggression) {
        throw new Error("Enter valid positive integers and aggression between 1 and 99.");
    }
    currentStep = 0;
    totalBirths = 0;
    totalDeaths = 0;
    totalDeceasedAge = 0;
    eventLog = ["[System] Simulation started."];
    let bunbuffs = BunbuffPop(rows, cols, popSize, minAggression, maxAggression);
    nextId = bunbuffs.length + 1;
    totalBorn = bunbuffs.length;
    lastStepSummary = { step: 0, births: 0, deaths: 0, events: [] };
    return bunbuffs;
}

//statistics for the React interface
function getSimulationStats(bunbuffs) {
    return {
        currentStep: currentStep,
        averageBirths: currentStep ? totalBirths / currentStep : 0,
        averageDeaths: currentStep ? totalDeaths / currentStep : 0,
        averageLifespan: totalDeaths ? totalDeceasedAge / totalDeaths : 0,
        population: bunbuffs.length,
        totalBorn: totalBorn,
        events: [...eventLog],
        lastStepSummary: lastStepSummary
    };
}


function simulateStep(bunbuffs, M, N, maxLifespan, maxLitter, minAgg, maxAgg) {

    if (bunbuffs.length === 0) return bunbuffs;

    // increment the current step
    currentStep++;
    console.log(`Simulating step ${currentStep}...`);

    // move bunbuffs to new positions
    bunbuffs = moveBunbuff(bunbuffs.map(b => ({...b})), M, N);
    let events = [];
    let startingPopulation = bunbuffs.length;

    // handle natural deaths, fighting, and reproduction
    bunbuffs = naturalDeaths(bunbuffs, maxLifespan, events);
    bunbuffs = fighting(bunbuffs, events);

    let result = reproduction(bunbuffs, M, N, maxLitter, minAgg, maxAgg, nextId, events);

    bunbuffs = result.bunbuffs;
    nextId = result.nextId;

    console.log("Newborns this month:", result.births);
    let deaths = startingPopulation + result.births - result.bunbuffs.length;
    totalBirths += result.births;
    totalDeaths += deaths;
    totalBorn += result.births;
    lastStepSummary = { step: currentStep, births: result.births, deaths: deaths, events: events };
    eventLog.push(...events);

    // increment the age of each bunbuff
    for (let i = 0; i < bunbuffs.length; i++) {
        bunbuffs[i].age++;
    }

    // check if all bunbuffs have died
    if (bunbuffs.length === 0) {
        console.log("All bunbuffs have died. Simulation ended.");
        return bunbuffs;
    }

    // log the current state of the bunbuffs
    console.log(`Step ${currentStep} complete. Remaining bunbuffs: ${bunbuffs.length}`);
    return bunbuffs;
}

// NATURAL DEATH



 //making a natural death function
function naturalDeaths(bunbuffs, lifespan, events = []) {

    // create an array to hold the survivors
    let survivors = [];

    // loop through the bunbuffs and check if they die from natural causes
    for (let i = 0; i < bunbuffs.length; i++) {
        let b = bunbuffs[i];

        let deathChance = (b.age / lifespan) * 100;

        // use Math.random() to determine if the bunbuff dies or not
        if (Math.random() * 100 < deathChance) {
            console.log(`Bunbuff ${b.id} died from natural causes with age ${b.age}`);
            events.push(`Bunbuff ${b.id} died from natural causes at age ${b.age}.`);
            totalDeceasedAge += b.age;
        } else {
            survivors.push(b);
        } // if the bunbuff survives, add it to the survivors array
    }

    return survivors;
}


 // FIGHTING



function fighting(bunbuffs, events = []) {

    //make an array to keep track of bunbuffs that die
    let deadBunbuffs = [];
    let checkedCells = [];

    //iterate through the bunbuffs with a for loop
    for (let bunbuff of bunbuffs) {
        //find out if there are two bunbuffs in a cell
        let occupant = bunbuffs.filter(
            b => b.row === bunbuff.row && b.col === bunbuff.col
        );

        //only have them fight if there are exaclty 2 bunbuffs in the cell
        if (occupant.length === 2) {

            let cell = bunbuff.row + "," + bunbuff.col;

            if (checkedCells.includes(cell)) {
                continue;
            }

            checkedCells.push(cell);

            let bunbuff1 = occupant[0];
            let bunbuff2 = occupant[1];

            //check if they havent already fought
            if (deadBunbuffs.includes(bunbuff1) ||
                deadBunbuffs.includes(bunbuff2)) {
                continue;
            }

            //check if its based on aggression
            let attack1 = Math.random() < bunbuff1.aggression / 100;
            let attack2 = Math.random() < bunbuff2.aggression / 100;

            //if both attack, both die
            if (attack1 && attack2) {
                deadBunbuffs.push(bunbuff1, bunbuff2);
                // if one attacks the other dies vice versa
            } else if (attack1) {
                deadBunbuffs.push(bunbuff2);
            } else if (attack2) {
                deadBunbuffs.push(bunbuff1);
            }
        }
    }

    for (let b of deadBunbuffs) {
        events.push(`Bunbuff ${b.id} died in a fight at age ${b.age}.`);
        totalDeceasedAge += b.age;
    }

    //if a bunbuff dies get it out of the pop
    bunbuffs = bunbuffs.filter(
        b => !deadBunbuffs.includes(b)
    );

    return bunbuffs;
}



// REPRODUCTION

//make a function for reproduction

 // REPRODUCTION

//make a function for reproduction
function reproduction(bunbuffs, rows, cols,maxLitterSize, minAggression, maxAggression, nextId, events = []) {

    // keep track of cells that have already been reporduced
    let checkedCells = [];
    let babyBunbuffs = [];

    //make a for loop to iterate through the population
    for (let bunbuff of bunbuffs) {
        //check if there are multiple bunbuffs
        let occupant = bunbuffs.filter(
            b => b.row === bunbuff.row && b.col === bunbuff.col
        );

        //only reproduce if there are exactly 2 bunbuffs in the cell
        if (occupant.length === 2) {
            let cell = bunbuff.row + "," + bunbuff.col;

            //dont let the same pair reproduce more than once
            if (checkedCells.includes(cell)) {
                continue;
            }
            checkedCells.push(cell);

            let bunbuff1 = occupant[0];
            let bunbuff2 = occupant[1];

            //make sure theyre 6 months or older
            if (bunbuff1.age >= 6 && bunbuff2.age >= 6) {

                //check all 8 cells
                let directions = [
                    [-1,-1],
                    [-1,0],
                    [-1,1],
                    [0,-1],
                    [0,1],
                    [1,-1],
                    [1,0],
                    [1,1]
                ];

                // store all available spots for the babies
                let availableCells = [];

                for (let direction of directions) {

                    let newRow = bunbuff.row + direction[0];
                    let newCol = bunbuff.col + direction[1];

                    if (newRow >= 0 && newRow < rows &&
                        newCol >= 0 && newCol < cols) {

                        //count bunbuffs in the cell nearby
                        let occupant = bunbuffs.filter(
                            b => b.row === newRow && b.col === newCol
                        );

                        //also count newborns born this month
                        let babiesInCell = babyBunbuffs.filter(
                            b => b.row === newRow && b.col === newCol
                        );

                        //keep the max at 2 bunbuffs per cell
                        let emptySpots = 2 - occupant.length - babiesInCell.length;

                        for (let i = 0; i < emptySpots; i++) {
                            availableCells.push([newRow, newCol]);
                        }
                    }
                }

                //litter size cant be more than the alloted space in the cell
                let litterSize = Math.min(maxLitterSize, availableCells.length);

                //make a new baby bunbuff
                for (let i = 0; i < litterSize; i++) {

                    //choose a random availaable neighborin spot
                    let randomIndex = Math.floor(Math.random() * availableCells.length);
                    let newSpot = availableCells.splice(randomIndex, 1)[0];

                    //make the id for the baby
                    let baby = createBunbuff(nextId, minAggression, maxAggression);

                    nextId++;

                    //put the baby in the new cell
                    baby.row = newSpot[0];
                    baby.col = newSpot[1];

                    babyBunbuffs.push(baby);
                    events.push(`Bunbuff ${baby.id} was born at (${baby.row}, ${baby.col}).`);
                }
            }
        }
    }

    //add to pop
    bunbuffs = bunbuffs.concat(babyBunbuffs);

    //return pop
    return {
        bunbuffs: bunbuffs,
        nextId: nextId,
        births: babyBunbuffs.length
    };
}


// test runs, will comment out later
if (typeof window !== "undefined" && window.RUN_BUNBUFF_TESTS === true) {
let test = BunbuffPop(3, 3, 10, 10, 50);

console.log("Population:", test.length);
console.log("Before movement:", test.map(b => ({...b})));

moveBunbuff(test, 3, 3);

console.log("After movement:", test.map(b => ({...b})));

test = fighting(test);

console.log("After fighting:", test);
console.log("Surviving population:", test.length);

}

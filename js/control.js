const playButtonElement = document.getElementById('play-button');
const resetButtonElement = document.getElementById('reset-button');
const resetModBHuttonElement = document.getElementById('reset-mod-button');
const playerCardContainer = document.getElementById('playerCardContainer');
const body = document.querySelector('body');

var contestants = [];

var selectedContestant = null;



function addContestant(name, image) {
    var contestant = {};

    contestant.name = name
    contestant.image = !!image ? image : "./images/blank.jpg";
    contestant.score = 0;
    contestant.scoreMod = 0;
    contestant.maxHR = 0;

    contestants.push(contestant);

    return contestants.length;
}

function createPlayerCardEl(playerName, imagePath, initialScore=0) {
    // Create card container
    const playerCard = document.createElement('div');
    playerCard.className = 'playerCard';
    playerCard.id = playerName;
    playerCard.setAttribute('onclick', `selectContestant(contestants.find(c => c.name === '${playerName}'))`);

    // Create the table
    const table = document.createElement('table');

    // Row 1: Player Image
    const imageRow = document.createElement('tr');
    const imageCell = document.createElement('td');
    imageCell.colSpan = 3;

    const playerImageDiv = document.createElement('div');
    playerImageDiv.className = 'playerImage';

    const playerImage = document.createElement('img');
    playerImage.id = 'playerImageElement';
    playerImage.src = imagePath;

    playerImageDiv.appendChild(playerImage);
    imageCell.appendChild(playerImageDiv);
    imageRow.appendChild(imageCell);
    table.appendChild(imageRow);

    // Row 2: Player Name
    const nameRow = document.createElement('tr');
    const nameCell = document.createElement('td');
    nameCell.colSpan = 3;

    const playerNameDiv = document.createElement('div');
    playerNameDiv.className = 'contestantName';
    playerNameDiv.id = 'playerNameElement';
    playerNameDiv.textContent = playerName;

    nameCell.appendChild(playerNameDiv);
    nameRow.appendChild(nameCell);
    table.appendChild(nameRow);

    // Row 3: Score Display
    const scoreRow = document.createElement('tr');

    const scoreLabelCell = document.createElement('td');
    scoreLabelCell.colSpan = 2;
    scoreLabelCell.textContent = 'Score:';

    const scoreValueCell = document.createElement('td');
    scoreValueCell.style.fontWeight = 'bold';

    const scoreSpan = document.createElement('span');
    scoreSpan.id = 'playerScoreElement-' + playerName;
    scoreSpan.textContent = initialScore;

    scoreValueCell.appendChild(scoreSpan);
    scoreRow.appendChild(scoreLabelCell);
    scoreRow.appendChild(scoreValueCell);
    table.appendChild(scoreRow);

    // Row 4: Score Modifiers
    const modRow = document.createElement('tr');

    const minusButtonCell = document.createElement('td');
    minusButtonCell.style.width = '60px';

    const minusButton = document.createElement('button');
    minusButton.className = 'scoreButton minusButton';
    minusButton.textContent = '-';
    minusButton.setAttribute('onclick', `scoreModSub("${playerName}")`);

    minusButtonCell.appendChild(minusButton);

    const modCell = document.createElement('td');

    const scoreModSpan = document.createElement('span');
    scoreModSpan.className = 'scoreMod';
    scoreModSpan.id = 'playerScoreModElement-' + playerName;
    scoreModSpan.textContent = initialScore;
    

    modCell.appendChild(scoreModSpan);

    const plusButtonCell = document.createElement('td');
    plusButtonCell.style.width = '60px';

    const plusButton = document.createElement('button');
    plusButton.className = 'scoreButton plusButton';
    plusButton.textContent = '+';
    plusButton.setAttribute('onclick', `scoreModAdd("${playerName}")`);

    plusButtonCell.appendChild(plusButton);

    modRow.appendChild(minusButtonCell);
    modRow.appendChild(modCell);
    modRow.appendChild(plusButtonCell);
    table.appendChild(modRow);

    // Append the table to the card
    playerCard.appendChild(table);

    return playerCard;
}


function scoreModAdd(playerName) {
    const player = contestants.find(c => c.name === playerName);
    player.scoreMod += 1;
    updatePlayerScores();

}

function scoreModSub(playerName) {
    const player = contestants.find(c => c.name === playerName);
    player.scoreMod -= 1;
    updatePlayerScores();
}

function enactScoreMods() {
    contestants.forEach((contestant) => {
        contestant.score += contestant.scoreMod;
        contestant.scoreMod = 0;
    });
}

function updatePlayerScores() {
    var highScore = 0;

    contestants.forEach((contestant) => {
        document.getElementById('playerScoreElement-'+contestant.name).textContent = contestant.score;

        document.getElementById('playerScoreModElement-'+contestant.name).textContent = contestant.scoreMod;

        if (contestant.scoreMod > 0) {
            document.getElementById('playerScoreModElement-'+contestant.name).style.color = '#00FF00';
        }

        if (contestant.scoreMod < 0) {
            document.getElementById('playerScoreModElement-'+contestant.name).style.color = '#FF0000';
        }

        if (contestant.scoreMod == 0) {
            document.getElementById('playerScoreModElement-'+contestant.name).style.color = '';
        }

        if (contestant.score > highScore) {
            highScore = contestant.score;
        }
    });

    if (highScore != 0) {
        contestants.forEach((contestant) => {
            if (contestant.score === highScore) {
                document.getElementById(contestant.name).style.backgroundColor = '#005500';
            } else {
                document.getElementById(contestant.name).style.backgroundColor = '#000000';
            }
        });
    } else {
        contestants.forEach((contestant) => {
            document.getElementById(contestant.name).style.backgroundColor = '#000000';
        });
    }
    
}



const bc = new BroadcastChannel('scoreboard');

playButtonElement.addEventListener('click', () => {
    playChanges();
});

addEventListener('keydown', (event) => {
    if (event.key === 'p') {
        playChanges();
    }

    else if (selectedContestant != null) {
        if (event.key === 'ArrowUp') {
            scoreModAdd(selectedContestant.name);

        } else if (event.key === 'ArrowDown') {
            scoreModSub(selectedContestant.name);
        }



        else if (event.key === '1') {
            setPlayerModScore(selectedContestant, 1);
        }
        else if (event.key === '2') {
            setPlayerModScore(selectedContestant, 2);
        }
        else if (event.key === '3') {
            setPlayerModScore(selectedContestant, 3);
        }
        else if (event.key === '4') {
            setPlayerModScore(selectedContestant, 4);
        }
        else if (event.key === '5') {
            setPlayerModScore(selectedContestant, 5);
        }
        else if (event.key === '6') {
            setPlayerModScore(selectedContestant, 6);
        }
        else if (event.key === '7') {
            setPlayerModScore(selectedContestant, 7);
        }
        else if (event.key === '8') {
            setPlayerModScore(selectedContestant, 8);
        }
        else if (event.key === '9') {
            setPlayerModScore(selectedContestant, 9);
        }
        else if (event.key === '0') {
            setPlayerModScore(selectedContestant, 0);
        }
    }
    if (event.key === 'ArrowRight') {
        if (selectedContestant == null) {
            selectContestant(contestants[0]);
        } else {

            newIndex = contestants.indexOf(selectedContestant) + 1;
            if (newIndex >= contestants.length) {
                newIndex = 0;
            }
    
            selectContestant(contestants[newIndex]);
        }
        
    }
    else if (event.key === 'ArrowLeft') {
        if (selectedContestant === null) {
            selectContestant(contestants[contestants.length - 1]);
        } else {

            newIndex = contestants.indexOf(selectedContestant) - 1;
            if (newIndex < 0) {
                newIndex = contestants.length - 1;
            }
    
            selectContestant(contestants[newIndex]);
        }
        
    }
    else if (event.key === 'Escape') {
        selectContestant(null);
    }
    
});

function setPlayerModScore(player, scoreMod) {
    player.scoreMod = scoreMod;
    updatePlayerScores();
}

function playChanges() {
    selectContestant(null);
    flashBackground('#00FF00');
    enactScoreMods();
    updatePlayerScores();
    postPlayerScores();
    bc.postMessage('go');
}

function postPlayerScores() {
    contestants.forEach((contestant) => {
        bc.postMessage("S," + contestant.name + ',' + contestant.score);
    });
}


function flashBackground(hexColor, time=200) {
    const body = document.querySelector('body');
 
    body.style.backgroundColor = hexColor;
    setTimeout(() => {
        body.style.backgroundColor = "";
    }, time);
    
}

function resetScores() {
    selectContestant(null);
    flashBackground('#FF0000', 500);

    for (let i = 0; i < contestants.length; i++) {
        bc.postMessage("S," + contestants[i].name + ',' + i);
    }
    bc.postMessage('go');

    contestants.forEach((contestant) => {
        contestant.score = 0;
        contestant.scoreMod = 0;
    });
    updatePlayerScores();

    postPlayerScores();
    bc.postMessage('go');


}

resetButtonElement.addEventListener('click', () => {
    // get confirmation from user
    if (confirm('Are you sure you want to reset the scores?')) {
        resetScores();
    }
});

function resetModScores() {
    selectContestant(null);
    flashBackground('#FFFF00', 500);
    contestants.forEach((contestant) => {
        contestant.scoreMod = 0;
    });
    updatePlayerScores();
}

resetModBHuttonElement.addEventListener('click', () => {
    resetModScores();
});

body.addEventListener('click', (event) => {
    if (event.target.id === 'playerCardContainer') {
        selectContestant(null);
    }
});

function updateSelectedHighlight() {
    contestants.forEach((contestant) => {
        if (contestant === selectedContestant) {
            document.getElementById(contestant.name).style.outline = '3px solid #0033FF';
        } else {
            document.getElementById(contestant.name).style.outline = '';
        }
    });
}

function selectContestant(contestant) {
    selectedContestant = contestant;
    updateSelectedHighlight();
    updateHRSelectedContestant();
}





















//load Contestants

fetch('contestantinfo.json')
.then(response => response.json())
.then(data => {
    contestantsData = data["contestants"];
    contestantsData.forEach((contestant, index) => {
        addContestant(contestant.name, contestant.image);
    });
})
.then(() => {
    contestants.forEach((contestant, index) => {
        playerCardContainer.appendChild(createPlayerCardEl(contestant.name, contestant.image));
    });
})
.catch(error => {
    console.error('Error:', error);
});















// Heartrate shit

var showHR = false;

class HypeBeatWebSocket {
    constructor(sessionID) {
        this.sessionID = sessionID;
        this.ws = null;
        this.refIndex = 2;
        this.currentHR = 0;
        this.maxHR = 0;
        this.connected = false;
        this.timeSince = 0;
        this.numberAnimationTime = 1000;
    }

    start() {

        this.ws = new WebSocket("wss://app.hyperate.io/socket/websocket?token=astobRkornAHAizEZGIo3pVYBDHyrkEtw8v2AEP804fpQ0G4uRh0OHT3vtgBPTy2");


        this.ws.onopen = () => {
            console.log("CONNECTED TO WEBSOCKET");
            connectionReadoutDiv.innerText = "CONNECTED";
            connectionControlBoxDiv.style.backgroundColor = "#54905a"

            this.startHeartbeat();

            const payload = {
                "topic": "hr:" + this.sessionID,
                "event": "phx_join",
                "payload": {},
                "ref": this.refIndex++
            };

            this.ws.send(JSON.stringify(payload));
            console.log("SENT SUBSCRIPTION REQUEST");
            this.connected = true;
        };

        this.ws.onmessage = (e) => {
            const data = JSON.parse(e.data);

            if (data.event == "phx_reply") {
                console.log("PHX REPLY - STATUS:" + data.payload.status);
            } else if (data.event == "hr_update") {
                console.log("HR UPDATE - HR:" + data.payload.hr);
                this.handleNewHeartrate(data.payload.hr);
            } else {
                console.log("UNKNOWN EVENT" + e.data);
            }
        };

        this.ws.onclose = () => {
            console.log("WEBSOCKET CLOSED");
            this.connected = false;

            connectionReadoutDiv.innerText = "DISCONNECTED";
            connectionControlBoxDiv.style.backgroundColor = "rgb(144, 84, 84)";



        };
    }

    stop() {
        if (this.ws) {
            this.ws.close();
            console.log("STOPPING SESSION: " + this.sessionID);
            this.connected = false;
        }
    }

    handleNewHeartrate(hr) {
        lastHRdiv.innerText = this.currentHR;
        this.currentHR = hr;
        HRdiv.innerText = this.currentHR;

        if (this.currentHR > this.maxHR) {
            this.maxHR = this.currentHR;
            maxHRdiv.innerText = this.maxHR;
            handleNewMaxHR(this.maxHR);
        }


        bc.postMessage("H,now," + this.currentHR);


        this.timeSince = 0;
        lastHRdiv.innerText = this.timeSince + "s ago";
    }

    startHeartbeat() {
        const heartbeatRecursive = () => {
            if (this.connected) {
                this.sendHeartBeat();
                setTimeout(heartbeatRecursive, 30000);
            }
        };
        setTimeout(heartbeatRecursive, 30000);
    }

    sendHeartBeat() {
        const payload = {
            "topic": "phoenix",
            "event": "heartbeat",
            "payload": {},
            "ref": this.refIndex++
        };
        console.log("HEARTBEAT SENT");
        this.ws.send(JSON.stringify(payload));
    }

}


class localECGWebSocket {
    constructor(ipAddress) {
        this.ipAddress = ipAddress;
        this.ws = null;
        this.currentHR = 0;
        this.maxHR = 0;
        this.connected = false;
        this.timeSince = 0;
        this.numberAnimationTime = 1000;

        // create rolling average
        this.last4beats = [0,0,0,0];
    }

    start() {

        this.ws = new WebSocket("ws://" + this.ipAddress + ":81");

        this.ws.onopen = () => {
            this.connected = true;
            console.log("CONNECTED TO WEBSOCKET");
            connectionReadoutDiv.innerText = "CONNECTED";
            connectionControlBoxDiv.style.backgroundColor = "#54905a"
        };

        this.ws.onmessage = (e) => {
            const split = e.data.split(":");

            if (split[0] === "bpm") {
                this.handleNewHeartrate(parseInt(split[1]));
            }

            else if (split[0] === "leads") {
                if (split[1] === "disconnected") {
                    connectionReadoutDiv.innerText = "LEAD ISSUE";
                    connectionControlBoxDiv.style.backgroundColor = "rgb(152, 130, 40)";
                } else if (split[1] === "ok") {
                    connectionReadoutDiv.innerText = "CONNECTED";
                    connectionControlBoxDiv.style.backgroundColor = "#54905a"
                }
            }

            this.timeSince = 0;
            lastHRdiv.innerText = this.timeSince + "s ago";
        };

        this.ws.onclose = () => {
            console.log("WEBSOCKET CLOSED");
            this.connected = false;

            connectionReadoutDiv.innerText = "DISCONNECTED";
            connectionControlBoxDiv.style.backgroundColor = "rgb(144, 84, 84)";
        };
    }

    stop() {
        if (this.ws) {
            this.ws.close();
            console.log("STOPPING SESSION: " + this.sessionID);
            this.connected = false;
        }
    }

    handleNewHeartrate(hr) {
        // calculate rolling average
        this.last4beats.shift();
        this.last4beats.push(hr);
        hr = Math.round(this.last4beats.reduce((a, b) => a + b) / 4);

        this.currentHR = hr;
        HRdiv.innerText = this.currentHR;

        if (this.currentHR > this.maxHR) {
            this.maxHR = this.currentHR;
            maxHRdiv.innerText = this.maxHR;
            handleNewMaxHR(this.maxHR);
        }

        bc.postMessage("H,now," + this.currentHR);

        


        this.timeSince = 0;
        lastHRdiv.innerText = this.timeSince + "s ago";
    }
}



const displayHRButton = document.getElementById("displayhr-button");
const sessionIDInputDiv = document.getElementById("heartrateSession-input");
const startButton = document.getElementById("connect-button");
const stopButton = document.getElementById("disconnect-button");
const HRdiv = document.getElementById("currentHR");
const maxHRdiv = document.getElementById("maxHR");
const lastHRdiv = document.getElementById("lastHR");
const connectionControlBoxDiv = document.getElementById("connectionControlBox");
const connectionReadoutDiv = document.getElementById("connectionReadout");

let heartRateWebSocket = null;

startButton.addEventListener("click", () => {
    const sessionID = sessionIDInputDiv.value;
    if (sessionID.length == 4) {
        heartRateWebSocket = new HypeBeatWebSocket(sessionID);
    } else {
        heartRateWebSocket = new localECGWebSocket(sessionID);
    }
    heartRateWebSocket.start();
    startButton.disabled = true;
    stopButton.disabled = false;
});

stopButton.addEventListener("click", () => {
    if (heartRateWebSocket) {
        heartRateWebSocket.stop();
        startButton.disabled = false;
        stopButton.disabled = true;
    }
});

displayHRButton.addEventListener("click", () => {
    if (showHR == false) {
        showHR = true;
        bc.postMessage("HRSHOW");
        displayHRButton.innerText = "HIDE HR";
        displayHRButton.style.backgroundColor = "green";
    } else {
        showHR = false;
        bc.postMessage("HRHIDE");
        displayHRButton.innerText = "DISPLAY HR";
        displayHRButton.style.backgroundColor = "red";
    }
});

setInterval(() => {
    if (heartRateWebSocket && heartRateWebSocket.connected) {
        heartRateWebSocket.timeSince += 1;
        lastHRdiv.innerText = heartRateWebSocket.timeSince + "s ago";

        if (heartRateWebSocket.timeSince > 5) {
            lastHRdiv.style.color = "rgb(255, 0, 0)";
        } else {
            lastHRdiv.style.color = "rgb(0, 0, 0)";
        }
    }
}, 1000);


const maxHRControlDiv = document.getElementById("maxHRControl");
const beginMeasureButtonDiv = document.getElementById("beginMeasure-button");
const endMeasureButtonDiv = document.getElementById("endMeasure-button");
const selectedPersonDiv = document.getElementById("selectedPerson");
const measureTimeDiv = document.getElementById("maxHRTime"); 
const resetMaxHRsButton = document.getElementById("resetHRList-button"); 
const assignPointsButton = document.getElementById("assignModsFromHR-button");

// run function every time selectedContestant changes
function updateHRSelectedContestant() {
    if (selectedContestant != null) {
        selectedPersonDiv.innerText = selectedContestant.name;
    } else {
        selectedPersonDiv.innerText = "None";
    }
}

var measuring = false;
var measureTime = 0;

function beginMeasure() {
    if (selectedContestant == null) {
        return;
    }
    if (heartRateWebSocket == null) {
        return;
    }
    if (!heartRateWebSocket.connected) {
        return;
    }
    beginMeasureButtonDiv.disabled = true;
    endMeasureButtonDiv.disabled = false;
    heartRateWebSocket.maxHR = 0;
    maxHRdiv.innerText = 0;
    maxHRControlDiv.style.backgroundColor = "rgb(141, 144, 84)";
    measuring = true;
    measureTime = 0;
    measureTimeDiv.innerText = measureTime;
    setTimeout(countUpTimer, 1000);
    
}

function countUpTimer() {
    if (measuring) {
        measureTime += 1;
        measureTimeDiv.innerText = measureTime;
        setTimeout(countUpTimer, 1000);
    }
}

function endMeasure() {
    beginMeasureButtonDiv.disabled = false;
    endMeasureButtonDiv.disabled = true;
    maxHRControlDiv.style.backgroundColor = "rgb(84, 87, 144)";
    measuring = false;

    contestants[contestants.indexOf(selectedContestant)].maxHR = heartRateWebSocket.maxHR;

    renderMaxHRList();

}

beginMeasureButtonDiv.addEventListener("click", () => {
    beginMeasure();
    bc.postMessage("HIGHLIGHT," + selectedContestant.name);
});

endMeasureButtonDiv.addEventListener("click", () => {
    endMeasure();
    bc.postMessage("HIGHLIGHTCLEAR");
});

function renderMaxHRList() {
    const maxHRList = document.getElementById("maxHRList");
    maxHRList.innerHTML = "";

    const table = document.createElement("table");

    contestants.forEach((contestant) => {
        const row = document.createElement("tr");
        const nameCell = document.createElement("td");
        nameCell.innerText = contestant.name;
        const maxHRCell = document.createElement("td");
        maxHRCell.innerText = contestant.maxHR;
        row.appendChild(nameCell);
        row.appendChild(maxHRCell);
        table.appendChild(row);
    });

    maxHRList.replaceChildren(table);
    
}

setTimeout(() => {
    renderMaxHRList();
}, 250);


function resetMaxHRs() {
    contestants.forEach((contestant) => {
        contestant.maxHR = 0;
    });
    renderMaxHRList();
}

resetMaxHRsButton.addEventListener("click", () => {
    resetMaxHRs();
    measureTime = 0;
    measureTimeDiv.innerText = measureTime;
    bc.postMessage("HRRESET");
});


function assignPointsFromMaxHRs() {
    const sortedContestants = contestants.slice().sort((a, b) => b.maxHR - a.maxHR);

    var points = 5;

    for (let i = 0; i < sortedContestants.length; i++) {
        if (i > 0 && sortedContestants[i].maxHR < sortedContestants[i-1].maxHR) {
            points -= 1;
        }
        sortedContestants[i].scoreMod = points;
    }

    updatePlayerScores();
}

assignPointsButton.addEventListener("click", () => {
    assignPointsFromMaxHRs();
});

function handleNewMaxHR(newMaxHR) {
    if (measuring) {
        if (selectContestant != null) {
            bc.postMessage("H,max,"+newMaxHR+","+selectedContestant.name);
        }
    }
}